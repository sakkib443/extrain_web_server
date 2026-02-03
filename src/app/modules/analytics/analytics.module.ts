// ===================================================================
// MotionBoss LMS - Analytics & Reports Module
// Dashboard Analytics, Revenue Reports, Marketplace Stats
// ===================================================================

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import express from 'express';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import { Order } from '../order/order.module';
import { BkashPayment } from '../bkash/bkash.module';
import { User } from '../user/user.model';
import { Website } from '../website/website.model';

// ==================== SERVICE ====================
const AnalyticsService = {
    /**
     * Dashboard Summary - Admin dashboard এর জন্য সব stats একসাথে
     * Marketplace data only (Course/LMS modules removed)
     */
    async getDashboardSummary(): Promise<{
        // User Stats
        totalUsers: number;
        totalStudents: number;
        newUsersThisMonth: number;
        // Course Stats (now always 0 - modules removed)
        totalCourses: number;
        publishedCourses: number;
        totalLessons: number;
        // Enrollment Stats (now always 0 - modules removed)
        totalEnrollments: number;
        activeEnrollments: number;
        completedEnrollments: number;
        enrollmentsThisMonth: number;
        // Product Stats
        totalWebsites: number;
        totalSoftware: number;
        // Order & Revenue Stats
        totalOrders: number;
        todayOrders: number;
        pendingOrders: number;
        completedOrders: number;
        totalRevenue: number;
        todayRevenue: number;
        monthlyRevenue: number;
        // Category Stats
        totalCategories: number;
        // Engagement Stats
        totalLikes: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Import dynamically to avoid circular dependencies
        const { Software } = await import('../software/software.model');
        const { Category } = await import('../category/category.model');

        const [
            // User counts
            totalUsers,
            totalStudents,
            newUsersThisMonth,
            // Product counts
            totalWebsites,
            totalSoftware,
            // Category count
            totalCategories,
            // Order counts
            totalOrders,
            todayOrders,
            pendingOrders,
            completedOrders,
            // Engagement (Sum of likeCount)
            websiteLikes,
            softwareLikes,
            // Revenue aggregations
            totalRevenueResult,
            todayRevenueResult,
            monthlyRevenueResult,
        ] = await Promise.all([
            // User queries
            User.countDocuments({ isDeleted: false }),
            User.countDocuments({ role: 'student', isDeleted: false }),
            User.countDocuments({ createdAt: { $gte: firstDayOfMonth }, isDeleted: false }),
            // Product queries
            Website.countDocuments({ isDeleted: false }),
            Software.countDocuments({ isDeleted: false }),
            // Category query
            Category.countDocuments({}),
            // Order queries
            Order.countDocuments(),
            Order.countDocuments({ orderDate: { $gte: today } }),
            Order.countDocuments({ paymentStatus: 'pending' }),
            Order.countDocuments({ paymentStatus: 'completed' }),
            // Engagement (Sum of likeCount)
            Website.aggregate([{ $group: { _id: null, total: { $sum: '$likeCount' } } }]),
            Software.aggregate([{ $group: { _id: null, total: { $sum: '$likeCount' } } }]),
            // Revenue aggregations
            // Total Revenue
            (async () => {
                const [reg, inst] = await Promise.all([
                    Order.aggregate([
                        { $match: { isInstallment: { $ne: true }, paymentStatus: 'completed' } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    Order.aggregate([
                        { $unwind: '$installments' },
                        { $match: { 'installments.status': 'completed' } },
                        { $group: { _id: null, total: { $sum: '$installments.amount' } } }
                    ])
                ]);
                return [{ total: (reg[0]?.total || 0) + (inst[0]?.total || 0) }];
            })(),

            // Today Revenue
            (async () => {
                const [reg, inst] = await Promise.all([
                    Order.aggregate([
                        { $match: { isInstallment: { $ne: true }, paymentStatus: 'completed', orderDate: { $gte: today } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    Order.aggregate([
                        { $unwind: '$installments' },
                        { $match: { 'installments.status': 'completed', 'installments.paidAt': { $gte: today } } },
                        { $group: { _id: null, total: { $sum: '$installments.amount' } } }
                    ])
                ]);
                return [{ total: (reg[0]?.total || 0) + (inst[0]?.total || 0) }];
            })(),

            // Monthly Revenue
            (async () => {
                const [reg, inst] = await Promise.all([
                    Order.aggregate([
                        { $match: { isInstallment: { $ne: true }, paymentStatus: 'completed', orderDate: { $gte: firstDayOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    Order.aggregate([
                        { $unwind: '$installments' },
                        { $match: { 'installments.status': 'completed', 'installments.paidAt': { $gte: firstDayOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$installments.amount' } } }
                    ])
                ]);
                return [{ total: (reg[0]?.total || 0) + (inst[0]?.total || 0) }];
            })(),
        ]);

        return {
            // User Stats
            totalUsers,
            totalStudents,
            newUsersThisMonth,
            // Course Stats (modules removed - returning 0)
            totalCourses: 0,
            publishedCourses: 0,
            totalLessons: 0,
            // Enrollment Stats (modules removed - returning 0)
            totalEnrollments: 0,
            activeEnrollments: 0,
            completedEnrollments: 0,
            enrollmentsThisMonth: 0,
            // Product Stats
            totalWebsites,
            totalSoftware,
            // Order & Revenue Stats
            totalOrders,
            todayOrders,
            pendingOrders,
            completedOrders,
            totalRevenue: totalRevenueResult[0]?.total || 0,
            todayRevenue: todayRevenueResult[0]?.total || 0,
            monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
            // Category Stats
            totalCategories,
            // Engagement
            totalLikes: (websiteLikes[0]?.total || 0) + (softwareLikes[0]?.total || 0),
        };
    },

    /**
     * Public Statistics - Home page এর জন্য public stats (no auth required)
     */
    async getPublicStatistics(): Promise<{
        totalWebsites: number;
        totalSoftware: number;
        totalCustomers: number;
        totalDownloads: number;
        averageRating: number;
        totalReviews: number;
    }> {
        // Import Software model dynamically to avoid circular dependency
        const { Software } = await import('../software/software.model');
        const { Review } = await import('../review/review.module');

        const [
            totalWebsites,
            totalSoftware,
            totalCustomers,
            totalDownloads,
            ratingResult,
            totalReviews,
        ] = await Promise.all([
            Website.countDocuments({ isDeleted: false }),
            Software.countDocuments({ isDeleted: false }),
            User.countDocuments({ isDeleted: false }),
            Order.countDocuments({ paymentStatus: 'completed' }),
            Website.aggregate([
                { $match: { isDeleted: false, rating: { $gt: 0 } } },
                { $group: { _id: null, avg: { $avg: '$rating' } } }
            ]),
            Review ? Review.countDocuments() : Promise.resolve(0),
        ]);

        return {
            totalWebsites,
            totalSoftware,
            totalCustomers,
            totalDownloads,
            averageRating: ratingResult[0]?.avg ? parseFloat(ratingResult[0].avg.toFixed(1)) : 4.8,
            totalReviews,
        };
    },

    /**
     * Revenue by Date Range - নির্দিষ্ট সময়ে কত আয় হয়েছে
     */
    async getRevenueByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<{ date: string; revenue: number; orders: number }[]> {
        const [regularResult, installmentResult] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        isInstallment: { $ne: true },
                        paymentStatus: 'completed',
                        orderDate: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
                        revenue: { $sum: '$totalAmount' },
                        orders: { $sum: 1 },
                    },
                },
            ]),
            Order.aggregate([
                { $unwind: '$installments' },
                {
                    $match: {
                        'installments.status': 'completed',
                        'installments.paidAt': { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$installments.paidAt' } },
                        revenue: { $sum: '$installments.amount' },
                        orders: { $sum: 1 },
                    },
                },
            ])
        ]);

        // Combine results
        const combinedMap = new Map();

        regularResult.forEach(item => {
            combinedMap.set(item._id, { date: item._id, revenue: item.revenue, orders: item.orders });
        });

        installmentResult.forEach(item => {
            const existing = combinedMap.get(item._id);
            if (existing) {
                existing.revenue += item.revenue;
                // For installment orders, should we count them as new "orders" for daily stats?
                // Usually these are payment events, not new orders. Let's keep orders count from regular only or add them.
                // existing.orders += item.orders; 
            } else {
                combinedMap.set(item._id, { date: item._id, revenue: item.revenue, orders: 1 });
            }
        });

        return Array.from(combinedMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    },

    /**
     * Category Revenue Breakdown - প্রোডাক্ট টাইপ অনুযায়ী রেভিনিউ (মাস ভিত্তিক)
     * Returns monthly revenue for courses, websites, and software for the last 12 months
     */
    async getCategoryRevenue(): Promise<{
        labels: string[];
        categories: { [key: string]: number[] };
    }> {
        const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Get date 12 months ago from today
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        // Fetch completed orders for the last 12 months
        const orders = await Order.find({
            paymentStatus: 'completed',
            orderDate: { $gte: twelveMonthsAgo }
        });

        // Prepare labels for the last 12 months
        const labels: string[] = [];
        const monthToIdx: { [key: string]: number } = {};

        for (let i = 0; i < 12; i++) {
            const date = new Date(twelveMonthsAgo);
            date.setMonth(twelveMonthsAgo.getMonth() + i);
            const mIdx = date.getMonth();
            const yIdx = date.getFullYear();
            const key = `${yIdx}-${mIdx}`;
            labels.push(monthsNames[mIdx]);
            monthToIdx[key] = i;
        }

        // Identify all unique product types in the orders
        const productTypes = new Set<string>();
        orders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
                if (item.productType) productTypes.add(item.productType.toLowerCase());
            });
        });

        // Initialize revenue arrays for each product type
        const categories: { [key: string]: number[] } = {};
        productTypes.forEach(type => {
            categories[type] = new Array(12).fill(0);
        });

        // Process each order
        orders.forEach((order: any) => {
            const orderDate = new Date(order.orderDate);
            const month = orderDate.getMonth();
            const year = orderDate.getFullYear();
            const key = `${year}-${month}`;
            const idx = monthToIdx[key];

            if (idx !== undefined) {
                const amountFactor = order.isInstallment ? (order.installments?.filter((i: any) => i.status === 'completed').reduce((sum: number, i: any) => sum + (i.amount || 0), 0) / (order.totalAmount || 1)) : 1;

                order.items?.forEach((item: any) => {
                    let amount = item.price || 0;
                    if (order.isInstallment) amount = amount * amountFactor;

                    const productType = item.productType?.toLowerCase() || '';
                    if (categories[productType]) {
                        categories[productType][idx] += amount;
                    }
                });
            }
        });

        console.log(`[Analytics] Category revenue generated for ${productTypes.size} categories from ${orders.length} orders`);

        return {
            labels,
            categories,
        };
    },

    /**
     * Top Selling Products - সবচেয়ে বেশি বিক্রি হওয়া products
     */
    async getTopSellingProducts(limit = 10): Promise<any[]> {
        return await Website.find({ isDeleted: false })
            .select('title slug price salesCount rating images')
            .sort({ salesCount: -1 })
            .limit(limit);
    },

    /**
     * Recent Purchases - সাম্প্রতিক purchases
     */
    async getRecentPurchases(limit = 20): Promise<any[]> {
        return await Order.find({ paymentStatus: 'completed' })
            .populate('user', 'firstName lastName email')
            .sort({ orderDate: -1 })
            .limit(limit);
    },

    /**
     * Sales Report Data - CSV ডাউনলোড এর জন্য
     */
    async getSalesReportData(
        startDate: Date,
        endDate: Date
    ): Promise<{
        orders: any[];
        summary: {
            totalOrders: number;
            totalRevenue: number;
            avgOrderValue: number;
        };
    }> {
        const orders = await Order.find({
            paymentStatus: 'completed',
            orderDate: { $gte: startDate, $lte: endDate },
        })
            .populate('user', 'firstName lastName email')
            .sort({ orderDate: -1 });

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        return {
            orders,
            summary: {
                totalOrders: orders.length,
                totalRevenue,
                avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
            },
        };
    },

    /**
     * Customer Report - কোন customer কি কিনেছে
     */
    async getCustomerReport(): Promise<any[]> {
        return await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    lastOrder: { $max: '$orderDate' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    firstName: '$user.firstName',
                    lastName: '$user.lastName',
                    email: '$user.email',
                    totalOrders: 1,
                    totalSpent: 1,
                    lastOrder: 1,
                },
            },
            { $sort: { totalSpent: -1 } },
        ]);
    },

    /**
     * Generate CSV Content - CSV format 에 data তৈরি
     */
    generateSalesCSV(orders: any[]): string {
        const headers = [
            'Order Number',
            'Order Date',
            'Customer Name',
            'Customer Email',
            'Products',
            'Total Amount (BDT)',
            'Payment Status',
        ];

        const rows = orders.map((order) => [
            order.orderNumber,
            new Date(order.orderDate).toISOString().split('T')[0],
            `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
            order.user?.email || '',
            order.items?.map((i: any) => i.title).join('; ') || '',
            order.totalAmount,
            order.paymentStatus,
        ]);

        // Create CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        return csvContent;
    },

    /**
     * Generate Customer CSV
     */
    generateCustomerCSV(customers: any[]): string {
        const headers = [
            'Customer Name',
            'Email',
            'Total Orders',
            'Total Spent (BDT)',
            'Last Order Date',
        ];

        const rows = customers.map((c) => [
            `${c.firstName || ''} ${c.lastName || ''}`.trim(),
            c.email || '',
            c.totalOrders,
            c.totalSpent,
            c.lastOrder ? new Date(c.lastOrder).toISOString().split('T')[0] : '',
        ]);

        return [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');
    },
};

// ==================== CONTROLLER ====================
const AnalyticsController = {
    // Dashboard Summary
    getDashboard: catchAsync(async (req: Request, res: Response) => {
        const summary = await AnalyticsService.getDashboardSummary();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Dashboard data fetched',
            data: summary,
        });
    }),

    // Revenue by Date Range
    getRevenue: catchAsync(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        const revenueData = await AnalyticsService.getRevenueByDateRange(start, end);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Revenue data fetched',
            data: revenueData,
        });
    }),

    // Top Selling Products
    getTopProducts: catchAsync(async (req: Request, res: Response) => {
        const limit = Number(req.query.limit) || 10;
        const products = await AnalyticsService.getTopSellingProducts(limit);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Top products fetched',
            data: products,
        });
    }),

    // Recent Purchases
    getRecentPurchases: catchAsync(async (req: Request, res: Response) => {
        const limit = Number(req.query.limit) || 20;
        const purchases = await AnalyticsService.getRecentPurchases(limit);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Recent purchases fetched',
            data: purchases,
        });
    }),

    // Download Sales Report (CSV)
    downloadSalesReport: catchAsync(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();

        const { orders, summary } = await AnalyticsService.getSalesReportData(start, end);
        const csv = AnalyticsService.generateSalesCSV(orders);

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);

        res.send(csv);
    }),

    // Download Customer Report (CSV)
    downloadCustomerReport: catchAsync(async (req: Request, res: Response) => {
        const customers = await AnalyticsService.getCustomerReport();
        const csv = AnalyticsService.generateCustomerCSV(customers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=customer-report.csv');

        res.send(csv);
    }),

    // Get Customer Report (JSON)
    getCustomerReport: catchAsync(async (req: Request, res: Response) => {
        const customers = await AnalyticsService.getCustomerReport();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Customer report fetched',
            data: customers,
        });
    }),

    // Public Statistics (no auth required)
    getPublicStats: catchAsync(async (req: Request, res: Response) => {
        const stats = await AnalyticsService.getPublicStatistics();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Public statistics fetched',
            data: stats,
        });
    }),

    // Category Revenue Breakdown
    getCategoryRevenue: catchAsync(async (req: Request, res: Response) => {
        const data = await AnalyticsService.getCategoryRevenue();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Category revenue fetched',
            data: data,
        });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

// ========== PUBLIC ROUTES (No Auth) ==========
// Public stats for home page - MUST be before auth middleware
router.get('/public-stats', AnalyticsController.getPublicStats);

// ========== ADMIN ROUTES (Auth Required) ==========
// All routes below require admin authentication
router.use(authMiddleware, authorizeRoles('admin'));

// Dashboard
router.get('/dashboard', AnalyticsController.getDashboard);

// Revenue
router.get('/revenue', AnalyticsController.getRevenue);

// Category Revenue Breakdown (for charts)
router.get('/category-revenue', AnalyticsController.getCategoryRevenue);

// Top Products
router.get('/top-products', AnalyticsController.getTopProducts);

// Recent Purchases
router.get('/recent-purchases', AnalyticsController.getRecentPurchases);

// Customer Report
router.get('/customers', AnalyticsController.getCustomerReport);

// Download Reports (CSV)
router.get('/download/sales', AnalyticsController.downloadSalesReport);
router.get('/download/customers', AnalyticsController.downloadCustomerReport);

export const AnalyticsRoutes = router;
export default AnalyticsService;
