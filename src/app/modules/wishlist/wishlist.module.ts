// ===================================================================
// ExtraWeb Backend - Wishlist Module
// Save favorite products for later
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import express from 'express';
import { authMiddleware } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

// ==================== INTERFACE ====================
export interface IWishlistItem {
    product: Types.ObjectId;
    productType: 'website' | 'software' | 'course';
    productModel: 'Website' | 'Software' | 'Course';
    addedAt: Date;
}

export interface IWishlist {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    items: IWishlistItem[];
}

// ==================== MODEL ====================
const wishlistSchema = new Schema<IWishlist>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [
            {
                product: { type: Schema.Types.ObjectId, required: true, refPath: 'items.productModel' },
                productType: { type: String, enum: ['website', 'software', 'course'], required: true },
                productModel: { type: String, enum: ['Website', 'Software', 'Course'], required: true },
                addedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);

// ==================== VALIDATION ====================
export const addToWishlistValidation = z.object({
    body: z.object({
        productId: z.string({ required_error: 'Product ID is required' }),
        productType: z.enum(['website', 'software', 'course']),
    }),
});

// ==================== SERVICE ====================
const WishlistService = {
    async getWishlist(userId: string): Promise<IWishlist | null> {
        return await Wishlist.findOne({ user: userId }).populate('items.product', 'title slug images thumbnail price offerPrice discountPrice');
    },

    async getAllWishlists(): Promise<any[]> {
        // Get all wishlists with user and product details
        const wishlists = await Wishlist.find({})
            .populate('user', 'firstName lastName email avatar')
            .populate('items.product', 'title slug images thumbnail price offerPrice discountPrice likeCount likedBy');

        // Flatten the data for admin view - each item becomes a row
        const allFavorites: any[] = [];
        wishlists.forEach((wishlist: any) => {
            wishlist.items.forEach((item: any) => {
                const product = item.product ? item.product.toObject?.() || item.product : null;

                // If likeCount is missing or 0 but we have likedBy, use likedBy length
                // This handles data sync issues
                let totalLikes = product?.likeCount || 0;
                if (totalLikes === 0 && product?.likedBy?.length > 0) {
                    totalLikes = product.likedBy.length;
                }

                allFavorites.push({
                    _id: `${wishlist._id}-${item.product?._id}`,
                    user: wishlist.user,
                    product: {
                        ...product,
                        likeCount: totalLikes
                    },
                    productType: item.productType,
                    createdAt: item.addedAt
                });
            });
        });

        // Sort by most recent
        allFavorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return allFavorites;
    },

    async addToWishlist(userId: string, productId: string, productType: 'website' | 'software' | 'course'): Promise<IWishlist> {
        let wishlist = await Wishlist.findOne({ user: userId });

        const productModel = productType === 'website' ? 'Website' : productType === 'software' ? 'Software' : 'Course';

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                items: [{ product: new Types.ObjectId(productId), productType, productModel, addedAt: new Date() }],
            });
        } else {
            const exists = wishlist.items.find((i) => i.product.toString() === productId);
            if (exists) {
                throw new AppError(400, 'Already in wishlist');
            }
            wishlist.items.push({ product: new Types.ObjectId(productId), productType, productModel, addedAt: new Date() });
            await wishlist.save();
        }

        return wishlist;
    },

    async removeFromWishlist(userId: string, productId: string): Promise<IWishlist | null> {
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) return null;

        wishlist.items = wishlist.items.filter((i) => i.product.toString() !== productId);
        await wishlist.save();

        return wishlist;
    },

    async isInWishlist(userId: string, productId: string): Promise<boolean> {
        const wishlist = await Wishlist.findOne({ user: userId, 'items.product': productId });
        return !!wishlist;
    },
};

// ==================== CONTROLLER ====================
const WishlistController = {
    getWishlist: catchAsync(async (req: Request, res: Response) => {
        const wishlist = await WishlistService.getWishlist(req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Wishlist fetched', data: wishlist });
    }),

    getAllWishlists: catchAsync(async (req: Request, res: Response) => {
        const favorites = await WishlistService.getAllWishlists();
        sendResponse(res, { statusCode: 200, success: true, message: 'All favorites fetched', data: favorites });
    }),

    addToWishlist: catchAsync(async (req: Request, res: Response) => {
        const { productId, productType } = req.body;
        const wishlist = await WishlistService.addToWishlist(req.user!.userId, productId, productType);
        sendResponse(res, { statusCode: 200, success: true, message: 'Added to wishlist', data: wishlist });
    }),

    removeFromWishlist: catchAsync(async (req: Request, res: Response) => {
        const wishlist = await WishlistService.removeFromWishlist(req.user!.userId, req.params.productId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Removed from wishlist', data: wishlist });
    }),

    checkWishlist: catchAsync(async (req: Request, res: Response) => {
        const isInWishlist = await WishlistService.isInWishlist(req.user!.userId, req.params.productId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Checked', data: { isInWishlist } });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

router.get('/', authMiddleware, WishlistController.getWishlist);
router.get('/all', authMiddleware, WishlistController.getAllWishlists); // Admin route to get all favorites
router.post('/', authMiddleware, validateRequest(addToWishlistValidation), WishlistController.addToWishlist);
router.delete('/:productId', authMiddleware, WishlistController.removeFromWishlist);
router.get('/check/:productId', authMiddleware, WishlistController.checkWishlist);

export const WishlistRoutes = router;
export default WishlistService;
