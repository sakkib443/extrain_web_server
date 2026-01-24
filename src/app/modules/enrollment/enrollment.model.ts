// ===================================================================
// MotionBoss LMS - Enrollment Model
// MongoDB Enrollment Schema with Mongoose
// এনরোলমেন্ট কালেকশনের Mongoose স্কিমা
// ===================================================================

import { Schema, model } from 'mongoose';
import { IEnrollment, EnrollmentModel } from './enrollment.interface';

/**
 * Enrollment Schema Definition
 */
const enrollmentSchema = new Schema<IEnrollment, EnrollmentModel>(
    {
        // ==================== Core References ====================
        student: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
            index: true,
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course reference is required'],
            index: true,
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },

        // ==================== Enrollment Details ====================
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
        },

        // ==================== Progress ====================
        status: {
            type: String,
            enum: {
                values: ['active', 'completed', 'expired', 'cancelled'],
                message: '{VALUE} is not a valid status',
            },
            default: 'active',
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completedLessons: {
            type: Number,
            default: 0,
        },
        totalLessons: {
            type: Number,
            default: 0,
        },

        // ==================== Activity ====================
        lastAccessedAt: {
            type: Date,
        },
        lastLessonId: {
            type: Schema.Types.ObjectId,
            ref: 'Lesson',
        },
        completedAt: {
            type: Date,
        },

        // ==================== Certificate ====================
        certificateId: {
            type: Schema.Types.ObjectId,
            ref: 'Certificate',
        },
        certificateEligible: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ==================== Indexes ====================
// Compound index for unique enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ expiresAt: 1 });

// ==================== Pre-Save Middleware ====================
enrollmentSchema.pre('save', function (next) {
    // Calculate progress percentage
    if (this.totalLessons > 0) {
        this.progress = Math.round((this.completedLessons / this.totalLessons) * 100);
    }

    // Auto-complete course when all lessons are done
    if (this.progress >= 100 && this.status === 'active') {
        this.status = 'completed';
        this.completedAt = new Date();
        this.certificateEligible = true;
    }

    next();
});

// ==================== Static Methods ====================

/**
 * Check if student is enrolled in a course
 */
enrollmentSchema.statics.isEnrolled = async function (
    studentId: string,
    courseId: string
): Promise<boolean> {
    const enrollment = await this.findOne({
        student: studentId,
        course: courseId,
        status: { $in: ['active', 'completed'] },
    });
    return !!enrollment;
};

/**
 * Get all enrollments for a student
 */
enrollmentSchema.statics.getStudentEnrollments = async function (
    studentId: string
): Promise<IEnrollment[]> {
    return await this.find({ student: studentId })
        .populate('course', 'title titleBn slug thumbnail')
        .sort({ enrolledAt: -1 });
};

/**
 * Get all enrollments for a course
 */
enrollmentSchema.statics.getCourseEnrollments = async function (
    courseId: string
): Promise<IEnrollment[]> {
    return await this.find({ course: courseId })
        .populate('student', 'firstName lastName email avatar')
        .sort({ enrolledAt: -1 });
};

// ==================== Export Model ====================
export const Enrollment = model<IEnrollment, EnrollmentModel>('Enrollment', enrollmentSchema);
