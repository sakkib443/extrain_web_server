// ===================================================================
// ExtraWeb Backend - Website Routes
// API endpoints for Website Products
// ===================================================================

import express from 'express';
import WebsiteController from './website.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import { createWebsiteValidation, updateWebsiteValidation, websiteQueryValidation } from './website.validation';

const router = express.Router();

// ===================================================================
// PUBLIC ROUTES (Specific routes MUST come before dynamic /:id routes)
// ===================================================================

// GET /api/websites - Get all approved websites (public listing)
router.get('/', validateRequest(websiteQueryValidation), WebsiteController.getAllWebsites);

// GET /api/websites/featured - Get featured websites
router.get('/featured', WebsiteController.getFeaturedWebsites);

// GET /api/websites/slug/:slug - Get by slug (public detail page)
router.get('/slug/:slug', optionalAuth, WebsiteController.getWebsiteBySlug);

// ===================================================================
// ADMIN ROUTES - Website Management (seller removed)
// ===================================================================

// ===================================================================
// ADMIN ROUTES - Website Management
// ===================================================================

// GET /api/websites/admin/all-list - Get all websites for admin/mentor dashboard
router.get(
    '/admin/all-list',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    WebsiteController.getAdminAllWebsites
);

// POST /api/websites/admin - Create new website (Admin and Mentor)
router.post(
    '/admin',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(createWebsiteValidation),
    WebsiteController.createWebsite
);

// PATCH /api/websites/admin/managed/:id - Update website (Admin and Mentor)
router.patch(
    '/admin/managed/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(updateWebsiteValidation),
    WebsiteController.updateWebsite
);

// DELETE /api/websites/admin/managed/:id - Delete website
router.delete(
    '/admin/managed/:id',
    authMiddleware,
    authorizeRoles('admin'),
    WebsiteController.deleteWebsite
);

// ===================================================================
// ADMIN ROUTES (Must be BEFORE /:id to avoid route conflict)
// ===================================================================

// GET /api/websites/admin/all - Get all websites (with status filter) (Admin and Mentor)
router.get(
    '/admin/all',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    WebsiteController.getAdminWebsites
);

// PATCH /api/websites/admin/:id/status - Approve/Reject website (Admin and Mentor)
router.patch(
    '/admin/:id/status',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    WebsiteController.updateWebsiteStatus
);

// DELETE /api/websites/admin/:id - Admin delete
router.delete(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    WebsiteController.deleteWebsite
);

// ===================================================================
// DYNAMIC ID ROUTES (Must be LAST to avoid matching specific routes)
// ===================================================================

// GET /api/websites/:id - Get by ID (with optional auth for like status)
router.get('/:id', optionalAuth, WebsiteController.getWebsiteById);

// GET /api/websites/:id/stats - Get stats
router.get('/:id/stats', WebsiteController.getStats);

// POST /api/websites/:id/view - Increment view count
router.post('/:id/view', WebsiteController.incrementView);

// POST /api/websites/:id/like - Like a website
router.post('/:id/like', WebsiteController.likeWebsite);

// POST /api/websites/:id/unlike - Unlike a website
router.post('/:id/unlike', WebsiteController.unlikeWebsite);

// POST /api/websites/:id/toggle-like - Toggle like (authenticated)
router.post('/:id/toggle-like', authMiddleware, WebsiteController.toggleLike);

export const WebsiteRoutes = router;

