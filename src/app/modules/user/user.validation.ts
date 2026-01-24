// ===================================================================
// MotionBoss LMS - User Validation
// Zod দিয়ে User data validation schemas
// ===================================================================

import { z } from 'zod';

/**
 * Create User Validation Schema
 * নতুন user তৈরি করার সময় এই validation চলবে
 */
export const createUserValidation = z.object({
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

    phone: z
      .string({
        required_error: 'Phone number is required',
      })
      .min(11, 'Phone number must be at least 11 digits')
      .max(14, 'Phone number cannot exceed 14 digits')
      .regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please provide a valid Bangladeshi phone number'),

    avatar: z.string().url('Avatar must be a valid URL').optional(),

    role: z.enum(['admin', 'mentor', 'student']).optional().default('student'),
  }),
});

/**
 * Update User Validation Schema
 * User profile update করার সময় এই validation চলবে
 */
export const updateUserValidation = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),

    phone: z
      .string()
      .min(11, 'Phone number must be at least 11 digits')
      .max(14, 'Phone number cannot exceed 14 digits')
      .regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please provide a valid Bangladeshi phone number')
      .optional(),

    avatar: z.string().url('Avatar must be a valid URL').optional(),
  }),
});

/**
 * Admin Update User Validation Schema
 * Admin যখন user update করবে (role, status change)
 */
export const adminUpdateUserValidation = z.object({
  body: z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    role: z.enum(['admin', 'mentor', 'student']).optional(),
    status: z.enum(['active', 'blocked', 'pending']).optional(),
    isEmailVerified: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({
      required_error: 'User ID is required',
    }),
  }),
});

/**
 * Change Password Validation Schema
 * Password change করার সময় validation
 */
export const changePasswordValidation = z.object({
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

    confirmPassword: z
      .string({
        required_error: 'Confirm password is required',
      }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * User Query Validation Schema
 * User list query parameters validation
 */
export const userQueryValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    searchTerm: z.string().optional(),
    role: z.enum(['admin', 'mentor', 'student']).optional(),
    status: z.enum(['active', 'blocked', 'pending']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

// Export types for use in services
export type TCreateUserInput = z.infer<typeof createUserValidation>['body'];
export type TUpdateUserInput = z.infer<typeof updateUserValidation>['body'];
