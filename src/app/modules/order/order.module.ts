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
            const productId = item.product || item.productId;

            if (item.productType === 'course') {
                const { EnrollmentService } = await import('../enrollment/enrollment.service');
                const { Course } = await import('../course/course.model');
                try {
                    await EnrollmentService.enrollStudent(userId, productId.toString(), order._id!.toString());
                    await Course.findByIdAndUpdate(productId, { $inc: { totalEnrollments: 1 } });
                } catch (enrollError: any) {
                    if (enrollError.statusCode !== 400) console.error(`Enrollment failed:`, enrollError);
                }
            } else if (item.productType === 'website') {
                const { Website } = await import('../website/website.model');
                await Website.findByIdAndUpdate(productId, { $inc: { salesCount: 1 } });
                await DownloadService.createDownloadRecord(userId, order._id!.toString(), productId.toString(), item.productType, item.title);
            } else if (item.productType === 'software') {
                const { Software } = await import('../software/software.model');
                await Software.findByIdAndUpdate(productId, { $inc: { salesCount: 1 } });
                await DownloadService.createDownloadRecord(userId, order._id!.toString(), productId.toString(), item.productType, item.title);
            }
        } catch (error) {
            console.error(`Failed to deliver ${item.title}:`, error);
        }
    }

    try {
        const user = await User.findById(userId);
        if (user) {
            EmailService.sendInvoiceEmail(user.email, {
                firstName: user.firstName,
                email: user.email,
                orderId: order._id!.toString(),
                items: itemsToDeliver.map((item: any) => ({ title: item.title, price: item.price, productType: item.productType })),
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod,
                transactionId: order.transactionId,
                orderDate: order.orderDate
            }).catch(err => console.error('Invoice email error:', err));
        }
    } catch (error) {
        console.error('Email error:', error);
    }
};

const OrderService = {
    async createOrder(userId: string, items: any[], paymentMethod = 'stripe', paymentStatus: any = 'pending', installmentData?: any, manualPaymentDetails?: any): Promise<IOrder> {
        const orderItems = items.map((item) => ({
            product: new Types.ObjectId(item.productId),
            productType: item.productType,
            title: item.title,
            price: item.price,
            image: item.image,
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
        let finalInstallments = installmentData?.installments;
        if (installmentData?.isInstallment && finalInstallments && manualPaymentDetails) {
            finalInstallments[0].paymentDetails = manualPaymentDetails;
            finalInstallments[0].status = 'pending';
        }

        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            user: new Types.ObjectId(userId),
            items: orderItems,
            totalAmount: installmentData?.discountAmount ? totalAmount - installmentData.discountAmount : totalAmount,
            paymentMethod,
            paymentStatus,
            manualPaymentDetails,
            isInstallment: installmentData?.isInstallment,
            installmentCount: installmentData?.installmentCount,
            installments: finalInstallments,
            couponCode: installmentData?.couponCode,
            discountAmount: installmentData?.discountAmount
        });

        try {
            await NotificationService.createNotification({
                forUser: new Types.ObjectId(userId),
                forAdmin: false,
                title: 'Order Placed',
                message: `Your order #${order.orderNumber} has been placed successfully.`,
                type: 'order'
            });
        } catch (err) { console.error('Notification error:', err); }

        if (paymentStatus === 'completed') await deliverOrderItems(order, items);
        return order;
    },

    async getUserOrders(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find({ user: new Types.ObjectId(userId) }).sort({ orderDate: -1 }).skip(skip).limit(limit),
            Order.countDocuments({ user: new Types.ObjectId(userId) }),
        ]);
        return { data: orders, total };
    },

    async getAllOrders(page = 1, limit = 10, status?: string) {
        const query: any = {};
        if (status) status === 'installment' ? query.isInstallment = true : query.paymentStatus = status;
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find(query).populate('user', 'firstName lastName email').sort({ orderDate: -1 }).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);
        return { data: orders, total };
    },

    async getOrderById(orderId: string, userId: string) {
        return await Order.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
    },

    async updatePaymentStatus(orderId: string, status: any, transactionId?: string) {
        const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: status, transactionId }, { new: true });
        if (!order) throw new AppError(404, 'Order not found');
        if (status === 'completed') await deliverOrderItems(order);
        return order;
    },

    async payInstallment(orderId: string, userId: string, installmentNumber: number, paymentDetails: any) {
        const order = await Order.findOne({ _id: orderId, user: new Types.ObjectId(userId) });
        if (!order || !order.installments) throw new AppError(404, 'Order/Installment not found');
        const inst = order.installments.find(i => i.installmentNumber === installmentNumber);
        if (!inst) throw new AppError(404, 'Installment not found');
        inst.paymentDetails = paymentDetails;
        inst.status = 'pending';
        await order.save();

        // Trigger notification for admin
        const populatedUser = await User.findById(userId);
        await NotificationService.createInstallmentNotification({
            orderId: order._id as Types.ObjectId,
            userId: new Types.ObjectId(userId),
            userName: populatedUser ? `${populatedUser.firstName} ${populatedUser.lastName}` : 'A User',
            amount: inst.amount,
            installmentNumber: inst.installmentNumber,
            productName: order.items[0]?.title || 'Product',
            isBooking: order.isInstallment || false
        });

        return order;
    },

    async approveInstallment(orderId: string, installmentNumber: number, status: any) {
        const order = await Order.findById(orderId);
        if (!order || !order.installments) throw new AppError(404, 'Order not found');
        const inst = order.installments.find(i => i.installmentNumber === installmentNumber);
        if (!inst) throw new AppError(404, 'Installment not found');
        inst.status = status;
        if (status === 'completed') inst.paidAt = new Date();
        if (installmentNumber === 1 && status === 'completed') await deliverOrderItems(order);
        if (order.installments.every(i => i.status === 'completed')) order.paymentStatus = 'completed';
        await order.save();

        // Trigger notification for user
        await NotificationService.createUserInstallmentApprovalNotification({
            userId: order.user,
            amount: inst.amount,
            installmentNumber: inst.installmentNumber,
            status: status,
            productName: order.items[0]?.title || 'Product'
        });

        return order;
    }
};

