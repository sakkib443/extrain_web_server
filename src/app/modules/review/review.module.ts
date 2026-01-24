// ===================================================================
// ExtraWeb Backend - Review Module
// Product reviews and ratings
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import express from 'express';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

// ==================== INTERFACE ====================
export interface IReview {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    product: Types.ObjectId;
    productType: 'website' | 'software' | 'course';
    rating: number;
    title?: string;
    comment: string;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== MODEL ====================
const reviewSchema = new Schema<IReview>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, required: true },
        productType: { type: String, enum: ['website', 'software', 'course'], required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, maxlength: 100 },
        comment: { type: String, required: true, maxlength: 1000 },
        isVerifiedPurchase: { type: Boolean, default: false },
        helpfulCount: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    },
    { timestamps: true }
);

reviewSchema.index({ product: 1, productType: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);

// ==================== VALIDATION ====================
export const ReviewValidationSchema = z.object({
    body: z.object({
        productId: z.string({ required_error: 'Product ID is required' }),
        productType: z.enum(['website', 'software', 'course'], {
            errorMap: (issue, ctx) => ({ message: "Product type must be either website, software, or course" })
        }),
        rating: z.number().min(1).max(5),
        title: z.string().max(100).optional(),
        comment: z.string({ required_error: 'Comment is required' }).max(1000),
    }),
});

// ==================== SERVICE ====================
const ReviewService = {
    async createReview(userId: string, data: Partial<IReview>): Promise<IReview> {
        // Check for existing review
        const existing = await Review.findOne({ user: userId, product: data.product });
        if (existing) {
            throw new AppError(400, 'You have already reviewed this product');
        }

        let isVerifiedPurchase = false;

        // Check if user has purchased the product
        if (data.productType === 'course') {
            const { Enrollment } = await import('../enrollment/enrollment.model');
            const enrollment = await Enrollment.findOne({ student: userId, course: data.product });
            if (enrollment) isVerifiedPurchase = true;
        } else {
            const { Order } = await import('../order/order.module');
            const order = await Order.findOne({
                user: userId,
                paymentStatus: 'completed',
                'items.product': data.product
            });
            if (order) isVerifiedPurchase = true;
        }

        const review = await Review.create({
            ...data,
            user: userId,
            isVerifiedPurchase,
            status: 'approved',
        });

        // Sync stats immediately since it is auto-approved
        await this.syncProductStats(data.product!.toString(), data.productType!);

        return review;
    },

    async getProductReviews(productId: string, page = 1, limit = 10): Promise<{ reviews: IReview[]; total: number; avgRating: number }> {
        const skip = (page - 1) * limit;
        const [reviews, total, avgResult] = await Promise.all([
            Review.find({ product: productId, status: 'approved' })
                .populate('user', 'firstName lastName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments({ product: productId, status: 'approved' }),
            Review.aggregate([
                { $match: { product: new Types.ObjectId(productId), status: 'approved' } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } },
            ]),
        ]);

        const avgRating = avgResult[0]?.avgRating || 0;

        return { reviews, total, avgRating: Math.round(avgRating * 10) / 10 };
    },

    async getUserReviews(userId: string): Promise<any[]> {
        const reviews = await Review.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        const enrichedReviews = await Promise.all(reviews.map(async (review: any) => {
            let productDetails: any = null;
            try {
                if (review.productType === 'website') {
                    const { Website } = await import('../website/website.model');
                    productDetails = await Website.findById(review.product).select('title slug thumbnail images');
                } else if (review.productType === 'software') {
                    const { Software } = await import('../software/software.model');
                    productDetails = await Software.findById(review.product).select('title slug thumbnail images');
                } else if (review.productType === 'course') {
                    const { Course } = await import('../course/course.model');
                    productDetails = await Course.findById(review.product).select('title slug thumbnail image');
                }
            } catch (err) {
                console.error(`Failed to fetch product for review ${review._id}`, err);
            }
            return { ...review, productDetails };
        }));

        return enrichedReviews;
    },

    async getAllReviews(page = 1, limit = 10, status?: string): Promise<{ data: any[]; total: number }> {
        const skip = (page - 1) * limit;
        const filter: any = {};
        if (status) filter.status = status;

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate('user', 'firstName lastName email avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(filter),
        ]);

        const enrichedReviews = await Promise.all(reviews.map(async (review: any) => {
            let productDetails = null;
            try {
                if (review.productType === 'website') {
                    const { Website } = await import('../website/website.model');
                    productDetails = await Website.findById(review.product).select('title slug');
                } else if (review.productType === 'software') {
                    const { Software } = await import('../software/software.model');
                    productDetails = await Software.findById(review.product).select('title slug');
                } else if (review.productType === 'course') {
                    const { Course } = await import('../course/course.model');
                    productDetails = await Course.findById(review.product).select('title slug');
                }
            } catch (err) {
                console.error(`Failed to fetch product for review ${review._id}`, err);
            }
            return { ...review, productDetails };
        }));

        return { data: enrichedReviews, total };
    },

    async updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): Promise<IReview> {
        const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
        if (!review) throw new AppError(404, 'Review not found');

        if (status === 'approved') {
            // Update product's rating and review count
            await this.syncProductStats(review.product.toString(), review.productType);
        }

        return review;
    },

    async syncProductStats(productId: string, productType: string): Promise<void> {
        const stats = await Review.aggregate([
            { $match: { product: new Types.ObjectId(productId), status: 'approved' } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const avgRating = stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0;
        const count = stats[0]?.count || 0;

        if (productType === 'course') {
            const { Course } = await import('../course/course.model');
            await Course.findByIdAndUpdate(productId, { averageRating: avgRating, totalReviews: count });
        } else if (productType === 'website') {
            const { Website } = await import('../website/website.model');
            await Website.findByIdAndUpdate(productId, { rating: avgRating, reviewCount: count });
        } else if (productType === 'software') {
            const { Software } = await import('../software/software.model');
            await Software.findByIdAndUpdate(productId, { rating: avgRating, reviewCount: count });
        }
    },

    async deleteReview(reviewId: string, userId: string, isAdmin: boolean): Promise<void> {
        const review = await Review.findById(reviewId);
        if (!review) throw new AppError(404, 'Review not found');
        if (!isAdmin && review.user.toString() !== userId) {
            throw new AppError(403, 'You can only delete your own reviews');
        }
        await Review.findByIdAndDelete(reviewId);

        // Update stats if deleted review was approved
        if (review.status === 'approved') {
            await this.syncProductStats(review.product.toString(), review.productType);
        }
    },

    async updateReview(reviewId: string, userId: string, data: { title?: string, comment?: string, rating?: number }): Promise<IReview> {
        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) throw new AppError(404, 'Review not found or you are not authorized');

        const oldRating = review.rating;
        const oldStatus = review.status;

        // Update fields
        if (data.title !== undefined) review.title = data.title;
        if (data.comment !== undefined) review.comment = data.comment;
        if (data.rating !== undefined) review.rating = data.rating;

        await review.save();

        // If rating changed and review was approved, sync stats
        if (oldStatus === 'approved' && data.rating !== undefined && data.rating !== oldRating) {
            await this.syncProductStats(review.product.toString(), review.productType);
        }

        return review;
    },

    async markHelpful(reviewId: string): Promise<IReview> {
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );
        if (!review) throw new AppError(404, 'Review not found');
        return review;
    },
};

