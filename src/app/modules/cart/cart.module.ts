// ===================================================================
// ExtraWeb Backend - Cart Module (Combined file for brevity)
// Shopping cart functionality
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
export interface ICartItem {
    product: Types.ObjectId;
    productType: 'website' | 'software';
    price: number;
    title: string;
    image?: string;
    addedAt: Date;
}

export interface ICart {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== MODEL ====================
const cartSchema = new Schema<ICart>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [
            {
                product: { type: Schema.Types.ObjectId, required: true, refPath: 'items.productType' },
                productType: { type: String, enum: ['website', 'software'], required: true },
                price: { type: Number, required: true },
                title: { type: String, required: true },
                image: { type: String },
                addedAt: { type: Date, default: Date.now },
            },
        ],
        totalAmount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Cart = model<ICart>('Cart', cartSchema);

// ==================== VALIDATION ====================
export const addToCartValidation = z.object({
    body: z.object({
        productId: z.string({ required_error: 'Product ID is required' }),
        productType: z.enum(['website', 'software']),
        price: z.number({ required_error: 'Price is required' }),
        title: z.string({ required_error: 'Title is required' }),
        image: z.string().optional(),
    }),
});

// ==================== SERVICE ====================
const CartService = {
    async getCart(userId: string): Promise<ICart | null> {
        return await Cart.findOne({ user: userId });
    },

    async addToCart(userId: string, item: Omit<ICartItem, 'addedAt'>): Promise<ICart> {
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [{ ...item, addedAt: new Date() }],
                totalAmount: item.price,
            });
        } else {
            // Check if already in cart
            const exists = cart.items.find((i) => i.product.toString() === item.product.toString());
            if (exists) {
                throw new AppError(400, 'Item already in cart');
            }

            cart.items.push({ ...item, addedAt: new Date() } as ICartItem);
            cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0);
            await cart.save();
        }

        return cart;
    },

    async removeFromCart(userId: string, productId: string): Promise<ICart | null> {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) return null;

        cart.items = cart.items.filter((i) => i.product.toString() !== productId);
        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price, 0);
        await cart.save();

        return cart;
    },

    async clearCart(userId: string): Promise<void> {
        await Cart.findOneAndUpdate({ user: userId }, { items: [], totalAmount: 0 });
    },
};

// ==================== CONTROLLER ====================
const CartController = {
    getCart: catchAsync(async (req: Request, res: Response) => {
        const cart = await CartService.getCart(req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Cart fetched', data: cart });
    }),

    addToCart: catchAsync(async (req: Request, res: Response) => {
        const { productId, productType, price, title, image } = req.body;
        const cart = await CartService.addToCart(req.user!.userId, {
            product: new Types.ObjectId(productId),
            productType,
            price,
            title,
            image,
        });
        sendResponse(res, { statusCode: 200, success: true, message: 'Added to cart', data: cart });
    }),

    removeFromCart: catchAsync(async (req: Request, res: Response) => {
        const cart = await CartService.removeFromCart(req.user!.userId, req.params.productId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Removed from cart', data: cart });
    }),

    clearCart: catchAsync(async (req: Request, res: Response) => {
        await CartService.clearCart(req.user!.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Cart cleared' });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

router.get('/', authMiddleware, CartController.getCart);
router.post('/', authMiddleware, validateRequest(addToCartValidation), CartController.addToCart);
router.delete('/:productId', authMiddleware, CartController.removeFromCart);
router.delete('/', authMiddleware, CartController.clearCart);

export const CartRoutes = router;
export default CartService;
