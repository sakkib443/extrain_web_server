// ===================================================================
// MotionBoss LMS - Coupon Service
// Business logic for coupon module
// ===================================================================

import { ICoupon } from './coupon.interface';
import { Coupon } from './coupon.model';

/**
 * Create a new coupon
 */
const createCoupon = async (payload: ICoupon): Promise<ICoupon> => {
    // Check if code already exists
    const existing = await Coupon.findOne({ code: payload.code.toUpperCase() });
    if (existing) {
        throw new Error('Coupon code already exists');
    }

    payload.code = payload.code.toUpperCase();
    const result = await Coupon.create(payload);
    return result;
};

/**
 * Get all coupons with filters
 */
const getAllCoupons = async (filters: {
    isActive?: boolean;
    searchTerm?: string;
}): Promise<ICoupon[]> => {
    const query: any = {};

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    if (filters.searchTerm) {
        query.$or = [
            { code: { $regex: filters.searchTerm, $options: 'i' } },
            { name: { $regex: filters.searchTerm, $options: 'i' } }
        ];
    }

    return Coupon.find(query).sort({ createdAt: -1 });
};

/**
 * Get coupon by ID
 */
const getCouponById = async (id: string): Promise<ICoupon | null> => {
    return Coupon.findById(id);
};

/**
 * Get coupon by code
 */
const getCouponByCode = async (code: string): Promise<ICoupon | null> => {
    return Coupon.findOne({ code: code.toUpperCase() });
};

/**
 * Update coupon
 */
const updateCoupon = async (id: string, payload: Partial<ICoupon>): Promise<ICoupon | null> => {
    if (payload.code) {
        payload.code = payload.code.toUpperCase();
        // Check if new code exists
        const existing = await Coupon.findOne({ code: payload.code, _id: { $ne: id } });
        if (existing) {
            throw new Error('Coupon code already exists');
        }
    }

    const result = await Coupon.findByIdAndUpdate(id, { $set: payload }, { new: true });
    return result;
};

/**
 * Delete coupon
 */
const deleteCoupon = async (id: string): Promise<ICoupon | null> => {
    return Coupon.findByIdAndDelete(id);
};

/**
 * Apply coupon - Validate and calculate discount
 */
const applyCoupon = async (
    code: string,
    cartTotal: number,
    productType?: 'all' | 'course' | 'website' | 'software',
    userId?: string
): Promise<{
    valid: boolean;
    discount: number;
    message: string;
    couponCode?: string;
    discountType?: string;
    discountValue?: number;
    // Installment Info
    installmentEnabled?: boolean;
    installmentCount?: number;
    installmentIntervalDays?: number;
    installments?: Array<{
        installmentNumber: number;
        amount: number;
        dueDate: string;
    }>;
    coupon?: ICoupon;
}> => {
    const coupon = await Coupon.isValidCoupon(code);

    if (!coupon) {
        return {
            valid: false,
            discount: 0,
            message: 'Invalid or expired coupon code'
        };
    }

    // Check minimum purchase
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
        return {
            valid: false,
            discount: 0,
            message: `Minimum purchase of ৳${coupon.minPurchase} required`
        };
    }

    // Check product type applicability
    if (coupon.applicableTo !== 'all' && productType && productType !== 'all') {
        if (coupon.applicableTo !== productType) {
            return {
                valid: false,
                discount: 0,
                message: `This coupon is only valid for ${coupon.applicableTo}`
            };
        }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
        if (discount > cartTotal) {
            discount = cartTotal;
        }
    } else if (coupon.discountType === 'fixed_price') {
        discount = cartTotal - coupon.discountValue;
        if (discount < 0) {
            discount = 0;
        }
    }

    // Calculate installments if enabled
    let installments: Array<{ installmentNumber: number; amount: number; dueDate: string }> | undefined;

    if (coupon.installmentEnabled && coupon.installmentCount && coupon.installmentCount > 1) {
        const finalAmount = cartTotal - Math.round(discount);
        const installmentAmount = Math.ceil(finalAmount / coupon.installmentCount);
        const intervalDays = coupon.installmentIntervalDays || 30;

        installments = [];
        for (let i = 1; i <= coupon.installmentCount; i++) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + ((i - 1) * intervalDays));

            // Last installment adjusts for rounding
            const amount = i === coupon.installmentCount
                ? finalAmount - (installmentAmount * (coupon.installmentCount - 1))
                : installmentAmount;

            installments.push({
                installmentNumber: i,
                amount: amount,
                dueDate: dueDate.toISOString().split('T')[0] // YYYY-MM-DD format
            });
        }
    }

    return {
        valid: true,
        discount: Math.round(discount),
        message: coupon.installmentEnabled
            ? `Coupon applied! Pay in ${coupon.installmentCount} installments.`
            : 'Coupon applied successfully!',
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        installmentEnabled: coupon.installmentEnabled || false,
        installmentCount: coupon.installmentCount || 1,
        installmentIntervalDays: coupon.installmentIntervalDays || 30,
        installments,
        coupon
    };
};

/**
 * Use coupon - Increment usage count
 */
const useCoupon = async (couponId: string): Promise<void> => {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
};

/**
 * Get the active top header coupon
 */
const getTopHeaderCoupon = async (): Promise<ICoupon | null> => {
    const now = new Date();
    return Coupon.findOne({
        showInTopHeader: true,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
        ]
    }).sort({ updatedAt: -1 });
};

export const CouponService = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    getCouponByCode,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
    useCoupon,
    getTopHeaderCoupon
};