// ==================== CONTROLLER ====================
const ReviewController = {
    createReview: catchAsync(async (req: Request, res: Response) => {
        const { productId, productType, rating, title, comment } = req.body;
        const review = await ReviewService.createReview(req.user!.userId, {
            product: new Types.ObjectId(productId),
            productType,
            rating,
            title,
            comment,
        });
        sendResponse(res, { statusCode: 201, success: true, message: 'Review published successfully', data: review });
    }),

    getProductReviews: catchAsync(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await ReviewService.getProductReviews(req.params.productId, page, limit);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Reviews fetched',
            meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
            data: { reviews: result.reviews, avgRating: result.avgRating },
        });
    }),

    getMyReviews: catchAsync(async (req: Request, res: Response) => {
        const reviews = await ReviewService.getUserReviews(req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Your reviews', data: reviews });
    }),

    deleteReview: catchAsync(async (req: Request, res: Response) => {
        await ReviewService.deleteReview(req.params.id, req.user!.userId, req.user!.role === 'admin');
        sendResponse(res, { statusCode: 200, success: true, message: 'Review deleted' });
    }),

    updateReview: catchAsync(async (req: Request, res: Response) => {
        const review = await ReviewService.updateReview(req.params.id, req.user!.userId, req.body);
        sendResponse(res, { statusCode: 200, success: true, message: 'Review updated successfully', data: review });
    }),

    markHelpful: catchAsync(async (req: Request, res: Response) => {
        const review = await ReviewService.markHelpful(req.params.id);
        sendResponse(res, { statusCode: 200, success: true, message: 'Marked as helpful', data: review });
    }),

    // Admin
    getAllReviews: catchAsync(async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status as string;
        const result = await ReviewService.getAllReviews(page, limit, status);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'All reviews fetched',
            meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
            data: result.data,
        });
    }),

    updateStatus: catchAsync(async (req: Request, res: Response) => {
        const review = await ReviewService.updateReviewStatus(req.params.id, req.body.status);
        sendResponse(res, { statusCode: 200, success: true, message: 'Status updated', data: review });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

// Public
router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/:id/helpful', ReviewController.markHelpful);

// Authenticated
router.post('/', authMiddleware, validateRequest(ReviewValidationSchema), ReviewController.createReview);
router.get('/my', authMiddleware, ReviewController.getMyReviews);
router.patch('/:id', authMiddleware, ReviewController.updateReview);
router.delete('/:id', authMiddleware, ReviewController.deleteReview);

// Admin
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), ReviewController.getAllReviews);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), ReviewController.updateStatus);

export const ReviewRoutes = router;
export default ReviewService;
