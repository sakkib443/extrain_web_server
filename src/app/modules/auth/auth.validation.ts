// ===================================================================
// MotionBoss LMS - Auth Validation
// Zod validation schemas for authentication
// ===================================================================

import { z } from 'zod';

/**
 * Register Validation Schema
 * নতুন user registration এর জন্য validation
 */
export const registerValidation = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email'),

    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),

    firstName: z
      .string({
        required_error: 'First name is required',
      })
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters'),

    lastName: z
      .string({
        required_error: 'Last name is required',
      })
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters'),

    phone: z.string().optional(),

    role: z.enum(['student', 'admin']).optional().default('student'),
  }),
});

/**
 * Login Validation Schema
 * Login করার সময় validation
 */
export const loginValidation = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email'),

    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(1, 'Password is required'),
  }),
});

/**
 * Refresh Token Validation Schema
 * Token refresh করার সময় validation
 */
export const refreshTokenValidation = z.object({
  body: z.object({
    refreshToken: z
      .string({
        required_error: 'Refresh token is required',
      })
      .min(1, 'Refresh token is required'),
  }),
});

/**
 * Forgot Password Validation Schema
 * Password reset email request এর জন্য validation
 */
export const forgotPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please provide a valid email'),
  }),
});

/**
 * Reset Password Validation Schema
 * Password reset করার সময় validation
 */
export const resetPasswordValidation = z.object({
  body: z.object({
    token: z
      .string({
        required_error: 'Reset token is required',
      })
      .min(1, 'Reset token is required'),

    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password cannot exceed 50 characters'),

    confirmPassword: z
      .string({
        required_error: 'Confirm password is required',
      }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * Update Password Validation Schema
 * Logged-in user এর password change করার সময় validation
 */
export const updatePasswordValidation = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'Current password is required',
      })
      .min(1, 'Current password is required'),

    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'New password must be at least 6 characters')
      .max(50, 'New password cannot exceed 50 characters'),

    confirmNewPassword: z
      .string({
        required_error: 'Confirm new password is required',
      }),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  }),
});

// Export types
export type TRegisterInput = z.infer<typeof registerValidation>['body'];
export type TLoginInput = z.infer<typeof loginValidation>['body'];
