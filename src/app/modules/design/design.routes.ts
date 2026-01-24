// ===================================================================
// MotionBoss LMS - Design Routes
// API endpoints for Design module
// ===================================================================

import express from 'express';
import { DesignController } from './design.controller';
import validateRequest from '../../middlewares/validateRequest';
import { DesignValidation } from './design.validation';

const router = express.Router();

// ==================== Public Routes ====================

// Get design by section (for frontend)
router.get('/:section', DesignController.getDesignBySection);

// ==================== Admin Routes ====================

// Get all designs
router.get('/', DesignController.getAllDesigns);

// Create new design
router.post(
    '/',
    validateRequest(DesignValidation.createDesignZodSchema),
    DesignController.createDesign
);

// Update design by section
router.patch(
    '/:section',
    validateRequest(DesignValidation.updateDesignZodSchema),
    DesignController.updateDesignBySection
);

export const DesignRoutes = router;
