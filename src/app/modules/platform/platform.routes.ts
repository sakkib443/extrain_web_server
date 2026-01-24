// ===================================================================
// ExtraWeb Backend - Platform Routes
// ===================================================================

import express from 'express';
import PlatformController from './platform.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import { createPlatformValidation, updatePlatformValidation } from './platform.validation';

const router = express.Router();

// Public
router.get('/', PlatformController.getActivePlatforms);

// Admin
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), PlatformController.getAllPlatforms);
router.get('/admin/:id', authMiddleware, authorizeRoles('admin'), PlatformController.getPlatformById);
router.post('/admin', authMiddleware, authorizeRoles('admin'), validateRequest(createPlatformValidation), PlatformController.createPlatform);
router.patch('/admin/:id', authMiddleware, authorizeRoles('admin'), validateRequest(updatePlatformValidation), PlatformController.updatePlatform);
router.delete('/admin/:id', authMiddleware, authorizeRoles('admin'), PlatformController.deletePlatform);

export const PlatformRoutes = router;
