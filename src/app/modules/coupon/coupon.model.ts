// ===================================================================
// MotionBoss LMS - Coupon Model
// Mongoose schema for coupons
// ===================================================================

import { Schema, model } from 'mongoose';
import { ICoupon, CouponModel } from './coupon.interface';

const couponSchema = new Schema<ICoupon, CouponModel>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed', 'fixed_price'],
            required: true,
            default: 'percentage'
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0
        },
        maxDiscount: {
            type: Number,
            default: null
        },
        minPurchase: {
            type: Number,
            default: 0
        },
        // Installment Settings
        installmentEnabled: {
            type: Boolean,
            default: false
        },
        installmentCount: {
            type: Number,
            default: 1,
            min: 1,
            max: 12
        },
        installmentIntervalDays: {
            type: Number,
            default: 30,
            min: 7,
            max: 90
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        usageLimit: {
            type: Number,
            default: null
        },
        usagePerUser: {
            type: Number,
            default: 1
        },
        usedCount: {
            type: Number,
            default: 0
        },
        applicableTo: {
            type: String,
            enum: ['all', 'course', 'website', 'software'],
            default: 'all'
        },
        specificProducts: [{
            type: Schema.Types.ObjectId,
            refPath: 'applicableTo'
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        showInTopHeader: {
            type: Boolean,
            default: false
        },
        topHeaderMessage: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Index for faster lookups
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Static method to validate coupon
couponSchema.statics.isValidCoupon = async function (code: string) {
    const now = new Date();
    return this.findOne({
        code: code.toUpperCase(),
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
        ]
    });
};

export const Coupon = model<ICoupon, CouponModel>('Coupon', couponSchema);
