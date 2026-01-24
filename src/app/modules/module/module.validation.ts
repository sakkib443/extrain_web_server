// ===================================================================
// MotionBoss LMS - Module Validation
// Zod validation schemas for Module module
// ===================================================================

import { z } from 'zod';

/**
 * Create Module Validation Schema
 */
const createModuleSchema = z.object({
    body: z.object({
        course: z.string({ required_error: 'Course ID is required' }),
        title: z
            .string({ required_error: 'Title is required' })
            .min(1, 'Title is required')
            .max(200, 'Title cannot exceed 200 characters'),
        titleBn: z
            .string()
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional()
            .or(z.literal('')),
        description: z.string().optional().or(z.literal('')),
        order: z.number().min(1, 'Order must be at least 1'),
        isPublished: z.boolean().optional().default(true),
    }),
});

/**
 * Update Module Validation Schema
 */
const updateModuleSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        titleBn: z.string().max(200).optional().or(z.literal('')),
        description: z.string().optional().or(z.literal('')),
        order: z.number().min(1).optional(),
        isPublished: z.boolean().optional(),
    }),
});

export const ModuleValidation = {
    createModuleSchema,
    updateModuleSchema,
};
