// ===================================================================
// ExtraWeb Backend - Website Validation
// Zod validation schemas for Website CRUD
// ===================================================================

import { z } from 'zod';
import { PLATFORM_OPTIONS } from './website.interface';

// Platform enum for validation
const platformEnum = z.enum(PLATFORM_OPTIONS as [string, ...string[]]);

/**
 * Create Website Validation
 */
export const createWebsiteValidation = z.object({
    body: z.object({
        title: z.string({ required_error: 'Title is required' }).min(1).max(200),
        slug: z.string().optional(),
        platform: platformEnum,
        category: z.string({ required_error: 'Category is required' }),
        subCategory: z.string().optional(),
        accessType: z.enum(['free', 'paid']).optional().default('paid'),
        price: z.number({ required_error: 'Price is required' }).min(0),
        offerPrice: z.number().min(0).optional(),
        features: z.array(z.string()).optional().default([]),
        technologies: z.array(z.string()).optional().default([]),
        description: z.string({ required_error: 'Description is required' }).max(1000),
        longDescription: z.string().optional(),
        images: z.array(z.string()).optional().default([]),
        previewUrl: z.string().url().optional().or(z.literal('')),
        downloadFile: z.string({ required_error: 'Download file is required' }),
        status: z.enum(['pending', 'approved', 'rejected', 'draft']).optional(),
        isFeatured: z.boolean().optional(),
    }),
});

/**
 * Update Website Validation
 */
export const updateWebsiteValidation = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        slug: z.string().optional(),
        platform: platformEnum.optional(),
        category: z.string().optional(),
        subCategory: z.string().optional(),
        accessType: z.enum(['free', 'paid']).optional(),
        price: z.number().min(0).optional(),
        offerPrice: z.number().min(0).optional(),
        features: z.array(z.string()).optional(),
        technologies: z.array(z.string()).optional(),
        description: z.string().max(1000).optional(),
        longDescription: z.string().optional(),
        images: z.array(z.string()).optional(),
        previewUrl: z.string().url().optional().or(z.literal('')),
        downloadFile: z.string().optional(),
        status: z.enum(['pending', 'approved', 'rejected', 'draft']).optional(),
        isFeatured: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string({ required_error: 'ID is required' }),
    }),
});

/**
 * Website Query Validation
 */
export const websiteQueryValidation = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        searchTerm: z.string().optional(),
        category: z.string().optional(),
        platform: z.string().optional(),
        accessType: z.enum(['free', 'paid']).optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        minRating: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export type TCreateWebsiteInput = z.infer<typeof createWebsiteValidation>['body'];
export type TUpdateWebsiteInput = z.infer<typeof updateWebsiteValidation>['body'];

