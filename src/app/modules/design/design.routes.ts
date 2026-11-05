// ===================================================================
// MotionBoss LMS - Design Routes
// API endpoints for Design module
// ===================================================================

import express from 'express';
import { DesignController } from './design.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import { DesignValidation } from './design.validation';

const router = express.Router();

// ==================== Public Routes ====================

// Get design by section (for frontend)
router.get('/:section', DesignController.getDesignBySection);

// ==================== Admin Routes ====================
// Everything below this line needs an admin login, so a route added later is locked by default.
router.use(authMiddleware, authorizeRoles('admin'));

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
