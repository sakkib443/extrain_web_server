// ===================================================================
// MotionBoss LMS - Stats Controller
// HTTP handlers for stats
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { StatsService } from './stats.service';
import { resetProductMetrics } from '../../utils/resetMetrics';

/**
 * Get dashboard statistics (public)
 */
const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await StatsService.getDashboardStats();

        res.status(200).json({
            success: true,
            message: 'Dashboard stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset all product metrics to 0
 */
const resetMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await resetProductMetrics();

        res.status(200).json({
            success: true,
            message: 'All product metrics (views, likes, sales, ratings) have been reset to 0'
        });
    } catch (error) {
        next(error);
    }
};

export const StatsController = {
    getDashboardStats,
    resetMetrics
};
