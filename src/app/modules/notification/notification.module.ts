import express, { Request, Response, Router } from 'express';
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

// ============ INTERFACE ============
export interface INotification extends Document {
    type: 'order' | 'enrollment' | 'review' | 'user' | 'course' | 'system' | 'like' | 'blog';
    title: string;
    message: string;
    data?: {
        orderId?: Types.ObjectId;
        userId?: Types.ObjectId;
        courseId?: Types.ObjectId;
        enrollmentId?: Types.ObjectId;
        reviewId?: Types.ObjectId;
        blogId?: Types.ObjectId;
        amount?: number;
        link?: string;
    };
    isRead: boolean;
    forAdmin: boolean;
    forUser?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ============ SCHEMA ============
const NotificationSchema = new Schema<INotification>(
    {
        type: {
            type: String,
            enum: ['order', 'enrollment', 'review', 'user', 'course', 'system', 'like', 'blog'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        data: {
            orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
            enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment' },
            reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
            amount: Number,
            link: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        forAdmin: {
            type: Boolean,
            default: true,
        },
        forUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
NotificationSchema.index({ forAdmin: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ forUser: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

// ============ SERVICE ============
export const NotificationService = {
    // Create notification (called internally when events happen)
    async createNotification(data: Partial<INotification>): Promise<INotification> {
        const notification = await Notification.create(data);
        return notification;
    },

    // Create order notification
    async createOrderNotification(orderData: {
        orderId: Types.ObjectId;
        userId: Types.ObjectId;
        userName: string;
        amount: number;
        productName: string;
    }): Promise<INotification> {
        return this.createNotification({
            type: 'order',
            title: 'New Order Received! 🛒',
            message: `${orderData.userName} placed an order for "${orderData.productName}" worth ৳${orderData.amount}`,
            data: {
                orderId: orderData.orderId,
                userId: orderData.userId,
                amount: orderData.amount,
                link: `/dashboard/admin/orders`,
            },
            forAdmin: true,
        });
    },

    // Create enrollment notification
    async createEnrollmentNotification(enrollData: {
        enrollmentId: Types.ObjectId;
        userId: Types.ObjectId;
        userName: string;
        courseId: Types.ObjectId;
        courseName: string;
    }): Promise<INotification> {
        return this.createNotification({
            type: 'enrollment',
            title: 'New Course Enrollment! 🎓',
            message: `${enrollData.userName} enrolled in "${enrollData.courseName}"`,
            data: {
                enrollmentId: enrollData.enrollmentId,
                userId: enrollData.userId,
                courseId: enrollData.courseId,
                link: `/dashboard/admin/enrollment`,
            },
            forAdmin: true,
        });
    },

    // Create user registration notification
    async createUserNotification(userData: {
        userId: Types.ObjectId;
        userName: string;
        email: string;
    }): Promise<INotification> {
        return this.createNotification({
            type: 'user',
            title: 'New User Registered! 👤',
            message: `${userData.userName} (${userData.email}) just joined the platform`,
            data: {
                userId: userData.userId,
                link: `/dashboard/admin/user`,
            },
            forAdmin: true,
        });
    },

    // Create review notification
    async createReviewNotification(reviewData: {
        reviewId: Types.ObjectId;
        userId: Types.ObjectId;
        userName: string;
        productName: string;
        rating: number;
    }): Promise<INotification> {
        return this.createNotification({
            type: 'review',
            title: `New ${reviewData.rating}⭐ Review!`,
            message: `${reviewData.userName} left a review on "${reviewData.productName}"`,
            data: {
                reviewId: reviewData.reviewId,
                userId: reviewData.userId,
                link: `/dashboard/admin/reviews`,
            },
            forAdmin: true,
        });
    },

    // Create like notification
    async createLikeNotification(likeData: {
        userId: Types.ObjectId;
        userName: string;
        productId: Types.ObjectId;
        productName: string;
        productType: 'website' | 'software' | 'course';
    }): Promise<INotification> {
        return this.createNotification({
            type: 'like',
            title: `New Like! ❤️`,
            message: `${likeData.userName} liked "${likeData.productName}"`,
            data: {
                userId: likeData.userId,
                link: `/dashboard/admin/favorites-ratings`,
            },
            forAdmin: true,
        });
    },

    // Get admin notifications
    async getAdminNotifications(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ forAdmin: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ forAdmin: true }),
            Notification.countDocuments({ forAdmin: true, isRead: false }),
        ]);

        return {
            notifications,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                unreadCount,
            },
        };
    },

    // Mark notification as read
    async markAsRead(notificationId: string): Promise<INotification | null> {
        return Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
    },

    // Mark all as read
    async markAllAsRead(): Promise<void> {
        await Notification.updateMany({ forAdmin: true, isRead: false }, { isRead: true });
    },

    // Delete notification
    async deleteNotification(notificationId: string): Promise<void> {
        await Notification.findByIdAndDelete(notificationId);
    },

    // Get unread count
    async getUnreadCount(): Promise<number> {
        return Notification.countDocuments({ forAdmin: true, isRead: false });
    },
};

// ============ CONTROLLER ============
const getNotifications = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await NotificationService.getAdminNotifications(page, limit);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Notifications retrieved successfully',
        meta: result.meta,
        data: result.notifications,
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Notification marked as read',
        data: notification,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    await NotificationService.markAllAsRead();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'All notifications marked as read',
        data: null,
    });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await NotificationService.deleteNotification(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Notification deleted',
        data: null,
    });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const count = await NotificationService.getUnreadCount();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Unread count retrieved',
        data: { count },
    });
});

// ============ ROUTES ============
const router: Router = express.Router();

router.get(
    '/',
    authMiddleware,
    authorizeRoles('admin'),
    getNotifications
);

router.get(
    '/unread-count',
    authMiddleware,
    authorizeRoles('admin'),
    getUnreadCount
);

router.patch(
    '/mark-all-read',
    authMiddleware,
    authorizeRoles('admin'),
    markAllAsRead
);

router.patch(
    '/:id/read',
    authMiddleware,
    authorizeRoles('admin'),
    markAsRead
);

router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    deleteNotification
);

export const NotificationRoutes = router;
