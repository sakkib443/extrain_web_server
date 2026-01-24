// ===================================================================
// ExtraWeb Backend - Upload Routes
// Routes for all image upload operations
// ===================================================================

import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import {
    uploadImage,
    uploadImages,
    uploadUserAvatar,
    uploadCategoryImage,
    uploadPlatformImage,
    uploadSoftwareScreenshots,
    uploadZipFile,
    removeImage,
} from './upload.controller';

const router = Router();

// ==================== Protected Routes (Authenticated users) ====================

// Single image upload (general purpose)
router.post('/single', authMiddleware, uploadImage);

// Multiple images upload (for websites)
router.post('/multiple', authMiddleware, uploadImages);

// Avatar upload
router.post('/avatar', authMiddleware, uploadUserAvatar);

// Category icon upload (admin only)
router.post('/category', authMiddleware, authorizeRoles('admin'), uploadCategoryImage);

// Platform icon upload (admin only)
router.post('/platform', authMiddleware, authorizeRoles('admin'), uploadPlatformImage);

// Software screenshots upload
router.post('/software', authMiddleware, uploadSoftwareScreenshots);

// ZIP/RAR file upload (for download files - admin/seller)
router.post('/file', authMiddleware, uploadZipFile);

// Delete image/file
router.delete('/delete', authMiddleware, removeImage);

export const uploadRoutes = router;

