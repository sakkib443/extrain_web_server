// ===================================================================
// MotionBoss LMS - Module Routes
// Module module API endpoints
// ===================================================================

import express from 'express';
import { ModuleController } from './module.controller';
import { ModuleValidation } from './module.validation';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

// ==================== Public/Authenticated Routes ====================

// Get all modules for a course
router.get(
    '/course/:courseId',
    optionalAuth,
    ModuleController.getModulesByCourse
);

// Get single module by ID
router.get(
    '/:id',
    optionalAuth,
    ModuleController.getModuleById
);

// ==================== Admin Only Routes ====================

// Create new module (Admin and Mentor)
router.post(
    '/',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(ModuleValidation.createModuleSchema),
    ModuleController.createModule
);

// Update module (Admin and Mentor)
router.patch(
    '/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(ModuleValidation.updateModuleSchema),
    ModuleController.updateModule
);

// Delete module
router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    ModuleController.deleteModule
);

export const ModuleRoutes = router;
