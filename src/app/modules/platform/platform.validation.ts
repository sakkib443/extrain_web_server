// ===================================================================
// ExtraWeb Backend - Platform Validation
// ===================================================================

import { z } from 'zod';

export const createPlatformValidation = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).min(1).max(50),
        slug: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().max(500).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        order: z.number().optional(),
    }),
});

export const updatePlatformValidation = z.object({
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().max(500).optional(),
        status: z.enum(['active', 'inactive']).optional(),
        order: z.number().optional(),
    }),
    params: z.object({
        id: z.string({ required_error: 'ID is required' }),
    }),
});

export type TCreatePlatformInput = z.infer<typeof createPlatformValidation>['body'];
