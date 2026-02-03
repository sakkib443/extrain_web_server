// ===================================================================
// Website Customization Request Module
// Users can request changes to their purchased websites
// Admin can track and complete each request item
// ===================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Request, Response } from 'express';
import express from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

// ==================== INTERFACES ====================
interface IRequestItem {
    itemNumber: number;
    sectionName: string;
    editType: 'text' | 'image' | 'design' | 'functionality' | 'contact' | 'other';
    description: string;
    images: string[];
    currentValue?: string;
    newValue?: string;
    isCompleted: boolean;
    adminNote?: string;
    completedAt?: Date;
}

interface ICustomizationRequest extends Document {
    user: mongoose.Types.ObjectId;
    order: mongoose.Types.ObjectId;
    website: mongoose.Types.ObjectId;
    websiteTitle: string;
    requestItems: IRequestItem[];
    overallStatus: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    adminMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== SCHEMA ====================
const RequestItemSchema = new Schema<IRequestItem>({
    itemNumber: { type: Number, required: true },
    sectionName: { type: String, required: true, trim: true },
    editType: {
        type: String,
        enum: ['text', 'image', 'design', 'functionality', 'contact', 'other'],
        default: 'text'
    },
    description: { type: String, trim: true },
    images: [{ type: String }],
    currentValue: { type: String },
    newValue: { type: String },
    isCompleted: { type: Boolean, default: false },
    adminNote: { type: String },
    completedAt: { type: Date }
}, { _id: true });

const CustomizationRequestSchema = new Schema<ICustomizationRequest>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    website: { type: Schema.Types.ObjectId, ref: 'Website', required: true },
    websiteTitle: { type: String, required: true },
    requestItems: [RequestItemSchema],
    overallStatus: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    adminMessage: { type: String }
}, {
    timestamps: true
});

// Indexes for faster queries
CustomizationRequestSchema.index({ user: 1, createdAt: -1 });
CustomizationRequestSchema.index({ overallStatus: 1, createdAt: -1 });

export const CustomizationRequest: Model<ICustomizationRequest> = mongoose.model('CustomizationRequest', CustomizationRequestSchema);

