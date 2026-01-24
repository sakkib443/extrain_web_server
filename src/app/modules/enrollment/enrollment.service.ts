// ===================================================================
// MotionBoss LMS - Enrollment Service
// Business logic for Enrollment module
// এনরোলমেন্ট মডিউলের বিজনেস লজিক
// ===================================================================

import { Enrollment } from './enrollment.model';
import { Course } from '../course/course.model';
import { Lesson } from '../lesson/lesson.model';
import { User } from '../user/user.model';
import { IEnrollment, IEnrollmentFilters, IEnrollmentStats } from './enrollment.interface';
import AppError from '../../utils/AppError';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.module';

/**
 * Enroll student in a course
 */
const enrollStudent = async (
    studentId: string,
    courseId: string,
    orderId?: string
): Promise<IEnrollment> => {
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
        throw new AppError(404, 'Student not found');
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
    });

    if (existingEnrollment) {
        // If cancelled or expired, reactivate
        if (existingEnrollment.status === 'cancelled' || existingEnrollment.status === 'expired') {
            existingEnrollment.status = 'active';
            existingEnrollment.enrolledAt = new Date();
            existingEnrollment.expiresAt = undefined;
            await existingEnrollment.save();
            return existingEnrollment;
        }
        throw new AppError(400, 'Student is already enrolled in this course');
    }

    // Get total lessons count
    const totalLessons = await Lesson.countDocuments({
        course: courseId,
        isPublished: true,
    });

    // Create enrollment
    const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        order: orderId,
        totalLessons,
        enrolledAt: new Date(),
    });

    // Update course enrollment count
    await Course.findByIdAndUpdate(courseId, {
        $inc: { totalEnrollments: 1 },
    });

    // Update user's enrolled courses
    await User.findByIdAndUpdate(studentId, {
        $addToSet: { enrolledCourses: courseId },
        $inc: { totalCoursesEnrolled: 1 },
    });

    // Create notification for admin
    try {
        await NotificationService.createEnrollmentNotification({
            enrollmentId: enrollment._id as Types.ObjectId,
            userId: new Types.ObjectId(studentId),
            userName: `${student.firstName} ${student.lastName || ''}`.trim(),
            courseId: new Types.ObjectId(courseId),
            courseName: course.title,
        });
    } catch (err) {
        console.error('Enrollment notification error:', err);
    }

    return enrollment;
};

/**
 * Get enrollment by ID
 */
const getEnrollmentById = async (enrollmentId: string): Promise<IEnrollment> => {
    const enrollment = await Enrollment.findById(enrollmentId)
        .populate('course', 'title titleBn slug thumbnail totalLessons totalDuration')
        .populate('student', 'firstName lastName email avatar');

    if (!enrollment) {
        throw new AppError(404, 'Enrollment not found');
    }

    return enrollment;
};

/**
 * Get student's enrollment for a specific course
 */
const getStudentCourseEnrollment = async (
    studentId: string,
    courseId: string
): Promise<IEnrollment | null> => {
    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
    })
        .populate('course', 'title titleBn slug thumbnail')
        .populate('lastLessonId', 'title titleBn order');

    return enrollment;
};

/**
 * Get all enrollments for a student
 */
const getStudentEnrollments = async (
    studentId: string,
    status?: string
): Promise<IEnrollment[]> => {
    const query: any = { student: studentId };
    if (status) {
        query.status = status;
    }

    const enrollments = await Enrollment.find(query)
        .populate('course', 'title titleBn slug thumbnail totalLessons totalDuration averageRating')
        .sort({ lastAccessedAt: -1, enrolledAt: -1 });

    return enrollments;
};

/**
 * Get all enrollments for a course (admin)
 */
const getCourseEnrollments = async (
    courseId: string,
    paginationOptions: { page?: number; limit?: number }
) => {
    const { page = 1, limit = 20 } = paginationOptions;
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({ course: courseId })
        .populate('student', 'firstName lastName email avatar phone')
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Enrollment.countDocuments({ course: courseId });

    return {
        data: enrollments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update enrollment progress
 */
const updateProgress = async (
    studentId: string,
    courseId: string,
    completedLessonId: string
): Promise<IEnrollment | null> => {
    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
        status: 'active',
    });

    if (!enrollment) {
        throw new AppError(404, 'Enrollment not found or not active');
    }

    // Get total published lessons
    const totalLessons = await Lesson.countDocuments({
        course: courseId,
        isPublished: true,
    });

    // Increment completed lessons count (avoid duplicates using lesson progress tracking)
    enrollment.completedLessons = Math.min(enrollment.completedLessons + 1, totalLessons);
    enrollment.totalLessons = totalLessons;
    enrollment.lastAccessedAt = new Date();
    enrollment.lastLessonId = new Types.ObjectId(completedLessonId);

    await enrollment.save();

    return enrollment;
};

/**
 * Update last accessed lesson
 */
const updateLastAccessed = async (
    studentId: string,
    courseId: string,
    lessonId: string
): Promise<void> => {
    await Enrollment.findOneAndUpdate(
        { student: studentId, course: courseId },
        {
            lastAccessedAt: new Date(),
            lastLessonId: new Types.ObjectId(lessonId),
        }
    );
};

/**
 * Check if student is enrolled
 */
const isEnrolled = async (studentId: string, courseId: string): Promise<boolean> => {
    const enrollment = await Enrollment.findOne({
        student: studentId,
        course: courseId,
        status: { $in: ['active', 'completed'] },
    });
    return !!enrollment;
};

/**
 * Get student's enrollment statistics
 */
const getStudentStats = async (studentId: string): Promise<IEnrollmentStats> => {
    const stats = await Enrollment.aggregate([
        { $match: { student: new Types.ObjectId(studentId) } },
        {
            $group: {
                _id: null,
                totalEnrolled: { $sum: 1 },
                inProgress: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                certificatesEarned: {
                    $sum: { $cond: [{ $ne: ['$certificateId', null] }, 1, 0] },
                },
            },
        },
    ]);

    return stats[0] || {
        totalEnrolled: 0,
        inProgress: 0,
        completed: 0,
        certificatesEarned: 0,
    };
};

/**
 * Cancel enrollment
 */
const cancelEnrollment = async (
    enrollmentId: string,
    reason?: string
): Promise<IEnrollment | null> => {
    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
        throw new AppError(404, 'Enrollment not found');
    }

    enrollment.status = 'cancelled';
    await enrollment.save();

    // Update course stats
    await Course.findByIdAndUpdate(enrollment.course, {
        $inc: { totalEnrollments: -1 },
    });

    return enrollment;
};

/**
 * Mark enrollment as completed
 */
const markAsCompleted = async (enrollmentId: string): Promise<IEnrollment | null> => {
    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
        throw new AppError(404, 'Enrollment not found');
    }

    enrollment.status = 'completed';
    enrollment.progress = 100;
    enrollment.completedAt = new Date();
    enrollment.certificateEligible = true;
    await enrollment.save();

    // Update user's completed courses
    await User.findByIdAndUpdate(enrollment.student, {
        $addToSet: { completedCourses: enrollment.course },
        $inc: { totalCoursesCompleted: 1 },
    });

    return enrollment;
};

export const EnrollmentService = {
    enrollStudent,
    getEnrollmentById,
    getStudentCourseEnrollment,
    getStudentEnrollments,
    getCourseEnrollments,
    updateProgress,
    updateLastAccessed,
    isEnrolled,
    getStudentStats,
    cancelEnrollment,
    markAsCompleted,
};
