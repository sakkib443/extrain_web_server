// ===================================================================
// MotionBoss LMS - Coupon Validation
// Zod validation schemas for coupon module
// ===================================================================

import { z } from 'zod';

// Helper to coerce string/number to number safely
const coerceNumber = z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? val : parsed;
}, z.number().optional());

const coerceNumberRequired = z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? val : parsed;
}, z.number({
    required_error: 'This field is required',
    invalid_type_error: 'Must be a number'
}));

const createCouponZodSchema = z.object({
    body: z.object({
        code: z.string({
            required_error: 'Coupon code is required'
        }).min(3, 'Code must be at least 3 characters').max(20, 'Code cannot exceed 20 characters'),
        name: z.string({
            required_error: 'Coupon name is required'
        }),
        description: z.string().optional(),
        discountType: z.enum(['percentage', 'fixed', 'fixed_price'], {
            required_error: 'Discount type is required',
            invalid_type_error: 'Discount type must be percentage, fixed, or fixed_price'
        }),
        discountValue: coerceNumberRequired.pipe(
            z.number().min(0, 'Discount value must be 0 or greater')
        ),
        maxDiscount: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(0, 'Max discount must be 0 or greater').nullable().optional()),
        minPurchase: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const parsed = Number(val);
            return isNaN(parsed) ? 0 : parsed;
        }, z.number().min(0, 'Min purchase must be 0 or greater').optional()),
        // Installment Settings - more flexible validation
        installmentEnabled: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            return Boolean(val);
        }, z.boolean().optional()),
        installmentCount: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return 1;
            const parsed = Number(val);
            return isNaN(parsed) ? 1 : parsed;
        }, z.number().min(1, 'Installment count must be at least 1').max(12, 'Installment count cannot exceed 12').optional()),
        installmentIntervalDays: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return 30;
            const parsed = Number(val);
            return isNaN(parsed) ? 30 : parsed;
        }, z.number().min(7, 'Interval must be at least 7 days').max(90, 'Interval cannot exceed 90 days').optional()),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
        usageLimit: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(1, 'Usage limit must be at least 1').nullable().optional()),
        usagePerUser: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return 1;
            const parsed = Number(val);
            return isNaN(parsed) ? 1 : parsed;
        }, z.number().min(1, 'Per user limit must be at least 1').optional()),
        applicableTo: z.enum(['all', 'course', 'website', 'software']).optional(),
        specificProducts: z.array(z.string()).optional(),
        isActive: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            return true; // default to true
        }, z.boolean().optional()),
        // Additional optional fields that frontend may send
        showInTopHeader: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            return false;
        }, z.boolean().optional()),
        topHeaderMessage: z.string().optional()
    })
});

const updateCouponZodSchema = z.object({
    body: z.object({
        code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code cannot exceed 20 characters').optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(['percentage', 'fixed', 'fixed_price'], {
            invalid_type_error: 'Discount type must be percentage, fixed, or fixed_price'
        }).optional(),
        discountValue: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(0, 'Discount value must be 0 or greater').optional()),
        maxDiscount: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(0, 'Max discount must be 0 or greater').nullable().optional()),
        minPurchase: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(0, 'Min purchase must be 0 or greater').optional()),
        // Installment Settings - flexible validation
        installmentEnabled: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            if (val === undefined) return undefined;
            return Boolean(val);
        }, z.boolean().optional()),
        installmentCount: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(1, 'Installment count must be at least 1').max(12, 'Installment count cannot exceed 12').optional()),
        installmentIntervalDays: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(7, 'Interval must be at least 7 days').max(90, 'Interval cannot exceed 90 days').optional()),
        startDate: z.string().or(z.date()).optional(),
        endDate: z.string().or(z.date()).optional(),
        usageLimit: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return null;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(1, 'Usage limit must be at least 1').nullable().optional()),
        usagePerUser: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number().min(1, 'Per user limit must be at least 1').optional()),
        applicableTo: z.enum(['all', 'course', 'website', 'software']).optional(),
        specificProducts: z.array(z.string()).optional(),
        isActive: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            if (val === undefined) return undefined;
            return Boolean(val);
        }, z.boolean().optional()),
        // Additional optional fields
        showInTopHeader: z.preprocess((val) => {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            if (val === undefined) return undefined;
            return Boolean(val);
        }, z.boolean().optional()),
        topHeaderMessage: z.string().optional()
    })
});

const applyCouponZodSchema = z.object({
    body: z.object({
        code: z.string({
            required_error: 'Coupon code is required'
        }),
        cartTotal: z.preprocess((val) => {
            if (val === '' || val === null || val === undefined) return undefined;
            const parsed = Number(val);
            return isNaN(parsed) ? val : parsed;
        }, z.number({
            required_error: 'Cart total is required',
            invalid_type_error: 'Cart total must be a number'
        }).min(0, 'Cart total must be 0 or greater')),
        productType: z.enum(['all', 'course', 'website', 'software']).optional()
    })
});

export const CouponValidation = {
    createCouponZodSchema,
    updateCouponZodSchema,
    applyCouponZodSchema
};
