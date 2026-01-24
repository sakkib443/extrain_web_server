// ===================================================================
// MotionBoss LMS - Enrollment Interface
// Enrollment module TypeScript interface definitions
// এনরোলমেন্ট মডিউলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Enrollment Status Types
 */
export type TEnrollmentStatus = 'active' | 'completed' | 'expired' | 'cancelled';

/**
 * IEnrollment - Main Enrollment Interface
 * Student এর course enrollment data
 */
export interface IEnrollment {
    _id?: Types.ObjectId;

    // ==================== Core References ====================
    student: Types.ObjectId;          // User (student) reference
    course: Types.ObjectId;           // Course reference
    order?: Types.ObjectId;           // Payment/Order reference (optional for free courses)

    // ==================== Enrollment Details ====================
    enrolledAt: Date;                 // When enrolled
    expiresAt?: Date;                 // Expiry date (for time-limited access)

    // ==================== Progress ====================
    status: TEnrollmentStatus;        // Current status
    progress: number;                 // 0-100 percentage
    completedLessons: number;         // Count of completed lessons
    totalLessons: number;             // Total lessons in course (cached)

    // ==================== Activity ====================
    lastAccessedAt?: Date;            // Last time student accessed
    lastLessonId?: Types.ObjectId;    // Last viewed lesson
    completedAt?: Date;               // When course was completed

    // ==================== Certificate ====================
    certificateId?: Types.ObjectId;   // Generated certificate reference
    certificateEligible: boolean;     // Eligible for certificate

    // ==================== Timestamps ====================
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IEnrollmentFilters - Query Filters
 */
export interface IEnrollmentFilters {
    student?: string;
    course?: string;
    status?: TEnrollmentStatus;
    certificateEligible?: boolean;
}

/**
 * IEnrollmentStats - Student's enrollment statistics
 */
export interface IEnrollmentStats {
    totalEnrolled: number;
    inProgress: number;
    completed: number;
    certificatesEarned: number;
}

/**
 * EnrollmentModel - Mongoose Model Type
 */
export interface EnrollmentModel extends Model<IEnrollment> {
    isEnrolled(studentId: string, courseId: string): Promise<boolean>;
    getStudentEnrollments(studentId: string): Promise<IEnrollment[]>;
    getCourseEnrollments(courseId: string): Promise<IEnrollment[]>;
}
