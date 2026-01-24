// ===================================================================
// Extrain Web LMS - Blog Validation
// Zod validation schemas for Blog module
// ব্লগ মডিউলের ভ্যালিডেশন স্কিমা
// ===================================================================

import { z } from 'zod';

/**
 * Create Blog Validation Schema
 * নতুন ব্লগ তৈরির জন্য ভ্যালিডেশন
 */
const createBlogSchema = z.object({
    body: z.object({
        title: z
            .string({
                required_error: 'Blog title is required',
            })
            .min(5, 'Title must be at least 5 characters')
            .max(200, 'Title cannot exceed 200 characters'),
        titleBn: z
            .string()
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional(),
        excerpt: z
            .string({
                required_error: 'Blog excerpt is required',
            })
            .min(20, 'Excerpt must be at least 20 characters')
            .max(500, 'Excerpt cannot exceed 500 characters'),
        excerptBn: z
            .string()
            .max(500, 'Bengali excerpt cannot exceed 500 characters')
            .optional(),
        content: z
            .string({
                required_error: 'Blog content is required',
            })
            .min(100, 'Content must be at least 100 characters'),
        contentBn: z.string().optional(),
        thumbnail: z
            .string({
                required_error: 'Thumbnail image is required',
            })
            .url('Invalid thumbnail URL'),
        images: z.array(z.string().url()).optional(),
        videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
        category: z.string({
            required_error: 'Category is required',
        }),
        tags: z
            .array(z.string().max(50, 'Tag cannot exceed 50 characters'))
            .min(1, 'At least one tag is required')
            .max(10, 'Cannot have more than 10 tags'),
        status: z.enum(['draft', 'published', 'archived']).default('draft'),
        isFeatured: z.boolean().default(false),
        isPopular: z.boolean().default(false),
        allowComments: z.boolean().default(true),
        metaTitle: z.string().max(70, 'Meta title cannot exceed 70 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
    }),
});

/**
 * Update Blog Validation Schema
 * ব্লগ আপডেটের জন্য ভ্যালিডেশন
 */
const updateBlogSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(5, 'Title must be at least 5 characters')
            .max(200, 'Title cannot exceed 200 characters')
            .optional(),
        titleBn: z
            .string()
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional(),
        excerpt: z
            .string()
            .min(20, 'Excerpt must be at least 20 characters')
            .max(500, 'Excerpt cannot exceed 500 characters')
            .optional(),
        excerptBn: z
            .string()
            .max(500, 'Bengali excerpt cannot exceed 500 characters')
            .optional(),
        content: z
            .string()
            .min(100, 'Content must be at least 100 characters')
            .optional(),
        contentBn: z.string().optional(),
        thumbnail: z.string().url('Invalid thumbnail URL').optional(),
        images: z.array(z.string().url()).optional(),
        videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
        category: z.string().optional(),
        tags: z
            .array(z.string().max(50, 'Tag cannot exceed 50 characters'))
            .max(10, 'Cannot have more than 10 tags')
            .optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        isFeatured: z.boolean().optional(),
        isPopular: z.boolean().optional(),
        allowComments: z.boolean().optional(),
        metaTitle: z.string().max(70, 'Meta title cannot exceed 70 characters').optional(),
        metaDescription: z.string().max(160, 'Meta description cannot exceed 160 characters').optional(),
        metaKeywords: z.array(z.string()).optional(),
    }),
});

/**
 * Create Comment Validation Schema
 * নতুন কমেন্ট তৈরির জন্য ভ্যালিডেশন
 */
const createCommentSchema = z.object({
    body: z.object({
        content: z
            .string({
                required_error: 'Comment content is required',
            })
            .min(3, 'Comment must be at least 3 characters')
            .max(1000, 'Comment cannot exceed 1000 characters'),
        parentComment: z.string().optional(),
    }),
});

export const BlogValidation = {
    createBlogSchema,
    updateBlogSchema,
    createCommentSchema,
};
