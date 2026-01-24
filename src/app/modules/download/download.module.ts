// ===================================================================
// ExtraWeb Backend - Download Module
// Secure download management for purchased products
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { Request, Response } from 'express';
import crypto from 'crypto';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth';

// ==================== INTERFACE ====================
export interface IDownload {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    order: Types.ObjectId;
    product: Types.ObjectId;
    productType: 'website' | 'software';
    productModel: 'Website' | 'Software';
    productTitle: string;
    downloadCount: number;
    maxDownloads: number;
    lastDownload?: Date;
    expiryDate?: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== MODEL ====================
const downloadSchema = new Schema<IDownload>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        product: { type: Schema.Types.ObjectId, required: true, refPath: 'productModel' },
        productType: { type: String, enum: ['website', 'software'], required: true },
        productModel: { type: String, enum: ['Website', 'Software'], required: true },
        productTitle: { type: String, required: true },
        downloadCount: { type: Number, default: 0 },
        maxDownloads: { type: Number, default: 10 },
        lastDownload: { type: Date },
        expiryDate: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

downloadSchema.index({ user: 1 });
downloadSchema.index({ order: 1, product: 1 });

export const Download = model<IDownload>('Download', downloadSchema);

// ==================== SERVICE ====================
const DownloadService = {
    // Create download record after successful purchase
    async createDownloadRecord(
        userId: string,
        orderId: string,
        productId: string,
        productType: 'website' | 'software',
        productTitle: string
    ): Promise<IDownload> {
        // Set expiry to 1 year from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Map productType to Mongoose model name
        const productModel = productType === 'website' ? 'Website' : 'Software';

        const download = await Download.create({
            user: userId,
            order: orderId,
            product: productId,
            productType,
            productModel,
            productTitle,
            expiryDate,
            isActive: true,
        });

        return download;
    },

    // Get user's download list
    async getUserDownloads(userId: string): Promise<IDownload[]> {
        return await Download.find({ user: userId, isActive: true })
            .populate('product', 'title slug images downloadFile')
            .sort({ createdAt: -1 });
    },

    // Generate secure download link
    async generateDownloadLink(
        userId: string,
        downloadId: string
    ): Promise<{ downloadUrl: string; expiresIn: number }> {
        const download = await Download.findOne({ _id: downloadId, user: userId });

        if (!download) {
            throw new AppError(404, 'Download not found');
        }

        if (!download.isActive) {
            throw new AppError(403, 'Download is no longer active');
        }

        if (download.expiryDate && download.expiryDate < new Date()) {
            throw new AppError(403, 'Download has expired');
        }

        if (download.downloadCount >= download.maxDownloads) {
            throw new AppError(403, 'Maximum download limit reached');
        }

        // Check for installment overdue
        const { Order } = await import('../order/order.module');
        const order = await Order.findById(download.order);
        if (order && order.isInstallment && order.installments) {
            const now = new Date();
            const hasOverdue = order.installments.some(inst =>
                inst.status === 'pending' && new Date(inst.dueDate) < now
            );

            if (hasOverdue) {
                throw new AppError(403, 'Download locked due to overdue installment payment. Please clear your dues.');
            }
        }

        // Update download count
        download.downloadCount += 1;
        download.lastDownload = new Date();
        await download.save();

        // Generate signed URL (in real scenario, use S3 signed URLs or similar)
        // This is a placeholder - implement actual secure download logic
        const token = crypto.randomBytes(32).toString('hex');
        const expiresIn = 3600; // 1 hour

        // In production, store this token and verify when actually downloading
        const downloadUrl = `/api/downloads/file/${downloadId}?token=${token}`;

        return { downloadUrl, expiresIn };
    },

    // Check if user has access to product
    async hasAccess(userId: string, productId: string): Promise<boolean> {
        const download = await Download.findOne({
            user: userId,
            product: productId,
            isActive: true,
        });

        if (!download) return false;
        if (download.expiryDate && download.expiryDate < new Date()) return false;
        if (download.downloadCount >= download.maxDownloads) return false;

        return true;
    },
};

// ==================== CONTROLLER ====================
const DownloadController = {
    getMyDownloads: catchAsync(async (req: Request, res: Response) => {
        const downloads = await DownloadService.getUserDownloads(req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Downloads fetched', data: downloads });
    }),

    generateDownloadLink: catchAsync(async (req: Request, res: Response) => {
        const result = await DownloadService.generateDownloadLink(req.user!.userId, req.params.id);
        sendResponse(res, { statusCode: 200, success: true, message: 'Download link generated', data: result });
    }),

    checkAccess: catchAsync(async (req: Request, res: Response) => {
        const hasAccess = await DownloadService.hasAccess(req.user!.userId, req.params.productId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Access checked', data: { hasAccess } });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

router.get('/', authMiddleware, DownloadController.getMyDownloads);
router.get('/:id/link', authMiddleware, DownloadController.generateDownloadLink);
router.get('/access/:productId', authMiddleware, DownloadController.checkAccess);

export const DownloadRoutes = router;
export default DownloadService;
