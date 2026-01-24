// ===================================================================
// MotionBoss - Page Content Routes
// API routes for page content management
// ===================================================================

import express from 'express';
import { PageContentController } from './pageContent.controller';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get content for public pages (frontend use)
router.get('/public/:pageKey', PageContentController.getPublicPageContent);

// ==================== ADMIN ROUTES ====================
// Get all page definitions (structure)
router.get('/definitions', PageContentController.getPageDefinitions);

// Get all pages overview with progress
router.get('/overview', PageContentController.getAllPagesOverview);

// Get a single page with all sections and content
router.get('/:pageKey', PageContentController.getPageWithSections);

// Get a specific section content
router.get('/:pageKey/:sectionKey', PageContentController.getSectionContent);

// Update a specific section content
router.patch('/:pageKey/:sectionKey', PageContentController.updateSectionContent);

// Update multiple sections at once
router.patch('/:pageKey', PageContentController.updateMultipleSections);

// Toggle section active status
router.patch('/:pageKey/:sectionKey/toggle', PageContentController.toggleSectionActive);

export const PageContentRoutes = router;
