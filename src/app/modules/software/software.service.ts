// ===================================================================
// ExtraWeb Backend - Software Service
// Software Product CRUD and business logic
// Service for software/script marketplace products
// ===================================================================

import { FilterQuery, SortOrder, Types } from 'mongoose';
import config from '../../config';
import AppError from '../../utils/AppError';
import { ISoftware, ISoftwareFilters, ISoftwareQuery } from './software.interface';
import { Software } from './software.model';
import CategoryService from '../category/category.service';
import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.module';

interface IPaginatedResult<T> {
    data: T[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

const SoftwareService = {
    // ==================== CREATE SOFTWARE ====================
    async createSoftware(payload: Partial<ISoftware>, authorId: string): Promise<ISoftware> {
        // Generate slug if not provided
        if (!payload.slug) {
            payload.slug = payload.title!
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
                + '-' + Date.now();
        }

        // Check slug uniqueness
        const existing = await Software.findOne({ slug: payload.slug });
        if (existing) {
            throw new AppError(400, 'Software with this slug already exists');
        }

        // Create software
        const software = await Software.create({
            ...payload,
            author: authorId,
            publishDate: new Date(),
        });

        // Increment category product count (platform is now a string enum, not ObjectId)
        if (payload.category) {
            await CategoryService.incrementProductCount(payload.category.toString());
        }

        return software;
    },

    // ==================== GET ALL SOFTWARE (Public with filters) ====================
    async getAllSoftware(
        filters: ISoftwareFilters,
        query: ISoftwareQuery
    ): Promise<IPaginatedResult<ISoftware>> {
        const { searchTerm, category, platform, accessType, softwareType, minPrice, maxPrice, minRating } = filters;
        const {
            page = config.pagination.default_page,
            limit = config.pagination.default_limit,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        // Build query conditions
        const conditions: FilterQuery<ISoftware>[] = [
            { status: 'approved' },
            { isDeleted: false },
        ];

        // Text search
        if (searchTerm) {
            conditions.push({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { technologies: { $regex: searchTerm, $options: 'i' } },
                ],
            });
        }

        // Category filter (still ObjectId)
        if (category) {
            conditions.push({ category: new Types.ObjectId(category) });
        }

        // Platform filter (now string enum)
        if (platform) {
            conditions.push({ platform: platform });
        }

        // Software type filter (now string enum)
        if (softwareType) {
            conditions.push({ softwareType: softwareType });
        }

        // Access type filter
        if (accessType) {
            conditions.push({ accessType });
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceCondition: any = {};
            if (minPrice !== undefined) priceCondition.$gte = minPrice;
            if (maxPrice !== undefined) priceCondition.$lte = maxPrice;
            conditions.push({
                $or: [{ offerPrice: priceCondition }, { price: priceCondition }],
            });
        }

        // Rating filter
        if (minRating !== undefined) {
            conditions.push({ rating: { $gte: minRating } });
        }

        const whereConditions = { $and: conditions };

        // Sort
        const sortConditions: { [key: string]: SortOrder } = {};
        sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Pagination
        const skip = (page - 1) * limit;

        // Execute with optimization (removed platform populate since it's now a string)
        const [software, total] = await Promise.all([
            Software.find(whereConditions)
                .select('-likedBy -longDescription') // Exclude heavy fields
                .populate('author', 'firstName lastName avatar')
                .populate('category', 'name slug')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit)
                .lean(), // Return plain objects for faster performance
            Software.countDocuments(whereConditions),
        ]);

        return {
            data: software,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    // ==================== GET FEATURED SOFTWARE ====================
    async getFeaturedSoftware(limit = 8): Promise<ISoftware[]> {
        return await Software.find({
            status: 'approved',
            isDeleted: false,
            isFeatured: true,
        })
            .populate('author', 'firstName lastName')
            .populate('category', 'name slug')
            .sort({ salesCount: -1 })
            .limit(limit);
    },

    // ==================== GET SINGLE SOFTWARE ====================
    async getSoftwareById(id: string): Promise<ISoftware> {
        const software = await Software.findById(id)
            .populate('author', 'firstName lastName avatar')
            .populate('category', 'name slug');

        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        return software;
    },

    // ==================== GET BY SLUG (Public) ====================
    async getSoftwareBySlug(slug: string): Promise<ISoftware> {
        const software = await Software.findOne({ slug, status: 'approved', isDeleted: false })
            .populate('author', 'firstName lastName avatar')
            .populate('category', 'name slug');

        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        return software;
    },

    // ==================== GET USER'S SOFTWARE (Seller) ====================
    async getUserSoftware(userId: string, query: ISoftwareQuery): Promise<IPaginatedResult<ISoftware>> {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

        const skip = (page - 1) * limit;
        const sortConditions: { [key: string]: SortOrder } = {};
        sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [software, total] = await Promise.all([
            Software.find({ author: userId, isDeleted: false })
                .populate('category', 'name')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit),
            Software.countDocuments({ author: userId, isDeleted: false }),
        ]);

        return {
            data: software,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    // ==================== UPDATE SOFTWARE ====================
    async updateSoftware(id: string, payload: Partial<ISoftware>, userId: string, isAdmin: boolean): Promise<ISoftware> {
        const software = await Software.findById(id);
        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        // Check ownership (unless admin)
        if (!isAdmin && software.author.toString() !== userId) {
            throw new AppError(403, 'You can only update your own software');
        }

        // Update lastUpdate
        payload.lastUpdate = new Date();

        const updated = await Software.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
            .populate('author', 'firstName lastName')
            .populate('category', 'name');

        return updated!;
    },

    // ==================== DELETE SOFTWARE (Soft Delete) ====================
    async deleteSoftware(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const software = await Software.findById(id);
        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        if (!isAdmin && software.author.toString() !== userId) {
            throw new AppError(403, 'You can only delete your own software');
        }

        await Software.findByIdAndUpdate(id, { isDeleted: true });

        // Decrement category count (platform is now a string, no count needed)
        await CategoryService.decrementProductCount(software.category.toString());
    },

    // ==================== APPROVE/REJECT SOFTWARE (Admin) ====================
    async updateSoftwareStatus(id: string, status: 'approved' | 'rejected'): Promise<ISoftware> {
        const software = await Software.findByIdAndUpdate(
            id,
            { status, publishDate: status === 'approved' ? new Date() : undefined },
            { new: true }
        );

        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        return software;
    },

    // ==================== INCREMENT SALES COUNT ====================
    async incrementSalesCount(id: string): Promise<void> {
        await Software.findByIdAndUpdate(id, { $inc: { salesCount: 1 } });
    },

    // ==================== UPDATE RATING ====================
    async updateRating(id: string, newRating: number, reviewCount: number): Promise<void> {
        await Software.findByIdAndUpdate(id, { rating: newRating, reviewCount });
    },

    // ==================== INCREMENT VIEW COUNT ====================
    async incrementViewCount(id: string): Promise<void> {
        await Software.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    },

    // ==================== TOGGLE LIKE ====================
    async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
        const software = await Software.findById(id);
        if (!software) {
            throw new AppError(404, 'Software not found');
        }

        const userObjectId = new Types.ObjectId(userId);
        const isLiked = software.likedBy?.some((likedUserId) => likedUserId.equals(userObjectId));

        if (isLiked) {
            // Unlike
            await Software.findByIdAndUpdate(id, {
                $pull: { likedBy: userObjectId },
                $inc: { likeCount: -1 },
            });

            // Remove from wishlist
            try {
                const WishlistService = (await import('../wishlist/wishlist.module')).default;
                await WishlistService.removeFromWishlist(userId, id);
            } catch (error) {
                console.error('Wishlist sync error (unlike):', error);
            }

            const updated = await Software.findById(id).select('likeCount');
            return { liked: false, likeCount: Math.max(0, updated?.likeCount || 0) };
        } else {
            // Like
            await Software.findByIdAndUpdate(id, {
                $addToSet: { likedBy: userObjectId },
                $inc: { likeCount: 1 },
            });

            // Add to wishlist
            try {
                const WishlistService = (await import('../wishlist/wishlist.module')).default;
                await WishlistService.addToWishlist(userId, id, 'software');

                // Notification
                const user = await User.findById(userId);
                if (user && software) {
                    await NotificationService.createLikeNotification({
                        userId: user._id,
                        userName: `${user.firstName} ${user.lastName}`,
                        productId: software._id,
                        productName: software.title,
                        productType: 'software'
                    });
                }
            } catch (error) {
                console.error('Wishlist/Notification sync error (like):', error);
            }

            const updated = await Software.findById(id).select('likeCount');
            return { liked: true, likeCount: updated?.likeCount || 0 };
        }
    },

    // ==================== GET ADMIN SOFTWARE (All with status filter) ====================
    async getAdminSoftware(filters: ISoftwareFilters, query: ISoftwareQuery): Promise<IPaginatedResult<ISoftware>> {
        const { searchTerm, status, category, platform, softwareType } = filters;
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

        const conditions: FilterQuery<ISoftware>[] = [{ isDeleted: false }];

        if (searchTerm) {
            conditions.push({ title: { $regex: searchTerm, $options: 'i' } });
        }
        if (status) {
            conditions.push({ status });
        }
        if (category) {
            conditions.push({ category: new Types.ObjectId(category) });
        }
        // Platform is now string enum
        if (platform) {
            conditions.push({ platform: platform });
        }
        // Software type is now string enum
        if (softwareType) {
            conditions.push({ softwareType: softwareType });
        }

        const whereConditions = conditions.length > 0 ? { $and: conditions } : {};
        const skip = (page - 1) * limit;
        const sortConditions: { [key: string]: SortOrder } = {};
        sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [software, total] = await Promise.all([
            Software.find(whereConditions)
                .populate('author', 'firstName lastName email')
                .populate('category', 'name')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit),
            Software.countDocuments(whereConditions),
        ]);

        return {
            data: software,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },
};

export default SoftwareService;
