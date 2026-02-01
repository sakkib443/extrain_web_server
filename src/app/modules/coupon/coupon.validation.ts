// ===================================================================
// MotionBoss LMS - Coupon Validation
// Zod validation schemas for coupon module
// ===================================================================

import { z } from 'zod';

const createCouponZodSchema = z.object({
    body: z.object({
        code: z.string({
            required_error: 'Coupon code is required'
        }).min(3, 'Code must be at least 3 characters').max(20, 'Code cannot exceed 20 characters'),
        name: z.string({
            required_error: 'Coupon name is required'
        }),
        description: z.string().optional(),
        discountType: z.enum(['percentage', 'fixed'], {
            required_error: 'Discount type is required'
        }),
        discountValue: z.number({
            required_error: 'Discount value is required'
        }).min(0, 'Discount value must be positive'),
        maxDiscount: z.number().min(0).optional().nullable(),
        minPurchase: z.number().min(0).optional(),
        // Installment Settings
        installmentEnabled: z.boolean().optional(),
        installmentCount: z.number().min(1).max(12).optional(),
        installmentIntervalDays: z.number().min(7).max(90).optional(),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
        usageLimit: z.number().min(1).optional().nullable(),
        usagePerUser: z.number().min(1).optional(),
        applicableTo: z.enum(['all', 'course', 'website', 'software']).optional(),
        specificProducts: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        showInTopHeader: z.boolean().optional(),
        topHeaderMessage: z.string().optional()
    })
});

const updateCouponZodSchema = z.object({
    body: z.object({
        code: z.string().min(3).max(20).optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().min(0).optional(),
        maxDiscount: z.number().min(0).optional().nullable(),
        minPurchase: z.number().min(0).optional(),
        // Installment Settings
        installmentEnabled: z.boolean().optional(),
        installmentCount: z.number().min(1).max(12).optional(),
        installmentIntervalDays: z.number().min(7).max(90).optional(),
        startDate: z.string().or(z.date()).optional(),
        endDate: z.string().or(z.date()).optional(),
        usageLimit: z.number().min(1).optional().nullable(),
        usagePerUser: z.number().min(1).optional(),
        applicableTo: z.enum(['all', 'course', 'website', 'software']).optional(),
        specificProducts: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        showInTopHeader: z.boolean().optional(),
        topHeaderMessage: z.string().optional()
    })
});

const applyCouponZodSchema = z.object({
    body: z.object({
        code: z.string({
            required_error: 'Coupon code is required'
        }),
        cartTotal: z.number({
            required_error: 'Cart total is required'
        }).min(0),
        productType: z.enum(['all', 'course', 'website', 'software']).optional()
    })
});

export const CouponValidation = {
    createCouponZodSchema,
    updateCouponZodSchema,
    applyCouponZodSchema
};
