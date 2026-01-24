// ===================================================================
// ExtraWeb Backend - Order Module
// Purchase/Order management
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import express from 'express';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import DownloadService from '../download/download.module';
import EmailService from '../email/email.service';
import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.module';

// ==================== INTERFACE ====================
export interface IOrderItem {
    product: Types.ObjectId;
    productType: 'website' | 'software' | 'course';
    title: string;
    price: number;
    image?: string;
}

export interface IOrder {
    _id?: Types.ObjectId;
    orderNumber: string;
    user: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: string;
    transactionId?: string;
    orderDate: Date;
    // Manual Payment Details
    manualPaymentDetails?: {
        provider: 'bkash' | 'rocket' | 'nagad' | 'manual';
        accountNumber: string;
        transactionId: string;
        date: string;
        time: string;
    };
    // Installment Settings
    isInstallment?: boolean;
    installmentCount?: number;
    installments?: Array<{
        installmentNumber: number;
        amount: number;
        dueDate: Date;
        status: 'pending' | 'completed' | 'failed';
        paymentId?: string;
        paymentDetails?: {
            provider: 'bkash' | 'rocket' | 'nagad' | 'manual';
            accountNumber: string;
            transactionId: string;
            date: string;
            time: string;
        };
        paidAt?: Date;
    }>;
    couponCode?: string;
    discountAmount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== MODEL ====================
const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [
            {
                product: { type: Schema.Types.ObjectId, required: true },
                productType: { type: String, enum: ['website', 'software', 'course'], required: true },
                title: { type: String, required: true },
                price: { type: Number, required: true },
                image: { type: String },
            },
        ],
        totalAmount: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentMethod: { type: String, default: 'stripe' },
        transactionId: { type: String },
        orderDate: { type: Date, default: Date.now },
        // Manual Payment Details
        manualPaymentDetails: {
            provider: { type: String, enum: ['bkash', 'rocket', 'nagad', 'manual'] },
            accountNumber: { type: String },
            transactionId: { type: String },
            date: { type: String },
            time: { type: String },
        },
        // Installment tracking
        isInstallment: { type: Boolean, default: false },
        installmentCount: { type: Number, default: 1 },
        installments: [
            {
                installmentNumber: { type: Number },
                amount: { type: Number },
                dueDate: { type: Date },
                status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
                paymentId: { type: String },
                paymentDetails: {
                    provider: { type: String, enum: ['bkash', 'rocket', 'nagad', 'manual'] },
                    accountNumber: { type: String },
                    transactionId: { type: String },
                    date: { type: String },
                    time: { type: String },
                },
                paidAt: { type: Date }
            }
        ],
        couponCode: { type: String },
        discountAmount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });

export const Order = model<IOrder>('Order', orderSchema);

// ==================== VALIDATION ====================
export const createOrderValidation = z.object({
    body: z.object({
        items: z.array(
            z.object({
                productId: z.string(),
                productType: z.enum(['website', 'software', 'course']),
                title: z.string(),
                price: z.number(),
                image: z.string().optional(),
            })
        ).min(1, 'At least one item is required'),
        paymentMethod: z.string().optional(),
        paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
        // Installment fields
        isInstallment: z.boolean().optional(),
        installmentCount: z.number().optional(),
        installments: z.array(z.object({
            installmentNumber: z.number(),
            amount: z.number(),
            dueDate: z.string().or(z.date()),
            status: z.enum(['pending', 'completed', 'failed']).optional(),
            paymentDetails: z.object({
                provider: z.enum(['bkash', 'rocket', 'nagad', 'manual']),
                accountNumber: z.string(),
                transactionId: z.string(),
                date: z.string(),
                time: z.string(),
            }).optional(),
        })).optional(),
        couponCode: z.string().optional(),
        discountAmount: z.number().optional(),
        // Manual Payment fields
        manualPaymentDetails: z.object({
            provider: z.enum(['bkash', 'rocket', 'nagad', 'manual']),
            accountNumber: z.string(),
            transactionId: z.string(),
            date: z.string(),
            time: z.string(),
        }).optional(),
    }),
});

