// ===================================================================
// Extrain Web - Testimonial Validation
// Zod validation schemas for Testimonial module
// টেস্টিমোনিয়াল মডিউলের Zod validation schemas
// ===================================================================

import { z } from 'zod';

// ==================== Create Testimonial Validation ====================
const createTestimonialZodSchema = z.object({
    body: z.object({
        clientName: z
            .string({ required_error: 'Client name is required' })
            .min(2, 'Client name must be at least 2 characters')
            .max(100, 'Client name cannot exceed 100 characters'),
        clientNameBn: z
            .string()
            .max(100, 'Bengali client name cannot exceed 100 characters')
            .optional(),
        companyName: z
            .string({ required_error: 'Company name is required' })
            .min(2, 'Company name must be at least 2 characters')
            .max(150, 'Company name cannot exceed 150 characters'),
        companyNameBn: z
            .string()
            .max(150, 'Bengali company name cannot exceed 150 characters')
            .optional(),
        title: z
            .string({ required_error: 'Title is required' })
            .min(5, 'Title must be at least 5 characters')
            .max(200, 'Title cannot exceed 200 characters'),
        titleBn: z
            .string()
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional(),
        type: z.enum(['testimonial', 'review']).default('testimonial'),
        videoId: z
            .string({ required_error: 'YouTube video ID is required' })
            .min(5, 'Video ID must be at least 5 characters'),
        description: z
            .string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),
        descriptionBn: z
            .string()
            .max(500, 'Bengali description cannot exceed 500 characters')
            .optional(),
        clientImage: z.string().url().optional(),
        clientDesignation: z
            .string()
            .max(100, 'Designation cannot exceed 100 characters')
            .optional(),
        clientDesignationBn: z
            .string()
            .max(100, 'Bengali designation cannot exceed 100 characters')
            .optional(),
        rating: z.number().min(1).max(5).default(5).optional(),
        status: z.enum(['pending', 'approved', 'rejected']).default('pending').optional(),
        isFeatured: z.boolean().default(false).optional(),
        order: z.number().default(0).optional(),
    }),
});

// ==================== Update Testimonial Validation ====================
const updateTestimonialZodSchema = z.object({
    body: z.object({
        clientName: z
            .string()
            .min(2, 'Client name must be at least 2 characters')
            .max(100, 'Client name cannot exceed 100 characters')
            .optional(),
        clientNameBn: z
            .string()
            .max(100, 'Bengali client name cannot exceed 100 characters')
            .optional(),
        companyName: z
            .string()
            .min(2, 'Company name must be at least 2 characters')
            .max(150, 'Company name cannot exceed 150 characters')
            .optional(),
        companyNameBn: z
            .string()
            .max(150, 'Bengali company name cannot exceed 150 characters')
            .optional(),
        title: z
            .string()
            .min(5, 'Title must be at least 5 characters')
            .max(200, 'Title cannot exceed 200 characters')
            .optional(),
        titleBn: z
            .string()
            .max(200, 'Bengali title cannot exceed 200 characters')
            .optional(),
        type: z.enum(['testimonial', 'review']).optional(),
        videoId: z.string().min(5, 'Video ID must be at least 5 characters').optional(),
        description: z
            .string()
            .max(500, 'Description cannot exceed 500 characters')
            .optional(),
        descriptionBn: z
            .string()
            .max(500, 'Bengali description cannot exceed 500 characters')
            .optional(),
        clientImage: z.string().url().optional().nullable(),
        clientDesignation: z
            .string()
            .max(100, 'Designation cannot exceed 100 characters')
            .optional(),
        clientDesignationBn: z
            .string()
            .max(100, 'Bengali designation cannot exceed 100 characters')
            .optional(),
        rating: z.number().min(1).max(5).optional(),
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        isFeatured: z.boolean().optional(),
        order: z.number().optional(),
    }),
});

export const TestimonialValidation = {
    createTestimonialZodSchema,
    updateTestimonialZodSchema,
};
