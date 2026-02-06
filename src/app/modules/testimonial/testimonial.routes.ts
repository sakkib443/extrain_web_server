// ===================================================================
// Extrain Web - Testimonial Routes
// Express router for Testimonial module
// টেস্টিমোনিয়াল মডিউলের Express router
// ===================================================================

import express from 'express';
import { TestimonialController } from './testimonial.controller';
import validateRequest from '../../middlewares/validateRequest';
import { TestimonialValidation } from './testimonial.validation';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

const router = express.Router();

// ==================== Public Routes ====================
// Get approved testimonials (for frontend)
router.get(
    '/public',
    TestimonialController.getApprovedTestimonials
);

// ==================== Admin Routes ====================
// Get all testimonials (admin)
router.get(
    '/',
    authMiddleware,
    authorizeRoles('admin'),
    TestimonialController.getAllTestimonials
);

// Create testimonial
router.post(
    '/',
    authMiddleware,
    authorizeRoles('admin'),
    validateRequest(TestimonialValidation.createTestimonialZodSchema),
    TestimonialController.createTestimonial
);

// Get single testimonial
router.get(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    TestimonialController.getSingleTestimonial
);

// Update testimonial
router.patch(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    validateRequest(TestimonialValidation.updateTestimonialZodSchema),
    TestimonialController.updateTestimonial
);

// Delete testimonial
router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    TestimonialController.deleteTestimonial
);

// Update status
router.patch(
    '/:id/status',
    authMiddleware,
    authorizeRoles('admin'),
    TestimonialController.updateStatus
);

// Toggle featured
router.patch(
    '/:id/featured',
    authMiddleware,
    authorizeRoles('admin'),
    TestimonialController.toggleFeatured
);

export const TestimonialRoutes = router;
