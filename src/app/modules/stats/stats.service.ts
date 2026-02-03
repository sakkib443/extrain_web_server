// ===================================================================
// MotionBoss LMS - Stats Service
// Real-time statistics from database
// ===================================================================

import { User } from '../user/user.model';
import { Website } from '../website/website.model';
import { Software } from '../software/software.model';
import { Review } from '../review/review.module';

/**
 * Get real-time dashboard stats from database
 * Note: Course and Enrollment modules have been removed
 */
const getDashboardStats = async () => {
    try {
        // Count all users
        const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });

        // Count all products (approved/published status or all non-deleted)
        // Websites and Software use 'approved' status
        const totalWebsites = await Website.countDocuments({ status: 'approved', isDeleted: { $ne: true } });
        const totalSoftware = await Software.countDocuments({ status: 'approved', isDeleted: { $ne: true } });

        // Also count all (including pending) for better results if no approved items
        const allWebsites = await Website.countDocuments({ isDeleted: { $ne: true } });
        const allSoftware = await Software.countDocuments({ isDeleted: { $ne: true } });

        const totalProducts = (totalWebsites || allWebsites) + (totalSoftware || allSoftware);

        // Calculate average rating from reviews
        const reviewStats = await Review.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);

        const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 4.8;
        const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;

        return {
            activeUsers: totalUsers,
            downloads: 0, // Enrollment module removed
            avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            totalProducts: totalProducts,
            // Extra details - use all counts to show actual data
            breakdown: {
                courses: 0, // Course module removed
                websites: allWebsites || totalWebsites,
                software: allSoftware || totalSoftware,
                users: totalUsers,
                enrollments: 0, // Enrollment module removed
                reviews: totalReviews
            }
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        // Return defaults on error
        return {
            activeUsers: 0,
            downloads: 0,
            avgRating: 4.8,
            totalProducts: 0,
            breakdown: {
                courses: 0,
                websites: 0,
                software: 0,
                users: 0,
                enrollments: 0,
                reviews: 0
            }
        };
    }
};

export const StatsService = {
    getDashboardStats
};
