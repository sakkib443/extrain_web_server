// ===================================================================
// MotionBoss LMS - Stats Routes
// API endpoints for stats
// ===================================================================

import express from 'express';
import { StatsController } from './stats.controller';

const router = express.Router();

// Get dashboard stats (public - for hero section)
router.get('/dashboard', StatsController.getDashboardStats);

// Reset all product metrics (Admin only recommended)
router.post('/reset', StatsController.resetMetrics);

export const StatsRoutes = router;
