// ===================================================================
// ExtraWeb Backend - Upload Controller
// Handle all image upload operations
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import {
    uploadSingleImage,
    uploadWebsiteImages,
    uploadCategoryIcon,
    uploadPlatformIcon,
    uploadAvatar,
    uploadSoftwareImages,
    uploadDownloadFile,
    deleteImage,
    deleteRawFile,
    getPublicIdFromUrl
} from '../../utils/cloudinary';

// ==================== Single Image Upload ====================
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    uploadSingleImage(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Image upload failed',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided',
            });
        }

        // Return the uploaded image URL
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: (req.file as any).path,
                filename: req.file.filename,
            },
        });
    });
};

// ==================== Multiple Images Upload ====================
export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
    uploadWebsiteImages(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Images upload failed',
            });
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided',
            });
        }

        // Return array of uploaded image URLs
        const uploadedImages = (req.files as any[]).map(file => ({
            url: file.path,
            filename: file.filename,
        }));

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedImages,
        });
    });
};

// ==================== Avatar Upload ====================
export const uploadUserAvatar = async (req: Request, res: Response, next: NextFunction) => {
    uploadAvatar(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Avatar upload failed',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No avatar file provided',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                url: (req.file as any).path,
                filename: req.file.filename,
            },
        });
    });
};

// ==================== Category Icon Upload ====================
export const uploadCategoryImage = async (req: Request, res: Response, next: NextFunction) => {
    uploadCategoryIcon(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Category icon upload failed',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No icon file provided',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category icon uploaded successfully',
            data: {
                url: (req.file as any).path,
                filename: req.file.filename,
            },
        });
    });
};

// ==================== Platform Icon Upload ====================
export const uploadPlatformImage = async (req: Request, res: Response, next: NextFunction) => {
    uploadPlatformIcon(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Platform icon upload failed',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No icon file provided',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Platform icon uploaded successfully',
            data: {
                url: (req.file as any).path,
                filename: req.file.filename,
            },
        });
    });
};

// ==================== Software Screenshots Upload ====================
export const uploadSoftwareScreenshots = async (req: Request, res: Response, next: NextFunction) => {
    uploadSoftwareImages(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'Screenshots upload failed',
            });
        }

        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No screenshot files provided',
            });
        }

        const uploadedImages = (req.files as any[]).map(file => ({
            url: file.path,
            filename: file.filename,
        }));

        res.status(200).json({
            success: true,
            message: 'Screenshots uploaded successfully',
            data: uploadedImages,
        });
    });
};

// ==================== ZIP File Upload (Download Files) ====================
export const uploadZipFile = async (req: Request, res: Response, next: NextFunction) => {
    uploadDownloadFile(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'ZIP file upload failed',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No ZIP file provided',
            });
        }

        res.status(200).json({
            success: true,
            message: 'ZIP file uploaded successfully',
            data: {
                url: (req.file as any).path,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
            },
        });
    });
};

// ==================== Delete Image ====================
export const removeImage = async (req: Request, res: Response) => {
    try {
        const { url, type } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required',
            });
        }

        // Get public ID from URL
        const publicId = getPublicIdFromUrl(url);

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL',
            });
        }

        // Delete from Cloudinary (check if it's a raw file or image)
        const isRawFile = type === 'raw' || url.includes('/raw/upload/');
        const deleted = isRawFile
            ? await deleteRawFile(publicId)
            : await deleteImage(publicId);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete file',
            });
        }
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};

