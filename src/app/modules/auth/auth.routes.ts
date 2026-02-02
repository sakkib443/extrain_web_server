// ===================================================================
// ExtraWeb Backend - Auth Routes
// API endpoints for Authentication
// ===================================================================

import express from 'express';
import AuthController from './auth.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
    registerValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updatePasswordValidation,
} from './auth.validation';
import { authMiddleware } from '../../middlewares/auth';

const router = express.Router();

// ===================================================================
// AUTH ROUTES (All Public - No Authentication Required)
// ===================================================================

/**
 * POST /api/auth/register
 * Register a new user
 * নতুন user registration
 */
router.post(
    '/register',
    validateRequest(registerValidation),
    AuthController.register
);

/**
 * POST /api/auth/login
 * Login with email and password
 * Email password দিয়ে login
 */
router.post(
    '/login',
    validateRequest(loginValidation),
    AuthController.login
);

/**
 * POST /api/auth/google-login
 * Login or Register with Google Info
 */
router.post(
    '/google-login',
    AuthController.googleLogin
);

/**
 * POST /api/auth/refresh-token
 * Get new access token using refresh token
 * নতুন access token নেওয়া
 */
router.post(
    '/refresh-token',
    validateRequest(refreshTokenValidation),
    AuthController.refreshToken
);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Password reset এর জন্য email পাঠানো
 */
router.post(
    '/forgot-password',
    validateRequest(forgotPasswordValidation),
    AuthController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 * Token দিয়ে password reset করা
 */
router.post(
    '/reset-password',
    validateRequest(resetPasswordValidation),
    AuthController.resetPassword
);

/**
 * POST /api/auth/update-password
 * Update password for logged-in user
 * Logged-in user এর password change করা
 */
router.post(
    '/update-password',
    authMiddleware,
    validateRequest(updatePasswordValidation),
    AuthController.updatePassword
);

/**
 * POST /api/auth/logout
 * Logout user (clear cookies)
 * Logout করা
 */
router.post('/logout', AuthController.logout);

export const AuthRoutes = router;