// ==================== SERVICE ====================
// Generate unique order number
const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EW-${timestamp}-${random}`;
};

const deliverOrderItems = async (order: any, rawItems?: any[]): Promise<void> => {
    const userId = order.user.toString();
    const itemsToDeliver = rawItems || order.items;

    for (const item of itemsToDeliver) {
        try {
            const productId = item.productId || item.product;

            if (item.productType === 'course') {
                const { EnrollmentService } = await import('../enrollment/enrollment.service');
                const { Course } = await import('../course/course.model');
                try {
                    await EnrollmentService.enrollStudent(userId, productId, order._id!.toString());
                    // Increment totalEnrollments for course
                    await Course.findByIdAndUpdate(productId, { $inc: { totalEnrollments: 1 } });
                    console.log(`Enrolled user ${userId} in course ${productId}`);
                } catch (enrollError: any) {
                    // Ignore "already enrolled" errors but log others
                    if (enrollError.statusCode !== 400) {
                        console.error(`Enrollment failed for ${productId}:`, enrollError);
                    }
                }
            } else if (item.productType === 'website') {
                const { Website } = await import('../website/website.model');
                await Website.findByIdAndUpdate(productId, { $inc: { salesCount: 1 } });
                await DownloadService.createDownloadRecord(
                    userId,
                    order._id!.toString(),
                    productId,
                    item.productType,
                    item.title
                );
            } else if (item.productType === 'software') {
                const { Software } = await import('../software/software.model');
                await Software.findByIdAndUpdate(productId, { $inc: { salesCount: 1 } });
                await DownloadService.createDownloadRecord(
                    userId,
                    order._id!.toString(),
                    productId,
                    item.productType,
                    item.title
                );
            }
        } catch (error) {
            console.error(`Failed to deliver ${item.title}:`, error);
        }
    }

    // Send invoice email
    try {
        const user = await User.findById(userId);
        if (user) {
            EmailService.sendInvoiceEmail(user.email, {
                firstName: user.firstName,
                email: user.email,
                orderId: order._id!.toString(),
                items: itemsToDeliver.map((item: any) => ({
                    title: item.title,
                    price: item.price,
                    productType: item.productType
                })),
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                transactionId: order.transactionId,
                orderDate: order.orderDate
            }).catch(err => console.error('Invoice email error:', err));
        }
    } catch (error) {
        console.error('Failed to send invoice email:', error);
    }
};

const OrderService = {
    async createOrder(
        userId: string,
        items: Array<{ productId: string; productType: 'website' | 'software' | 'course'; title: string; price: number; image?: string }>,
        paymentMethod: string = 'stripe',
        paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending',
        installmentData?: {
            isInstallment?: boolean;
            installmentCount?: number;
            installments?: any[];
            couponCode?: string;
            discountAmount?: number;
        },
        manualPaymentDetails?: IOrder['manualPaymentDetails']
    ): Promise<IOrder> {
        console.log(`Processing order for user: ${userId}, items count: ${items.length}`);

        const orderItems = items.map((item) => ({
            product: new Types.ObjectId(item.productId),
            productType: item.productType,
            title: item.title,
            price: item.price,
            image: item.image,
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

        // If it's an installment order and manual payment proof is provided, 
        // associate it with the first installment
        let finalInstallments = installmentData?.installments;
        if (installmentData?.isInstallment && finalInstallments && finalInstallments.length > 0 && manualPaymentDetails) {
            finalInstallments[0].paymentDetails = manualPaymentDetails;
            finalInstallments[0].status = 'pending';
        }

        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            user: userId,
            items: orderItems,
            totalAmount: installmentData?.discountAmount
                ? totalAmount - installmentData.discountAmount
                : totalAmount,
            paymentMethod,
            paymentStatus,
            orderDate: new Date(),
            ...installmentData,
            installments: finalInstallments,
            manualPaymentDetails
        });

        // Create notification for admin immediately when order is placed
        try {
            const user = await User.findById(userId);
            if (user) {
                const productTitles = items.map(item => item.title).join(', ');
                await NotificationService.createOrderNotification({
                    orderId: order._id,
                    userId: new Types.ObjectId(userId),
                    userName: `${user.firstName} ${user.lastName || ''}`.trim(),
                    amount: totalAmount,
                    productName: productTitles.length > 50 ? productTitles.substring(0, 47) + '...' : productTitles,
                });
            }
        } catch (err) {
            console.error('Order notification error:', err);
        }

        // If payment is completed, handle delivery (downloads or enrollments)
        if (paymentStatus === 'completed') {
            await deliverOrderItems(order, items);
        }

        return order;
    },

    async getUserOrders(userId: string, page = 1, limit = 10): Promise<{ data: IOrder[]; total: number }> {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find({ user: userId }).sort({ orderDate: -1 }).skip(skip).limit(limit),
            Order.countDocuments({ user: userId }),
        ]);
        return { data: orders, total };
    },

    async getOrderById(orderId: string, userId: string): Promise<IOrder> {
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) throw new AppError(404, 'Order not found');
        return order;
    },

    async updatePaymentStatus(orderId: string, status: IOrder['paymentStatus'], transactionId?: string): Promise<IOrder> {
        const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus: status, transactionId },
            { new: true }
        );
        if (!order) throw new AppError(404, 'Order not found');

        // If transitioning to completed, trigger delivery
        if (status === 'completed') {
            await deliverOrderItems(order);
        }

        return order;
    },

    async getAllOrders(page = 1, limit = 10, status?: string): Promise<{ data: IOrder[]; total: number }> {
        const query: any = {};
        if (status) {
            if (status === 'installment') {
                query.isInstallment = true;
            } else {
                query.paymentStatus = status;
            }
        }

        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(query).populate('user', 'firstName lastName email').sort({ orderDate: -1 }).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);
        return { data: orders, total };
    },

    async payInstallment(orderId: string, userId: string, installmentNumber: number, paymentDetails: any): Promise<IOrder> {
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) throw new AppError(404, 'Order not found');
        if (!order.installments) throw new AppError(400, 'This is not an installment order');

        const installment = order.installments.find(i => i.installmentNumber === installmentNumber);
        if (!installment) throw new AppError(404, 'Installment not found');
        if (installment.status === 'completed') throw new AppError(400, 'Installment already paid');

        // Update the specific installment with payment proof
        installment.paymentDetails = paymentDetails;
        installment.status = 'pending'; // Set to pending for admin approval

        await order.save();
        return order;
    },

    async approveInstallment(orderId: string, installmentNumber: number, status: 'completed' | 'failed'): Promise<IOrder> {
        const order = await Order.findById(orderId);
        if (!order) throw new AppError(404, 'Order not found');
        if (!order.installments) throw new AppError(400, 'This is not an installment order');

        const installment = order.installments.find(i => i.installmentNumber === installmentNumber);
        if (!installment) throw new AppError(404, 'Installment not found');

        installment.status = status;
        if (status === 'completed') {
            installment.paidAt = new Date();
        }

        // If it's the first installment and it's being completed, deliver items
        if (installmentNumber === 1 && status === 'completed') {
            await deliverOrderItems(order);
        }

        // Check if all installments are completed
        const allCompleted = order.installments.every(i => i.status === 'completed');
        if (allCompleted) {
            order.paymentStatus = 'completed';
        }

        await order.save();
        return order;
    }
};

// ==================== CONTROLLER ====================
const OrderController = {
    createOrder: catchAsync(async (req: Request, res: Response) => {
        const { items, paymentMethod, paymentStatus, isInstallment, installmentCount, installments, couponCode, discountAmount, manualPaymentDetails } = req.body;

        const installmentData = isInstallment ? {
            isInstallment,
            installmentCount,
            installments,
            couponCode,
            discountAmount
        } : {
            couponCode,
            discountAmount
        };

        const order = await OrderService.createOrder(
            req.user!.userId,
            items,
            paymentMethod,
            paymentStatus,
            installmentData,
            manualPaymentDetails
        );
        sendResponse(res, { statusCode: 201, success: true, message: 'Order created', data: order });
    }),

    getMyOrders: catchAsync(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await OrderService.getUserOrders(req.user!.userId, page, limit);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Orders fetched',
            meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
            data: result.data,
        });
    }),

    getOrderById: catchAsync(async (req: Request, res: Response) => {
        const order = await OrderService.getOrderById(req.params.id, req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Order fetched', data: order });
    }),

    // Admin
    getAllOrders: catchAsync(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status as string | undefined;
        const result = await OrderService.getAllOrders(page, limit, status);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Orders fetched',
            meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
            data: result.data,
        });
    }),

    updateOrderStatus: catchAsync(async (req: Request, res: Response) => {
        const { status, transactionId } = req.body;
        const order = await OrderService.updatePaymentStatus(req.params.id, status, transactionId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Order updated', data: order });
    }),

    payInstallment: catchAsync(async (req: Request, res: Response) => {
        const { orderId, installmentNumber, paymentDetails } = req.body;
        const order = await OrderService.payInstallment(orderId, req.user!.userId, installmentNumber, paymentDetails);
        sendResponse(res, { statusCode: 200, success: true, message: 'Installment payment proof submitted', data: order });
    }),

    approveInstallment: catchAsync(async (req: Request, res: Response) => {
        const { orderId, installmentNumber, status } = req.body;
        const order = await OrderService.approveInstallment(orderId, installmentNumber, status);
        sendResponse(res, { statusCode: 200, success: true, message: `Installment marked as ${status}`, data: order });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

router.post('/', authMiddleware, validateRequest(createOrderValidation), OrderController.createOrder);
router.get('/my', authMiddleware, OrderController.getMyOrders);
router.get('/my/:id', authMiddleware, OrderController.getOrderById);

// Admin
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), OrderController.getAllOrders);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), OrderController.updateOrderStatus);
router.post('/pay-installment', authMiddleware, OrderController.payInstallment);
router.post('/admin/approve-installment', authMiddleware, authorizeRoles('admin'), OrderController.approveInstallment);

export const OrderRoutes = router;
export default OrderService;
