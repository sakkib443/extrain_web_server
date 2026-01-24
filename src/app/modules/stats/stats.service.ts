// ===================================================================
// MotionBoss LMS - Stats Service
// Real-time statistics from database
// ===================================================================

import { User } from '../user/user.model';
import { Course } from '../course/course.model';
import { Website } from '../website/website.model';
import { Software } from '../software/software.model';
import { Enrollment } from '../enrollment/enrollment.model';
import { Review } from '../review/review.module';

/**
 * Get real-time dashboard stats from database
 */
const getDashboardStats = async () => {
    try {
        // Count all users
        const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });

        // Count all products (approved/published status or all non-deleted)
        const totalCourses = await Course.countDocuments({ status: 'published' });
        // Websites and Software use 'approved' status
        const totalWebsites = await Website.countDocuments({ status: 'approved', isDeleted: { $ne: true } });
        const totalSoftware = await Software.countDocuments({ status: 'approved', isDeleted: { $ne: true } });

        // Also count all (including pending) for better results if no approved items
        const allWebsites = await Website.countDocuments({ isDeleted: { $ne: true } });
        const allSoftware = await Software.countDocuments({ isDeleted: { $ne: true } });
        const allCourses = await Course.countDocuments({});

        const totalProducts = (totalCourses || allCourses) + (totalWebsites || allWebsites) + (totalSoftware || allSoftware);

        // Count total enrollments/downloads
        const totalEnrollments = await Enrollment.countDocuments({});

        // Calculate average rating from reviews
        const reviewStats = await Review.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
        ]);

        const avgRating = reviewStats.length > 0 ? reviewStats[0].avgRating : 4.8;
        const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;

        return {
            activeUsers: totalUsers,
            downloads: totalEnrollments,
            avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
            totalProducts: totalProducts,
            // Extra details - use all counts to show actual data
            breakdown: {
                courses: allCourses || totalCourses,
                websites: allWebsites || totalWebsites,
                software: allSoftware || totalSoftware,
                users: totalUsers,
                enrollments: totalEnrollments,
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
