// ===================================================================
// MotionBoss LMS - Coupon Routes
// API endpoints for coupon module
// ===================================================================

import express from 'express';
import { CouponController } from './coupon.controller';
import validateRequest from '../../middlewares/validateRequest';
import { CouponValidation } from './coupon.validation';

const router = express.Router();

// ==================== Public Routes ====================

// Apply coupon (validate and calculate discount)
router.post(
    '/apply',
    validateRequest(CouponValidation.applyCouponZodSchema),
    CouponController.applyCoupon
);

// ==================== Admin Routes ====================

// Get all coupons
router.get('/', CouponController.getAllCoupons);

// Get single coupon
router.get('/:id', CouponController.getCouponById);

// Create coupon
router.post(
    '/',
    validateRequest(CouponValidation.createCouponZodSchema),
    CouponController.createCoupon
);

// Update coupon
router.patch(
    '/:id',
    validateRequest(CouponValidation.updateCouponZodSchema),
    CouponController.updateCoupon
);

// Delete coupon
router.delete('/:id', CouponController.deleteCoupon);

export const CouponRoutes = router;
