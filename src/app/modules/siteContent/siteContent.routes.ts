// ===================================================================
// Site Content Routes
// API endpoints for editable website content
// ===================================================================

import express from 'express';
import { SiteContentController } from './siteContent.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

const router = express.Router();

// ==================== Public Routes ====================
// Anyone can read content

// Get all content (optionally filter by section/type)
router.get('/', SiteContentController.getAllContent);

// Get content by specific key
router.get('/key/:key', SiteContentController.getContentByKey);

// Get all content for a section
router.get('/section/:section', SiteContentController.getContentBySection);

// Get multiple contents by keys (POST for body)
router.post('/by-keys', SiteContentController.getContentsByKeys);

// ==================== Admin Only Routes ====================
// Only admin can modify content

// Create or update single content
router.put(
    '/',
    authMiddleware,
    authorizeRoles('admin'),
    SiteContentController.upsertContent
);

// Bulk update multiple contents
router.put(
    '/bulk',
    authMiddleware,
    authorizeRoles('admin'),
    SiteContentController.bulkUpdateContents
);

// Delete content by key
router.delete(
    '/key/:key',
    authMiddleware,
    authorizeRoles('admin'),
    SiteContentController.deleteContent
);

// Seed default content
router.post(
    '/seed',
    authMiddleware,
    authorizeRoles('admin'),
    SiteContentController.seedContent
);

export const SiteContentRoutes = router;