// ==================== SERVICE ====================
const CustomizationService = {
    // User: Create a new customization request
    async createRequest(userId: string, data: any): Promise<ICustomizationRequest> {
        // Validate request items
        if (!data.requestItems || data.requestItems.length === 0) {
            throw new Error('কমপক্ষে একটি request item দিতে হবে');
        }

        // Add item numbers
        const requestItems = data.requestItems.map((item: any, index: number) => ({
            ...item,
            itemNumber: index + 1,
            isCompleted: false
        }));

        const request = await CustomizationRequest.create({
            user: userId,
            order: data.orderId,
            website: data.websiteId,
            websiteTitle: data.websiteTitle,
            requestItems,
            priority: data.priority || 'medium',
            overallStatus: 'pending'
        });

        return request;
    },

    // User: Get my requests
    async getMyRequests(userId: string, query: any): Promise<{ requests: ICustomizationRequest[]; total: number }> {
        const { status, page = 1, limit = 10 } = query;
        const filter: any = { user: userId };

        if (status) filter.overallStatus = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [requests, total] = await Promise.all([
            CustomizationRequest.find(filter)
                .populate('website', 'title images slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            CustomizationRequest.countDocuments(filter)
        ]);

        return { requests, total };
    },

    // User: Get single request
    async getRequestById(requestId: string, userId?: string): Promise<ICustomizationRequest | null> {
        const filter: any = { _id: requestId };
        if (userId) filter.user = userId;

        return await CustomizationRequest.findOne(filter)
            .populate('user', 'firstName lastName email phone')
            .populate('website', 'title images slug price')
            .populate('order', 'orderNumber totalAmount');
    },

    // User: Add more items to existing request
    async addRequestItems(requestId: string, userId: string, items: any[]): Promise<ICustomizationRequest | null> {
        const request = await CustomizationRequest.findOne({ _id: requestId, user: userId });
        if (!request) return null;

        const lastItemNumber = request.requestItems.length;
        const newItems = items.map((item, index) => ({
            ...item,
            itemNumber: lastItemNumber + index + 1,
            isCompleted: false
        }));

        request.requestItems.push(...newItems);
        if (request.overallStatus === 'completed') {
            request.overallStatus = 'in-progress';
        }

        await request.save();
        return request;
    },

    // Admin: Get all requests
    async getAllRequests(query: any): Promise<{ requests: ICustomizationRequest[]; total: number; stats: any }> {
        const { status, priority, search, page = 1, limit = 10 } = query;
        const filter: any = {};

        if (status) filter.overallStatus = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { websiteTitle: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [requests, total, pending, inProgress, completed] = await Promise.all([
            CustomizationRequest.find(filter)
                .populate('user', 'firstName lastName email phone')
                .populate('website', 'title images slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            CustomizationRequest.countDocuments(filter),
            CustomizationRequest.countDocuments({ overallStatus: 'pending' }),
            CustomizationRequest.countDocuments({ overallStatus: 'in-progress' }),
            CustomizationRequest.countDocuments({ overallStatus: 'completed' })
        ]);

        return {
            requests,
            total,
            stats: { pending, inProgress, completed, total: pending + inProgress + completed }
        };
    },

    // Admin: Toggle item completion
    async toggleItemCompletion(requestId: string, itemId: string, isCompleted: boolean, adminNote?: string): Promise<ICustomizationRequest | null> {
        const request = await CustomizationRequest.findById(requestId);
        if (!request) return null;

        const item = request.requestItems.find(i => i._id?.toString() === itemId);
        if (!item) return null;

        item.isCompleted = isCompleted;
        item.adminNote = adminNote || item.adminNote;
        item.completedAt = isCompleted ? new Date() : undefined;

        // Update overall status based on items
        const completedCount = request.requestItems.filter(i => i.isCompleted).length;
        const totalCount = request.requestItems.length;

        if (completedCount === 0) {
            request.overallStatus = 'pending';
        } else if (completedCount === totalCount) {
            request.overallStatus = 'completed';
        } else {
            request.overallStatus = 'in-progress';
        }

        await request.save();
        return request;
    },

    // Admin: Update request status and message
    async updateRequestStatus(requestId: string, status: string, adminMessage?: string): Promise<ICustomizationRequest | null> {
        const update: any = { overallStatus: status };
        if (adminMessage) update.adminMessage = adminMessage;

        return await CustomizationRequest.findByIdAndUpdate(requestId, update, { new: true })
            .populate('user', 'firstName lastName email')
            .populate('website', 'title images');
    },

    // Admin: Mark all items as completed
    async completeAllItems(requestId: string): Promise<ICustomizationRequest | null> {
        const request = await CustomizationRequest.findById(requestId);
        if (!request) return null;

        request.requestItems.forEach(item => {
            item.isCompleted = true;
            item.completedAt = new Date();
        });
        request.overallStatus = 'completed';

        await request.save();
        return request;
    }
};

// ==================== CONTROLLER ====================
const CustomizationController = {
    // User: Create request
    createRequest: catchAsync(async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const request = await CustomizationService.createRequest(userId, req.body);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'কাস্টমাইজেশন রিকোয়েস্ট সফলভাবে জমা হয়েছে',
            data: request
        });
    }),

    // User: Get my requests
    getMyRequests: catchAsync(async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const result = await CustomizationService.getMyRequests(userId, req.query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'আপনার রিকোয়েস্ট লিস্ট',
            data: result.requests,
            meta: {
                total: result.total,
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10
            }
        });
    }),

    // User: Get single request
    getMyRequestById: catchAsync(async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const request = await CustomizationService.getRequestById(req.params.id, userId);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'রিকোয়েস্ট বিস্তারিত',
            data: request
        });
    }),

    // User: Add items to request
    addItems: catchAsync(async (req: Request, res: Response) => {
        const userId = (req as any).user._id;
        const request = await CustomizationService.addRequestItems(req.params.id, userId, req.body.items);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'নতুন items যোগ হয়েছে',
            data: request
        });
    }),

    // Admin: Get all requests
    getAllRequests: catchAsync(async (req: Request, res: Response) => {
        const result = await CustomizationService.getAllRequests(req.query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'সকল কাস্টমাইজেশন রিকোয়েস্ট',
            data: result.requests,
            meta: {
                total: result.total,
                stats: result.stats,
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10
            }
        });
    }),

    // Admin: Get single request
    getRequestById: catchAsync(async (req: Request, res: Response) => {
        const request = await CustomizationService.getRequestById(req.params.id);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'রিকোয়েস্ট বিস্তারিত',
            data: request
        });
    }),

    // Admin: Toggle item completion
    toggleItemCompletion: catchAsync(async (req: Request, res: Response) => {
        const { itemId, isCompleted, adminNote } = req.body;
        const request = await CustomizationService.toggleItemCompletion(req.params.id, itemId, isCompleted, adminNote);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট বা আইটেম পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: isCompleted ? 'আইটেম সম্পন্ন হিসেবে চিহ্নিত' : 'আইটেম অসম্পন্ন হিসেবে চিহ্নিত',
            data: request
        });
    }),

    // Admin: Update status
    updateStatus: catchAsync(async (req: Request, res: Response) => {
        const { status, adminMessage } = req.body;
        const request = await CustomizationService.updateRequestStatus(req.params.id, status, adminMessage);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'স্ট্যাটাস আপডেট হয়েছে',
            data: request
        });
    }),

    // Admin: Complete all items
    completeAll: catchAsync(async (req: Request, res: Response) => {
        const request = await CustomizationService.completeAllItems(req.params.id);

        if (!request) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: 'রিকোয়েস্ট পাওয়া যায়নি'
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'সকল আইটেম সম্পন্ন হয়েছে',
            data: request
        });
    })
};

// ==================== ROUTES ====================
const router = express.Router();

// User routes (authenticated)
router.use(authMiddleware);
router.post('/my-requests', CustomizationController.createRequest);
router.get('/my-requests', CustomizationController.getMyRequests);
router.get('/my-requests/:id', CustomizationController.getMyRequestById);
router.patch('/my-requests/:id/add-items', CustomizationController.addItems);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), CustomizationController.getAllRequests);
router.get('/admin/:id', authorizeRoles('admin'), CustomizationController.getRequestById);
router.patch('/admin/:id/toggle-item', authorizeRoles('admin'), CustomizationController.toggleItemCompletion);
router.patch('/admin/:id/status', authorizeRoles('admin'), CustomizationController.updateStatus);
router.patch('/admin/:id/complete-all', authorizeRoles('admin'), CustomizationController.completeAll);

export const CustomizationRoutes = router;
export default CustomizationService;
