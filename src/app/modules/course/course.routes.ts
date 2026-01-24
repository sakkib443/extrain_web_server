// ===================================================================
// MotionBoss LMS - Course Routes
// Course module এর API endpoints
// কোর্স মডিউলের API রাউটস
// ===================================================================

import express from 'express';
import { CourseController } from './course.controller';
import { CourseValidation } from './course.validation';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

// ==================== Public Routes ====================
// এই routes সবার জন্য accessible

// Get all published courses with filters
router.get(
    '/',
    CourseController.getAllCourses
);

// Get featured courses
router.get(
    '/featured',
    CourseController.getFeaturedCourses
);

// Get popular courses
router.get(
    '/popular',
    CourseController.getPopularCourses
);

// Get course by slug (public view)
router.get(
    '/slug/:slug',
    optionalAuth,
    CourseController.getCourseBySlug
);

// Get courses by category
router.get(
    '/category/:categoryId',
    CourseController.getCoursesByCategory
);

// Get single course by ID
router.get(
    '/:id',
    optionalAuth,
    CourseController.getCourseById
);

// ==================== Student Routes ====================

// Get full course content for enrolled student
router.get(
    '/:id/content',
    authMiddleware,
    CourseController.getCourseContentForStudent
);

// Toggle course like
router.post(
    '/:id/toggle-like',
    authMiddleware,
    CourseController.toggleLike
);

// Sync all course statistics (Admin only)
router.post(
    '/sync-stats',
    authMiddleware,
    authorizeRoles('admin'),
    CourseController.syncAllCourseStats
);

// ==================== Admin Only Routes ====================
// শুধুমাত্র Admin এই routes access করতে পারবে

// Create new course (Admin and Mentor)
router.post(
    '/',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(CourseValidation.createCourseSchema),
    CourseController.createCourse
);

// Update course (Admin and Mentor)
router.patch(
    '/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(CourseValidation.updateCourseSchema),
    CourseController.updateCourse
);

// Delete course
router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    CourseController.deleteCourse
);

export const CourseRoutes = router;
