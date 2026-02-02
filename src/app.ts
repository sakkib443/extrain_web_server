// ===================================================================
// ejobs it LMS - Main Application File
// Express app setup with all routes and middleware
// মূল এপ্লিকেশন ফাইল - সব routes এবং middleware এখানে connect হয়েছে
// ===================================================================

import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import cookieParser from 'cookie-parser';

// ==================== Middleware Imports ====================
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFoundHandler from './app/middlewares/notFoundHandler';
import config from './app/config';

// ==================== Route Imports ====================
import { AuthRoutes } from './app/modules/auth/auth.routes';
import { UserRoutes } from './app/modules/user/user.routes';
import { CategoryRoutes } from './app/modules/category/category.routes';
import { PlatformRoutes } from './app/modules/platform/platform.routes';
import { WebsiteRoutes } from './app/modules/website/website.routes';
import { SoftwareRoutes } from './app/modules/software/software.routes';
import { CartRoutes } from './app/modules/cart/cart.module';
import { WishlistRoutes } from './app/modules/wishlist/wishlist.module';
import { OrderRoutes } from './app/modules/order/order.module';
import { ReviewRoutes } from './app/modules/review/review.module';
import { DownloadRoutes } from './app/modules/download/download.module';
import { BkashRoutes } from './app/modules/bkash/bkash.module';
import { AnalyticsRoutes } from './app/modules/analytics/analytics.module';
import { uploadRoutes } from './app/modules/upload/upload.routes';
import { NotificationRoutes } from './app/modules/notification/notification.module';
import { DesignRoutes } from './app/modules/design/design.routes';
import { StatsRoutes } from './app/modules/stats/stats.routes';
import { CouponRoutes } from './app/modules/coupon/coupon.routes';
import { SiteContentRoutes } from './app/modules/siteContent/siteContent.routes';
import { PageContentRoutes } from './app/modules/pageContent/pageContent.routes';
import { BlogRoutes } from './app/modules/blog/blog.routes';

// ==================== App Initialization ====================
const app: Application = express();

// ==================== Global Middlewares ====================
// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (for refresh token)
app.use(cookieParser());

// ==================== Vercel Database Connection Middleware ====================
// This MUST be here (before routes) for Vercel Serverless to work
import mongoose from 'mongoose';
import { connectDB } from './app/utils/dbConnect';

// Track if cleanup has already run
let hasCleanedIndexes = false;

app.use(async (req: Request, res: Response, next) => {
  // Only reconnect if not connected (Vercel cold starts)
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDB();
      // Only run cleanup once per instance, not every request
      if (!hasCleanedIndexes) {
        hasCleanedIndexes = true;
        // Import and run cleanup lazily to avoid blocking
        import('./app/utils/dbConnect').then(({ cleanupStaleIndexes }) => {
          cleanupStaleIndexes().catch(() => { });
        });
      }
    } catch (error) {
      console.error('❌ Database connection failed in middleware:', error);
      return res.status(503).json({ success: false, message: 'Database connection failed' });
    }
  }
  next();
});

// CORS configuration - supports multiple origins for production
const allowedOrigins = [
  config.frontend_url,
  'http://localhost:3000',
  'https://Extrain Web.vercel.app',
  'https://ejobs-it.vercel.app',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in production for API
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ==================== Health Check Route ====================
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Extrain Web API Server is running!',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// ==================== API Health Check ====================
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    uptime: process.uptime(),
  });
});

// ==================== API Routes ====================
// Authentication routes (public)
app.use('/api/auth', AuthRoutes);

// User routes (authenticated)
app.use('/api/users', UserRoutes);

// Category routes (public + admin)
app.use('/api/categories', CategoryRoutes);

// Platform routes (public + admin)
app.use('/api/platforms', PlatformRoutes);

// Website product routes (main marketplace)
app.use('/api/websites', WebsiteRoutes);

// Software product routes (scripts & plugins marketplace)
app.use('/api/software', SoftwareRoutes);

// Cart routes (authenticated)
app.use('/api/cart', CartRoutes);

// Wishlist routes (authenticated)
app.use('/api/wishlist', WishlistRoutes);

// Order routes (authenticated)
app.use('/api/orders', OrderRoutes);

// Review routes (public + authenticated)
app.use('/api/reviews', ReviewRoutes);

// Download routes (authenticated)
app.use('/api/downloads', DownloadRoutes);

// bKash Payment routes (authenticated)
app.use('/api/bkash', BkashRoutes);

// Analytics routes (admin only)
app.use('/api/analytics', AnalyticsRoutes);

// Upload routes (authenticated)
app.use('/api/upload', uploadRoutes);

// Notification routes (admin only)
app.use('/api/notifications', NotificationRoutes);

// Design routes (website design/content management)
app.use('/api/design', DesignRoutes);

// Stats routes (real-time database statistics)
app.use('/api/stats', StatsRoutes);

// Coupon routes (discount codes)
app.use('/api/coupons', CouponRoutes);

// Site Content routes (editable website content)
app.use('/api/site-content', SiteContentRoutes);

// Page Content routes (dynamic page content management)
app.use('/api/page-content', PageContentRoutes);

// Blog routes (blog posts and comments)
app.use('/api/blogs', BlogRoutes);

// ==================== Error Handling ====================
// 404 Not Found handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
