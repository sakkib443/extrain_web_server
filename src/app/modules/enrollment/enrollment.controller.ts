// ===================================================================
// MotionBoss LMS - Enrollment Controller
// HTTP request handlers for Enrollment module
// এনরোলমেন্ট মডিউলের HTTP রিকোয়েস্ট হ্যান্ডলার
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from './enrollment.service';

/**
 * Enroll in a course
 * POST /api/enrollments
 */
const enrollInCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { courseId, orderId } = req.body;

        const enrollment = await EnrollmentService.enrollStudent(studentId, courseId, orderId);

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in the course',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my enrollments
 * GET /api/enrollments/my
 */
const getMyEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { status } = req.query;

        const enrollments = await EnrollmentService.getStudentEnrollments(
            studentId,
            status as string
        );

        res.status(200).json({
            success: true,
            message: 'Enrollments retrieved successfully',
            data: enrollments,
            meta: {
                total: enrollments.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my statistics
 * GET /api/enrollments/my/stats
 */
const getMyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const stats = await EnrollmentService.getStudentStats(studentId);

        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get enrollment for a specific course
 * GET /api/enrollments/course/:courseId
 */
const getMyCourseEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { courseId } = req.params;

        const enrollment = await EnrollmentService.getStudentCourseEnrollment(studentId, courseId);

        res.status(200).json({
            success: true,
            message: 'Enrollment retrieved successfully',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check enrollment status
 * GET /api/enrollments/check/:courseId
 */
const checkEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { courseId } = req.params;

        const isEnrolled = await EnrollmentService.isEnrolled(studentId, courseId);

        res.status(200).json({
            success: true,
            data: {
                isEnrolled,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update progress (mark lesson as complete)
 * POST /api/enrollments/progress
 */
const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { courseId, lessonId } = req.body;

        const enrollment = await EnrollmentService.updateProgress(studentId, courseId, lessonId);

        res.status(200).json({
            success: true,
            message: 'Progress updated successfully',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update last accessed lesson
 * PATCH /api/enrollments/last-accessed
 */
const updateLastAccessed = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = req.user!.userId;
        const { courseId, lessonId } = req.body;

        await EnrollmentService.updateLastAccessed(studentId, courseId, lessonId);

        res.status(200).json({
            success: true,
            message: 'Last accessed updated',
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Admin Routes ====================

/**
 * Admin: Enroll a student
 * POST /api/enrollments/admin/enroll
 */
const adminEnrollStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { studentId, courseId } = req.body;

        const enrollment = await EnrollmentService.enrollStudent(studentId, courseId);

        res.status(201).json({
            success: true,
            message: 'Student enrolled successfully',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Get course enrollments
 * GET /api/enrollments/admin/course/:courseId
 */
const getCourseEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const { page, limit } = req.query;

        const result = await EnrollmentService.getCourseEnrollments(courseId, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });

        res.status(200).json({
            success: true,
            message: 'Course enrollments retrieved',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Cancel enrollment
 * PATCH /api/enrollments/admin/:id/cancel
 */
const cancelEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const enrollment = await EnrollmentService.cancelEnrollment(id, reason);

        res.status(200).json({
            success: true,
            message: 'Enrollment cancelled',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin: Mark as completed
 * PATCH /api/enrollments/admin/:id/complete
 */
const markAsCompleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const enrollment = await EnrollmentService.markAsCompleted(id);

        res.status(200).json({
            success: true,
            message: 'Enrollment marked as completed',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get enrollment by ID
 * GET /api/enrollments/:id
 */
const getEnrollmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const enrollment = await EnrollmentService.getEnrollmentById(id);

        res.status(200).json({
            success: true,
            message: 'Enrollment retrieved',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
};

export const EnrollmentController = {
    enrollInCourse,
    getMyEnrollments,
    getMyStats,
    getMyCourseEnrollment,
    checkEnrollment,
    updateProgress,
    updateLastAccessed,
    adminEnrollStudent,
    getCourseEnrollments,
    cancelEnrollment,
    markAsCompleted,
    getEnrollmentById,
};
