// ===================================================================
// MotionBoss LMS - Stats Controller
// HTTP handlers for stats
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { StatsService } from './stats.service';

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

export const StatsController = {
    getDashboardStats
};
