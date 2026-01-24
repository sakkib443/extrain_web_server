// ===================================================================
// ExtraWeb Backend - bKash Payment Module
// বিকাশ পেমেন্ট ইন্টিগ্রেশন (Demo/Sandbox API)
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { Request, Response } from 'express';
import crypto from 'crypto';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import express from 'express';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import config from '../../config';

// ==================== INTERFACE ====================
export interface IBkashPayment {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    order: Types.ObjectId;

    // bKash specific fields
    paymentID?: string;          // bKash Payment ID
    trxID?: string;              // bKash Transaction ID

    // Payment details
    amount: number;
    currency: string;
    intent: 'sale' | 'authorization';

    // Customer info
    payerReference?: string;     // Customer phone number
    merchantInvoiceNumber: string;

    // Status
    status: 'pending' | 'initiated' | 'completed' | 'failed' | 'refunded';
    statusMessage?: string;

    // Timestamps
    paymentExecuteTime?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== MODEL ====================
const bkashPaymentSchema = new Schema<IBkashPayment>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        paymentID: { type: String },
        trxID: { type: String, unique: true, sparse: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'BDT' },
        intent: { type: String, enum: ['sale', 'authorization'], default: 'sale' },
        payerReference: { type: String },
        merchantInvoiceNumber: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ['pending', 'initiated', 'completed', 'failed', 'refunded'],
            default: 'pending',
        },
        statusMessage: { type: String },
        paymentExecuteTime: { type: Date },
    },
    { timestamps: true }
);

bkashPaymentSchema.index({ user: 1 });
bkashPaymentSchema.index({ order: 1 });
bkashPaymentSchema.index({ trxID: 1 });
bkashPaymentSchema.index({ status: 1 });

export const BkashPayment = model<IBkashPayment>('BkashPayment', bkashPaymentSchema);

// ==================== VALIDATION ====================
export const createPaymentValidation = z.object({
    body: z.object({
        orderId: z.string({ required_error: 'Order ID is required' }),
        amount: z.number({ required_error: 'Amount is required' }).min(1),
        payerReference: z.string().optional(), // Customer phone
    }),
});

export const executePaymentValidation = z.object({
    body: z.object({
        paymentID: z.string({ required_error: 'Payment ID is required' }),
    }),
});

// ==================== bKash API HELPER (DEMO/SANDBOX) ====================
/**
 * bKash Demo API Configuration
 * Production এ bKash Merchant Portal থেকে credentials নিতে হবে
 * 
 * Demo Sandbox URLs:
 * - Sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta
 * - Production: https://tokenized.pay.bka.sh/v1.2.0-beta
 */
const BKASH_CONFIG = {
    // Demo/Sandbox credentials
    app_key: process.env.BKASH_APP_KEY || 'demo_app_key',
    app_secret: process.env.BKASH_APP_SECRET || 'demo_app_secret',
    username: process.env.BKASH_USERNAME || 'demo_username',
    password: process.env.BKASH_PASSWORD || 'demo_password',

    // URLs
    base_url: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',

    // Callback URLs
    callback_url: `${config.frontend_url}/payment/bkash/callback`,
};

/**
 * Generate Demo Payment ID
 * Production এ bKash API থেকে আসবে
 */
