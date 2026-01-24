// ===================================================================
// MotionBoss LMS - Course Validation
// Zod validation schemas for Course module
// কোর্স মডিউলের জন্য Zod ভ্যালিডেশন স্কিমা
// ===================================================================

import { z } from 'zod';

/**
 * Create Course Validation Schema
 * নতুন কোর্স তৈরি করার সময় এই validation চলবে
 */
const createCourseSchema = z.object({
    body: z.object({
        // Required fields
        title: z
            .string({ required_error: 'Title is required' })
            .min(3, 'Title must be at least 3 characters')
            .max(200, 'Title cannot exceed 200 characters'),

        titleBn: z
            .string()
            .min(3, 'Bengali title must be at least 3 characters')
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional()
            .or(z.literal('')),

        description: z
            .string({ required_error: 'Description is required' })
            .min(50, 'Description must be at least 50 characters'),

        descriptionBn: z
            .string()
            .min(50, 'Bengali description must be at least 50 characters')
            .optional()
            .or(z.literal('')),

        thumbnail: z
            .string({ required_error: 'Thumbnail is required' })
            .url('Thumbnail must be a valid URL'),

        category: z
            .string({ required_error: 'Category is required' }),

        price: z
            .number({ required_error: 'Price is required' })
            .min(0, 'Price cannot be negative'),

        // Optional fields
        shortDescription: z
            .string()
            .max(500, 'Short description cannot exceed 500 characters')
            .optional(),

        shortDescriptionBn: z
            .string()
            .max(500, 'Bengali short description cannot exceed 500 characters')
            .optional()
            .or(z.literal('')),

        previewVideo: z.string().url().optional().or(z.literal('')),
        bannerImage: z.string().url().optional().or(z.literal('')),

        tags: z.array(z.string()).optional(),

        discountPrice: z.number().min(0).optional(),
        currency: z.enum(['BDT', 'USD']).optional().default('BDT'),
        isFree: z.boolean().optional(),

        courseType: z.enum(['online', 'offline', 'recorded']).optional().default('recorded'),
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
        language: z.enum(['bangla', 'english', 'both']).optional().default('bangla'),

        totalDuration: z.number().min(0).optional(),
        totalLessons: z.number().min(0).optional(),
        totalModules: z.number().min(0).optional(),

        features: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        whatYouWillLearn: z.array(z.string()).optional(),
        targetAudience: z.array(z.string()).optional(),

        status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
        isFeatured: z.boolean().optional(),
        isPopular: z.boolean().optional(),

        metaTitle: z.string().max(100).optional(),
        metaDescription: z.string().max(300).optional(),
    }),
});

/**
 * Update Course Validation Schema
 * কোর্স আপডেট করার সময় এই validation চলবে
 * সব ফিল্ড optional
 */
const updateCourseSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(200).optional(),
        titleBn: z.string().min(3).max(200).optional().or(z.literal('')),
        description: z.string().min(50).optional(),
        descriptionBn: z.string().min(50).optional().or(z.literal('')),
        shortDescription: z.string().max(500).optional(),
        shortDescriptionBn: z.string().max(500).optional().or(z.literal('')),

        thumbnail: z.string().url().optional(),
        previewVideo: z.string().url().optional().or(z.literal('')),
        bannerImage: z.string().url().optional().or(z.literal('')),

        category: z.string().optional(),
        tags: z.array(z.string()).optional(),

        price: z.number().min(0).optional(),
        discountPrice: z.number().min(0).optional().nullable(),
        currency: z.enum(['BDT', 'USD']).optional(),
        isFree: z.boolean().optional(),

        courseType: z.enum(['online', 'offline', 'recorded']).optional(),
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        language: z.enum(['bangla', 'english', 'both']).optional(),

        totalDuration: z.number().min(0).optional(),
        totalLessons: z.number().min(0).optional(),
        totalModules: z.number().min(0).optional(),

        features: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        whatYouWillLearn: z.array(z.string()).optional(),
        targetAudience: z.array(z.string()).optional(),

        status: z.enum(['draft', 'published', 'archived']).optional(),
        isFeatured: z.boolean().optional(),
        isPopular: z.boolean().optional(),

        metaTitle: z.string().max(100).optional(),
        metaDescription: z.string().max(300).optional(),
    }),
});

/**
 * Course Query Validation
 * Course list এর query params validate করা
 */
const courseQuerySchema = z.object({
    query: z.object({
        searchTerm: z.string().optional(),
        category: z.string().optional(),
        courseType: z.enum(['online', 'offline', 'recorded']).optional(),
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        language: z.enum(['bangla', 'english', 'both']).optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        isFeatured: z.string().optional(), // Will be converted to boolean
        isFree: z.string().optional(),     // Will be converted to boolean
        minPrice: z.string().optional(),   // Will be converted to number
        maxPrice: z.string().optional(),   // Will be converted to number
        page: z.string().optional(),
        limit: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export const CourseValidation = {
    createCourseSchema,
    updateCourseSchema,
    courseQuerySchema,
};
