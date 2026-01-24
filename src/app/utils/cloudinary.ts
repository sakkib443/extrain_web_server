// ===================================================================
// ExtraWeb Backend - Cloudinary Configuration
// Image upload setup using Cloudinary
// ===================================================================

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import config from '../config';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
});

// Create storage options for different upload types (Images)
const createStorage = (folder: string) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            // Get file extension
            const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
            // Map common extensions to cloudinary format
            const formatMap: { [key: string]: string } = {
                'jpg': 'jpg',
                'jpeg': 'jpg',
                'png': 'png',
                'gif': 'gif',
                'webp': 'webp',
                'svg': 'svg'
            };
            const format = formatMap[ext] || 'auto';

            return {
                folder: `Extrain Web/${folder}`,
                format: format,
                transformation: [
                    { quality: 'auto:good' }
                ],
                public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            };
        },
    });
};

// Create storage for raw files (ZIP, RAR, etc.)
const createRawStorage = (folder: string) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            return {
                folder: `Extrain Web/${folder}`,
                resource_type: 'raw', // Important: raw for non-image files
                public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
            };
        },
    });
};

// File filter for image uploads
const imageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only JPG, PNG, GIF, WEBP, SVG are allowed. Got: ${file.mimetype}`));
    }
};

// ==================== Multer Upload Middleware ====================

// Website images upload (multiple images allowed)
export const uploadWebsiteImages = multer({
    storage: createStorage('websites'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: imageFileFilter,
}).array('images', 10); // Max 10 images

// Category icon upload (single image)
export const uploadCategoryIcon = multer({
    storage: createStorage('categories'),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: imageFileFilter,
}).single('icon');

// Platform icon upload (single image)
export const uploadPlatformIcon = multer({
    storage: createStorage('platforms'),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: imageFileFilter,
}).single('icon');

// User avatar upload (single image)
export const uploadAvatar = multer({
    storage: createStorage('avatars'),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: imageFileFilter,
}).single('avatar');

// Software screenshots upload (multiple images)
export const uploadSoftwareImages = multer({
    storage: createStorage('software'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: imageFileFilter,
}).array('images', 10);

// Generic single image upload
export const uploadSingleImage = multer({
    storage: createStorage('general'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
}).single('image');

// ==================== Raw File Upload (ZIP, RAR) ====================

// Download file upload (ZIP, RAR for website templates)
export const uploadDownloadFile = multer({
    storage: createRawStorage('downloads'),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for ZIP files
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/gzip',
            'application/x-tar'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP, RAR, 7z, TAR, GZ files are allowed'));
        }
    }
}).single('file');

// ==================== Helper Functions ====================

// Delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return false;
    }
};

// Delete raw file from Cloudinary
export const deleteRawFile = async (publicId: string): Promise<boolean> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        return result.result === 'ok';
    } catch (error) {
        console.error('Error deleting raw file from Cloudinary:', error);
        return false;
    }
};

// Get public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        // Get everything after 'upload' and version, remove extension
        const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
        return pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove extension
    } catch (error) {
        return null;
    }
};

// Export cloudinary instance for direct use
export { cloudinary };

