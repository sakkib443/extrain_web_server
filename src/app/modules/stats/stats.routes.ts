// ===================================================================
// MotionBoss LMS - Stats Routes
// API endpoints for stats
// ===================================================================

import express from 'express';
import { StatsController } from './stats.controller';

const router = express.Router();

// Get dashboard stats (public - for hero section)
router.get('/dashboard', StatsController.getDashboardStats);

export const StatsRoutes = router;
