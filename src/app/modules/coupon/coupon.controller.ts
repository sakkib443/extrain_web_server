// ===================================================================
// MotionBoss LMS - Coupon Controller
// Request handlers for coupon module
// ===================================================================

import { Request, Response } from 'express';
import { CouponService } from './coupon.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../utils/pick';

/**
 * Create a new coupon
 */
const createCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponService.createCoupon(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Coupon created successfully',
        data: result
    });
});

/**
 * Get all coupons
 */
const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['isActive', 'searchTerm']);
    const result = await CouponService.getAllCoupons(filters as any);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Coupons retrieved successfully',
        data: result
    });
});

/**
 * Get coupon by ID
 */
const getCouponById = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponService.getCouponById(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Coupon retrieved successfully',
        data: result
    });
});

/**
 * Update coupon
 */
const updateCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponService.updateCoupon(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Coupon updated successfully',
        data: result
    });
});

/**
 * Delete coupon
 */
const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponService.deleteCoupon(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Coupon deleted successfully',
        data: result
    });
});

/**
 * Apply coupon - Validate and get discount
 */
const applyCoupon = catchAsync(async (req: Request, res: Response) => {
    const { code, cartTotal, productType } = req.body;
    const result = await CouponService.applyCoupon(code, cartTotal, productType);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: {
            valid: result.valid,
            discount: result.discount,
            couponCode: result.couponCode,
            discountType: result.discountType,
            discountValue: result.discountValue,
            installmentEnabled: result.installmentEnabled,
            installmentCount: result.installmentCount,
            installments: result.installments
        }
    });
});

/**
 * Get top header coupon
 */
const getTopHeaderCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponService.getTopHeaderCoupon();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Top header coupon retrieved successfully',
        data: result
    });
});

export const CouponController = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
    getTopHeaderCoupon
};
