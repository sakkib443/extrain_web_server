// ===================================================================
// MotionBoss LMS - Design Validation
// Zod validation schemas for Design module
// ===================================================================

import { z } from 'zod';

const heroContentValidation = z.object({
    badge: z.object({
        text: z.string().optional(),
        textBn: z.string().optional(),
        showNew: z.boolean().optional()
    }).optional(),
    heading: z.object({
        line1: z.string().optional(),
        line1Bn: z.string().optional()
    }).optional(),
    dynamicTexts: z.array(z.string()).optional(),
    dynamicTextsBn: z.array(z.string()).optional(),
    description: z.object({
        text: z.string().optional(),
        textBn: z.string().optional(),
        brandName: z.string().optional()
    }).optional(),
    features: z.array(z.object({
        text: z.string(),
        textBn: z.string()
    })).optional(),
    searchPlaceholder: z.object({
        text: z.string().optional(),
        textBn: z.string().optional()
    }).optional(),
    stats: z.object({
        activeUsers: z.number().optional(),
        downloads: z.number().optional(),
        avgRating: z.number().optional(),
        totalCourses: z.number().optional()
    }).optional()
});

const createDesignZodSchema = z.object({
    body: z.object({
        section: z.enum(['hero', 'about', 'footer', 'topHeader', 'navbar']),
        heroContent: heroContentValidation.optional(),
        isActive: z.boolean().optional()
    })
});

const updateDesignZodSchema = z.object({
    body: z.object({
        section: z.enum(['hero', 'about', 'footer', 'topHeader', 'navbar']).optional(),
        heroContent: heroContentValidation.optional(),
        isActive: z.boolean().optional()
    })
});

export const DesignValidation = {
    createDesignZodSchema,
    updateDesignZodSchema
};
