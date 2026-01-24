// ===================================================================
// ExtraWeb Backend - Website Service
// Website Product CRUD and business logic
// Main service for marketplace products
// ===================================================================

import { FilterQuery, SortOrder, Types } from 'mongoose';
import config from '../../config';
import AppError from '../../utils/AppError';
import { IWebsite, IWebsiteFilters, IWebsiteQuery } from './website.interface';
import { Website } from './website.model';
import CategoryService from '../category/category.service';
import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.module';

interface IPaginatedResult<T> {
    data: T[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

const WebsiteService = {
    // ==================== CREATE WEBSITE ====================
    async createWebsite(payload: Partial<IWebsite>): Promise<IWebsite> {
        // Generate slug if not provided
        if (!payload.slug) {
            payload.slug = payload.title!
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
                + '-' + Date.now();
        }

        // Check slug uniqueness
        const existing = await Website.findOne({ slug: payload.slug });
        if (existing) {
            throw new AppError(400, 'Website with this slug already exists');
        }

        // Create website
        const website = await Website.create({
            ...payload,
            publishDate: new Date(),
        });

        // Increment category product count
        await CategoryService.incrementProductCount(payload.category!.toString());

        return website;
    },

    // ==================== GET ALL WEBSITES (Public with filters) ====================
    async getAllWebsites(
        filters: IWebsiteFilters,
        query: IWebsiteQuery
    ): Promise<IPaginatedResult<IWebsite>> {
        const { searchTerm, category, platform, accessType, minPrice, maxPrice, minRating } = filters;
        const {
            page = config.pagination.default_page,
            limit = config.pagination.default_limit,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        // Build query conditions
        const conditions: FilterQuery<IWebsite>[] = [
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

        // Category filter
        if (category) {
            conditions.push({ category: new Types.ObjectId(category) });
        }

        // Platform filter (now string match)
        if (platform) {
            conditions.push({ platform });
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

        // Execute
        const [websites, total] = await Promise.all([
            Website.find(whereConditions)
                .populate('category', 'name slug')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit),
            Website.countDocuments(whereConditions),
        ]);

        return {
            data: websites,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    // ==================== GET FEATURED WEBSITES ====================
    async getFeaturedWebsites(limit = 8): Promise<IWebsite[]> {
        return await Website.find({
            status: 'approved',
            isDeleted: false,
            isFeatured: true,
        })
            .populate('category', 'name slug')
            .sort({ salesCount: -1 })
            .limit(limit);
    },

    // ==================== GET SINGLE WEBSITE ====================
    async getWebsiteById(id: string): Promise<IWebsite> {
        const website = await Website.findById(id)
            .populate('category', 'name slug');

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return website;
    },

    // ==================== GET BY SLUG (Public) ====================
    async getWebsiteBySlug(slug: string): Promise<IWebsite> {
        const website = await Website.findOne({ slug, status: 'approved', isDeleted: false })
            .populate('category', 'name slug');

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return website;
    },

    // ==================== GET ALL WEBSITES FOR ADMIN ====================
    async getAdminAllWebsites(query: IWebsiteQuery): Promise<IPaginatedResult<IWebsite>> {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

        const skip = (page - 1) * limit;
        const sortConditions: { [key: string]: SortOrder } = {};
        sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [websites, total] = await Promise.all([
            Website.find({ isDeleted: false })
                .populate('category', 'name')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit),
            Website.countDocuments({ isDeleted: false }),
        ]);

        return {
            data: websites,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    // ==================== UPDATE WEBSITE ====================
    async updateWebsite(id: string, payload: Partial<IWebsite>, isAdmin: boolean): Promise<IWebsite> {
        const website = await Website.findById(id);
        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        // Update lastUpdate
        payload.lastUpdate = new Date();

        const updated = await Website.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
            .populate('category', 'name');

        return updated!;
    },

    // ==================== DELETE WEBSITE (Soft Delete) ====================
    async deleteWebsite(id: string, isAdmin: boolean): Promise<void> {
        const website = await Website.findById(id);
        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        await Website.findByIdAndUpdate(id, { isDeleted: true });

        // Decrement category count
        await CategoryService.decrementProductCount(website.category.toString());
    },

    // ==================== APPROVE/REJECT WEBSITE (Admin) ====================
    async updateWebsiteStatus(id: string, status: 'approved' | 'rejected'): Promise<IWebsite> {
        const website = await Website.findByIdAndUpdate(
            id,
            { status, publishDate: status === 'approved' ? new Date() : undefined },
            { new: true }
        );

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return website;
    },

    // ==================== INCREMENT SALES COUNT ====================
    async incrementSalesCount(id: string): Promise<void> {
        await Website.findByIdAndUpdate(id, { $inc: { salesCount: 1 } });
    },

    // ==================== UPDATE RATING ====================
    async updateRating(id: string, newRating: number, reviewCount: number): Promise<void> {
        await Website.findByIdAndUpdate(id, { rating: newRating, reviewCount });
    },

    // ==================== GET ADMIN WEBSITES (All with status filter) ====================
    async getAdminWebsites(filters: IWebsiteFilters, query: IWebsiteQuery): Promise<IPaginatedResult<IWebsite>> {
        const { searchTerm, status, category, platform } = filters;
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

        const conditions: FilterQuery<IWebsite>[] = [{ isDeleted: false }];

        if (searchTerm) {
            conditions.push({ title: { $regex: searchTerm, $options: 'i' } });
        }
        if (status) {
            conditions.push({ status });
        }
        if (category) {
            conditions.push({ category: new Types.ObjectId(category) });
        }
        if (platform) {
            conditions.push({ platform });
        }

        const whereConditions = conditions.length > 0 ? { $and: conditions } : {};
        const skip = (page - 1) * limit;
        const sortConditions: { [key: string]: SortOrder } = {};
        sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [websites, total] = await Promise.all([
            Website.find(whereConditions)
                .populate('category', 'name')
                .sort(sortConditions)
                .skip(skip)
                .limit(limit),
            Website.countDocuments(whereConditions),
        ]);

        return {
            data: websites,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    // ==================== INCREMENT VIEW COUNT ====================
    async incrementViewCount(id: string): Promise<{ viewCount: number }> {
        const website = await Website.findByIdAndUpdate(
            id,
            { $inc: { viewCount: 1 } },
            { new: true, select: 'viewCount' }
        );

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return { viewCount: website.viewCount };
    },

    // ==================== INCREMENT LIKE COUNT ====================
    async incrementLikeCount(id: string): Promise<{ likeCount: number }> {
        const website = await Website.findByIdAndUpdate(
            id,
            { $inc: { likeCount: 1 } },
            { new: true, select: 'likeCount' }
        );

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return { likeCount: website.likeCount };
    },

    // ==================== DECREMENT LIKE COUNT ====================
    async decrementLikeCount(id: string): Promise<{ likeCount: number }> {
        const website = await Website.findByIdAndUpdate(
            id,
            { $inc: { likeCount: -1 } },
            { new: true, select: 'likeCount' }
        );

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        // Ensure it doesn't go below 0
        if (website.likeCount < 0) {
            await Website.findByIdAndUpdate(id, { likeCount: 0 });
            return { likeCount: 0 };
        }

        return { likeCount: website.likeCount };
    },

    // ==================== GET STATS ====================
    async getWebsiteStats(id: string): Promise<{ viewCount: number; likeCount: number; salesCount: number }> {
        const website = await Website.findById(id).select('viewCount likeCount salesCount');

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        return {
            viewCount: website.viewCount || 0,
            likeCount: website.likeCount || 0,
            salesCount: website.salesCount || 0,
        };
    },

    // ==================== TOGGLE LIKE ====================
    async toggleLike(id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
        const website = await Website.findById(id);

        if (!website) {
            throw new AppError(404, 'Website not found');
        }

        const userObjectId = new Types.ObjectId(userId);
        const likedBy = website.likedBy || [];
        const isAlreadyLiked = likedBy.some(likedUserId => likedUserId.equals(userObjectId));

        if (isAlreadyLiked) {
            // Unlike
            await Website.findByIdAndUpdate(id, {
                $pull: { likedBy: userObjectId },
                $inc: { likeCount: -1 }
            });

            // Remove from wishlist
            try {
                const WishlistService = (await import('../wishlist/wishlist.module')).default;
                await WishlistService.removeFromWishlist(userId, id);
            } catch (error) {
                console.error('Wishlist sync error (unlike):', error);
            }

            const updated = await Website.findById(id).select('likeCount');
            return { isLiked: false, likeCount: Math.max(0, updated?.likeCount || 0) };
        } else {
            // Like
            await Website.findByIdAndUpdate(id, {
                $addToSet: { likedBy: userObjectId },
                $inc: { likeCount: 1 }
            });

            // Add to wishlist
            try {
                const WishlistService = (await import('../wishlist/wishlist.module')).default;
                await WishlistService.addToWishlist(userId, id, 'website');

                // Notification
                const user = await User.findById(userId);
                if (user && website) {
                    await NotificationService.createLikeNotification({
                        userId: user._id,
                        userName: `${user.firstName} ${user.lastName}`,
                        productId: website._id,
                        productName: website.title,
                        productType: 'website'
                    });
                }
            } catch (error) {
                console.error('Wishlist/Notification sync error (like):', error);
            }

            const updated = await Website.findById(id).select('likeCount');
            return { isLiked: true, likeCount: updated?.likeCount || 0 };
        }
    },
};

export default WebsiteService;
