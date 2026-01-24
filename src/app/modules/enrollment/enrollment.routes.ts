// ===================================================================
// MotionBoss LMS - Enrollment Routes
// Enrollment module এর API endpoints
// এনরোলমেন্ট মডিউলের API রাউটস
// ===================================================================

import express from 'express';
import { EnrollmentController } from './enrollment.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

const router = express.Router();

// ==================== Student Routes (Authenticated) ====================

// Enroll in a course
router.post(
    '/',
    authMiddleware,
    EnrollmentController.enrollInCourse
);

// Get my enrollments
router.get(
    '/my',
    authMiddleware,
    EnrollmentController.getMyEnrollments
);

// Get my statistics
router.get(
    '/my/stats',
    authMiddleware,
    EnrollmentController.getMyStats
);

// Check enrollment status for a course
router.get(
    '/check/:courseId',
    authMiddleware,
    EnrollmentController.checkEnrollment
);

// Get my enrollment for a specific course
router.get(
    '/course/:courseId',
    authMiddleware,
    EnrollmentController.getMyCourseEnrollment
);

// Update progress (mark lesson as complete)
router.post(
    '/progress',
    authMiddleware,
    EnrollmentController.updateProgress
);

// Update last accessed lesson
router.patch(
    '/last-accessed',
    authMiddleware,
    EnrollmentController.updateLastAccessed
);

// ==================== Admin Routes ====================

// Admin: Enroll a student manually
router.post(
    '/admin/enroll',
    authMiddleware,
    authorizeRoles('admin'),
    EnrollmentController.adminEnrollStudent
);

// Admin: Get course enrollments
router.get(
    '/admin/course/:courseId',
    authMiddleware,
    authorizeRoles('admin'),
    EnrollmentController.getCourseEnrollments
);

// Admin: Cancel enrollment
router.patch(
    '/admin/:id/cancel',
    authMiddleware,
    authorizeRoles('admin'),
    EnrollmentController.cancelEnrollment
);

// Admin: Mark as completed
router.patch(
    '/admin/:id/complete',
    authMiddleware,
    authorizeRoles('admin'),
    EnrollmentController.markAsCompleted
);

// Get enrollment by ID
router.get(
    '/:id',
    authMiddleware,
    EnrollmentController.getEnrollmentById
);

export const EnrollmentRoutes = router;
