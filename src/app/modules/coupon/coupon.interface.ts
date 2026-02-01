// ===================================================================
// MotionBoss LMS - Coupon Interface
// Coupon/Discount code management module
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * ICoupon - Main Coupon Interface
 */
export interface ICoupon {
    _id?: Types.ObjectId;

    // Basic Info
    code: string;                    // Unique coupon code
    name: string;                    // Display name
    description?: string;            // Description

    // Discount Settings
    discountType: 'percentage' | 'fixed' | 'fixed_price';  // Discount type
    discountValue: number;           // Amount or percentage
    maxDiscount?: number;            // Maximum discount amount (for percentage)
    minPurchase?: number;            // Minimum purchase amount

    // Installment Settings
    installmentEnabled?: boolean;    // Enable installment payment
    installmentCount?: number;       // Number of installments (e.g., 3, 6, 12)
    installmentIntervalDays?: number; // Days between each installment (default 30)

    // Validity
    startDate: Date;
    endDate: Date;

    // Usage Limits
    usageLimit?: number;             // Total usage limit
    usagePerUser?: number;           // Usage limit per user
    usedCount: number;               // How many times used

    // Applicable Products
    applicableTo: 'all' | 'course' | 'website' | 'software';
    specificProducts?: Types.ObjectId[];  // Specific product IDs

    // Status
    isActive: boolean;

    // Top Header Banner Settings
    showInTopHeader?: boolean;
    topHeaderMessage?: string;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ICouponUsage - Track coupon usage by users
 */
export interface ICouponUsage {
    _id?: Types.ObjectId;
    coupon: Types.ObjectId;
    user: Types.ObjectId;
    order: Types.ObjectId;
    discountAmount: number;
    usedAt: Date;
}

/**
 * CouponModel - Mongoose Model Type
 */
export interface CouponModel extends Model<ICoupon> {
    isValidCoupon(code: string): Promise<ICoupon | null>;
}
