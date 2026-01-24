// ===================================================================
// ExtraWeb Backend - User Routes
// API endpoints for User module
// ===================================================================

import express from 'express';
import UserController from './user.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import {
    updateUserValidation,
    changePasswordValidation,
    adminUpdateUserValidation,
    userQueryValidation,
} from './user.validation';

const router = express.Router();

// ===================================================================
// PUBLIC USER ROUTES (Authenticated users)
// ===================================================================

/**
 * GET /api/users/me
 * Get current logged in user's profile
 * নিজের প্রোফাইল দেখা
 */
router.get('/me', authMiddleware, UserController.getMyProfile);

/**
 * PATCH /api/users/me
 * Update current logged in user's profile
 * নিজের প্রোফাইল আপডেট করা
 */
router.patch(
    '/me',
    authMiddleware,
    validateRequest(updateUserValidation),
    UserController.updateMyProfile
);

/**
 * PATCH /api/users/change-password
 * Change password for current user
 * পাসওয়ার্ড পরিবর্তন করা
 */
router.patch(
    '/change-password',
    authMiddleware,
    validateRequest(changePasswordValidation),
    UserController.changePassword
);

// ===================================================================
// ADMIN ROUTES
// ===================================================================

/**
 * GET /api/users/admin/stats
 * Get user statistics for admin dashboard
 * Admin dashboard এর জন্য user statistics
 */
router.get(
    '/admin/stats',
    authMiddleware,
    authorizeRoles('admin'),
    UserController.getUserStats
);

/**
 * GET /api/users/admin/all
 * Get all users (admin only)
 * সব users দেখা (শুধু admin)
 */
router.get(
    '/admin/all',
    authMiddleware,
    authorizeRoles('admin'),
    validateRequest(userQueryValidation),
    UserController.getAllUsers
);

/**
 * GET /api/users/admin/:id
 * Get single user by ID (admin only)
 * Single user details দেখা
 */
router.get(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    UserController.getSingleUser
);

/**
 * PATCH /api/users/admin/:id
 * Update user by ID (admin only) - role, status change
 * User এর role, status পরিবর্তন করা
 */
router.patch(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    validateRequest(adminUpdateUserValidation),
    UserController.updateUser
);

/**
 * DELETE /api/users/admin/:id
 * Soft delete user by ID (admin only)
 * User delete করা (soft delete)
 */
router.delete(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    UserController.deleteUser
);

export const UserRoutes = router;