const generateDemoPaymentId = (): string => {
    return 'TR' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Generate Demo Transaction ID
 */
const generateDemoTrxId = (): string => {
    return 'TRX' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Generate Merchant Invoice Number
 */
const generateInvoiceNumber = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `INV-${timestamp}-${random}`;
};

// ==================== SERVICE ====================
const BkashService = {
    /**
     * Create Payment - পেমেন্ট initiate করা
     * Step 1: Create payment request
     */
    async createPayment(
        userId: string,
        orderId: string,
        amount: number,
        payerReference?: string
    ): Promise<{ paymentID: string; bkashURL: string; invoiceNumber: string }> {
        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber();

        // In production, this would call bKash API:
        // POST /tokenized/checkout/create
        // But for demo, we simulate the response

        const paymentID = generateDemoPaymentId();

        // Create payment record
        await BkashPayment.create({
            user: userId,
            order: orderId,
            paymentID,
            amount,
            currency: 'BDT',
            intent: 'sale',
            payerReference,
            merchantInvoiceNumber: invoiceNumber,
            status: 'initiated',
        });

        // Demo bKash URL (in production, this comes from bKash API response)
        const bkashURL = `${BKASH_CONFIG.callback_url}?paymentID=${paymentID}`;

        return {
            paymentID,
            bkashURL,
            invoiceNumber,
        };
    },

    /**
     * Execute Payment - পেমেন্ট confirm করা
     * Step 2: After user completes payment on bKash app
     */
    async executePayment(
        paymentID: string,
        userId: string
    ): Promise<IBkashPayment> {
        // Find payment
        const payment = await BkashPayment.findOne({ paymentID, user: userId });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        if (payment.status === 'completed') {
            throw new AppError(400, 'Payment already completed');
        }

        // In production, this would call bKash API:
        // POST /tokenized/checkout/execute
        // But for demo, we simulate success

        const trxID = generateDemoTrxId();

        // Update payment status
        payment.status = 'completed';
        payment.trxID = trxID;
        payment.paymentExecuteTime = new Date();
        payment.statusMessage = 'Payment successful';
        await payment.save();

        // TODO: Update Order status to 'completed'
        // TODO: Create Download records for purchased products

        return payment;
    },

    /**
     * Query Payment - পেমেন্ট status check করা
     */
    async queryPayment(paymentID: string): Promise<IBkashPayment | null> {
        return await BkashPayment.findOne({ paymentID })
            .populate('user', 'firstName lastName email')
            .populate('order');
    },

    /**
     * Get User Payments - ইউজারের সব পেমেন্ট
     */
    async getUserPayments(userId: string): Promise<IBkashPayment[]> {
        return await BkashPayment.find({ user: userId })
            .populate('order')
            .sort({ createdAt: -1 });
    },

    /**
     * Refund Payment - টাকা ফেরত দেওয়া
     * Only admin can refund
     */
    async refundPayment(paymentID: string, reason: string): Promise<IBkashPayment> {
        const payment = await BkashPayment.findOne({ paymentID });

        if (!payment) {
            throw new AppError(404, 'Payment not found');
        }

        if (payment.status !== 'completed') {
            throw new AppError(400, 'Only completed payments can be refunded');
        }

        // In production, this would call bKash Refund API
        // For demo, we just update status

        payment.status = 'refunded';
        payment.statusMessage = `Refunded: ${reason}`;
        await payment.save();

        return payment;
    },

    /**
     * Get All Payments - Admin সব পেমেন্ট দেখা
     */
    async getAllPayments(
        page = 1,
        limit = 10,
        status?: string
    ): Promise<{ data: IBkashPayment[]; total: number }> {
        const query: any = {};
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            BkashPayment.find(query)
                .populate('user', 'firstName lastName email')
                .populate('order')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BkashPayment.countDocuments(query),
        ]);

        return { data: payments, total };
    },

    /**
     * Get Payment Stats - পেমেন্ট statistics
     */
    async getPaymentStats(): Promise<{
        totalPayments: number;
        completedPayments: number;
        totalAmount: number;
        todayAmount: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalPayments, completedPayments, totalAmountResult, todayAmountResult] = await Promise.all([
            BkashPayment.countDocuments(),
            BkashPayment.countDocuments({ status: 'completed' }),
            BkashPayment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            BkashPayment.aggregate([
                { $match: { status: 'completed', paymentExecuteTime: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        return {
            totalPayments,
            completedPayments,
            totalAmount: totalAmountResult[0]?.total || 0,
            todayAmount: todayAmountResult[0]?.total || 0,
        };
    },
};

// ==================== CONTROLLER ====================
const BkashController = {
    // Create Payment - পেমেন্ট শুরু করা
    createPayment: catchAsync(async (req: Request, res: Response) => {
        const { orderId, amount, payerReference } = req.body;
        const result = await BkashService.createPayment(
            req.user!.userId,
            orderId,
            amount,
            payerReference
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Payment initiated. Redirect to bKash.',
            data: result,
        });
    }),

    // Execute Payment - পেমেন্ট confirm করা
    executePayment: catchAsync(async (req: Request, res: Response) => {
        const { paymentID } = req.body;
        const payment = await BkashService.executePayment(paymentID, req.user!.userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Payment completed successfully!',
            data: payment,
        });
    }),

    // Query Payment Status
    queryPayment: catchAsync(async (req: Request, res: Response) => {
        const payment = await BkashService.queryPayment(req.params.paymentID);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Payment status fetched',
            data: payment,
        });
    }),

    // Get My Payments
    getMyPayments: catchAsync(async (req: Request, res: Response) => {
        const payments = await BkashService.getUserPayments(req.user!.userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Your payments fetched',
            data: payments,
        });
    }),

    // Admin: Get All Payments
    getAllPayments: catchAsync(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status as string | undefined;

        const result = await BkashService.getAllPayments(page, limit, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'All payments fetched',
            meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
            data: result.data,
        });
    }),

    // Admin: Refund Payment
    refundPayment: catchAsync(async (req: Request, res: Response) => {
        const { reason } = req.body;
        const payment = await BkashService.refundPayment(req.params.paymentID, reason || 'Admin refund');

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Payment refunded successfully',
            data: payment,
        });
    }),

    // Admin: Payment Stats
    getPaymentStats: catchAsync(async (req: Request, res: Response) => {
        const stats = await BkashService.getPaymentStats();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Payment stats fetched',
            data: stats,
        });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

// User routes (authenticated)
router.post(
    '/create',
    authMiddleware,
    validateRequest(createPaymentValidation),
    BkashController.createPayment
);

router.post(
    '/execute',
    authMiddleware,
    validateRequest(executePaymentValidation),
    BkashController.executePayment
);

router.get('/my', authMiddleware, BkashController.getMyPayments);
router.get('/query/:paymentID', authMiddleware, BkashController.queryPayment);

// Admin routes
router.get(
    '/admin/all',
    authMiddleware,
    authorizeRoles('admin'),
    BkashController.getAllPayments
);

router.get(
    '/admin/stats',
    authMiddleware,
    authorizeRoles('admin'),
    BkashController.getPaymentStats
);

router.post(
    '/admin/refund/:paymentID',
    authMiddleware,
    authorizeRoles('admin'),
    BkashController.refundPayment
);

export const BkashRoutes = router;
export default BkashService;