// ==================== CONTROLLER ====================
const OrderController = {
    createOrder: catchAsync(async (req, res) => {
        const order = await OrderService.createOrder(req.user!.userId, req.body.items, req.body.paymentMethod, req.body.paymentStatus, req.body, req.body.manualPaymentDetails);
        sendResponse(res, { statusCode: 201, success: true, message: 'Order created', data: order });
    }),
    getMyOrders: catchAsync(async (req, res) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await OrderService.getUserOrders(req.user!.userId, page, limit);
        sendResponse(res, { statusCode: 200, success: true, message: 'Orders fetched', data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    }),
    getAllOrders: catchAsync(async (req, res) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await OrderService.getAllOrders(page, limit, req.query.status as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Orders fetched', data: result.data, meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
    }),
    updateOrderStatus: catchAsync(async (req, res) => {
        const order = await OrderService.updatePaymentStatus(req.params.id, req.body.status, req.body.transactionId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Order updated', data: order });
    }),
    deleteOrder: catchAsync(async (req, res) => {
        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError(404, 'Order not found');

        // Delete related downloads
        try {
            const { Download } = await import('../download/download.module');
            await Download.deleteMany({ orderId: order._id });
        } catch (err) {
            console.error('Error deleting downloads:', err);
        }

        // Delete related enrollments for courses
        try {
            const { Enrollment } = await import('../enrollment/enrollment.model');
            await Enrollment.deleteMany({ orderId: order._id });
        } catch (err) {
            console.error('Error deleting enrollments:', err);
        }

        // Delete the order
        await Order.findByIdAndDelete(req.params.id);

        sendResponse(res, { statusCode: 200, success: true, message: 'Order and related data deleted', data: null });
    }),
    payInstallment: catchAsync(async (req, res) => {
        const order = await OrderService.payInstallment(req.body.orderId, req.user!.userId, req.body.installmentNumber, req.body.paymentDetails);
        sendResponse(res, { statusCode: 200, success: true, message: 'Installment paid', data: order });
    }),
    approveInstallment: catchAsync(async (req, res) => {
        const order = await OrderService.approveInstallment(req.body.orderId, req.body.installmentNumber, req.body.status);
        sendResponse(res, { statusCode: 200, success: true, message: 'Installment approved', data: order });
    })
};

const router = express.Router();
router.post('/', authMiddleware, validateRequest(createOrderValidation), OrderController.createOrder);
router.get('/my', authMiddleware, OrderController.getMyOrders);
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), OrderController.getAllOrders);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), OrderController.updateOrderStatus);
router.delete('/admin/:id', authMiddleware, authorizeRoles('admin'), OrderController.deleteOrder);
router.post('/pay-installment', authMiddleware, OrderController.payInstallment);
router.post('/admin/approve-installment', authMiddleware, authorizeRoles('admin'), OrderController.approveInstallment);

export const OrderRoutes = router;
export default OrderService;
