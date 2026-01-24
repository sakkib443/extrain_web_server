// ===================================================================
// ExtraWeb Backend - Software Routes
// API endpoints for Software Products
// ===================================================================

import express from 'express';
import SoftwareController from './software.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import { createSoftwareValidation, updateSoftwareValidation, softwareQueryValidation } from './software.validation';

const router = express.Router();

// ===================================================================
// PUBLIC ROUTES (Specific routes MUST come before dynamic /:id routes)
// ===================================================================

// GET /api/software - Get all approved software (public listing)
router.get('/', validateRequest(softwareQueryValidation), SoftwareController.getAllSoftware);

// GET /api/software/featured - Get featured software
router.get('/featured', SoftwareController.getFeaturedSoftware);

// GET /api/software/slug/:slug - Get by slug (public detail page)
router.get('/slug/:slug', optionalAuth, SoftwareController.getSoftwareBySlug);

// ===================================================================
// ADMIN ROUTES - Software Management (seller removed)
// ===================================================================

// ===================================================================
// ADMIN ROUTES - Software Management
// ===================================================================

// GET /api/software/admin/my - Get admin/mentor's software
router.get(
    '/admin/my',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    SoftwareController.getMySoftware
);

// POST /api/software/admin - Create new software (Admin and Mentor)
router.post(
    '/admin',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(createSoftwareValidation),
    SoftwareController.createSoftware
);

// PATCH /api/software/admin/managed/:id - Update software (Admin and Mentor)
router.patch(
    '/admin/managed/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(updateSoftwareValidation),
    SoftwareController.updateSoftware
);

// DELETE /api/software/admin/managed/:id - Delete software
router.delete(
    '/admin/managed/:id',
    authMiddleware,
    authorizeRoles('admin'),
    SoftwareController.deleteSoftware
);

// ===================================================================
// ADMIN ROUTES (Must be BEFORE /:id to avoid route conflict)
// ===================================================================

// GET /api/software/admin/all - Get all software (with status filter) (Admin and Mentor)
router.get(
    '/admin/all',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    SoftwareController.getAdminSoftware
);

// PATCH /api/software/admin/:id/status - Approve/Reject software (Admin and Mentor)
router.patch(
    '/admin/:id/status',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    SoftwareController.updateSoftwareStatus
);

// DELETE /api/software/admin/:id - Admin delete
router.delete(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    SoftwareController.deleteSoftware
);

// ===================================================================
// DYNAMIC ID ROUTES (Must be LAST to avoid matching specific routes)
// ===================================================================

// POST /api/software/:id/like - Toggle like (requires auth)
router.post(
    '/:id/like',
    authMiddleware,
    SoftwareController.toggleLike
);

// GET /api/software/:id - Get by ID
router.get('/:id', optionalAuth, SoftwareController.getSoftwareById);

export const SoftwareRoutes = router;
