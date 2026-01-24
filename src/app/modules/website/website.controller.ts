// ===================================================================
// Extrain Web Backend - Website Controller
// HTTP Request handling for Website Products
// ===================================================================

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import WebsiteService from './website.service';
import pick from '../../utils/pick';
import { IWebsiteFilters, IWebsiteQuery } from './website.interface';
import AppError from '../../utils/AppError';

const WebsiteController = {
    // ==================== CREATE (Admin) ====================
    createWebsite: catchAsync(async (req: Request, res: Response) => {
        const website = await WebsiteService.createWebsite(req.body);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Website created successfully.',
            data: website,
        });
    }),

    // ==================== GET ALL (Public) ====================
    getAllWebsites: catchAsync(async (req: Request, res: Response) => {
        const filters = pick(req.query, [
            'searchTerm', 'category', 'platform', 'accessType', 'minPrice', 'maxPrice', 'minRating',
        ]) as IWebsiteFilters;

        // Convert string to number
        if (filters.minPrice) filters.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) filters.maxPrice = Number(filters.maxPrice);
        if (filters.minRating) filters.minRating = Number(filters.minRating);

        const query: IWebsiteQuery = {
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await WebsiteService.getAllWebsites(filters, query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Websites fetched successfully',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== GET FEATURED ====================
    getFeaturedWebsites: catchAsync(async (req: Request, res: Response) => {
        const limit = req.query.limit ? Number(req.query.limit) : 8;
        const websites = await WebsiteService.getFeaturedWebsites(limit);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Featured websites fetched',
            data: websites,
        });
    }),

    // ==================== GET BY ID ====================
    getWebsiteById: catchAsync(async (req: Request, res: Response) => {
        const website = await WebsiteService.getWebsiteById(req.params.id);

        // Increment view count
        await WebsiteService.incrementViewCount(req.params.id);

        // Check if user has liked
        const userId = req.user?.userId || (req.user as any)?._id?.toString();
        const isLiked = userId && website.likedBy?.some(id => id.toString() === userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website fetched successfully',
            data: { ...JSON.parse(JSON.stringify(website)), isLiked: !!isLiked },
        });
    }),

    // ==================== GET BY SLUG (Public) ====================
    getWebsiteBySlug: catchAsync(async (req: Request, res: Response) => {
        const website = await WebsiteService.getWebsiteBySlug(req.params.slug);

        // Check if user has liked
        const userId = req.user?.userId || (req.user as any)?._id?.toString();
        const isLiked = userId && website.likedBy?.some(id => id.toString() === userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website fetched successfully',
            data: { ...JSON.parse(JSON.stringify(website)), isLiked: !!isLiked },
        });
    }),

    // ==================== GET ALL FOR ADMIN ====================
    getAdminAllWebsites: catchAsync(async (req: Request, res: Response) => {
        const query: IWebsiteQuery = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await WebsiteService.getAdminAllWebsites(query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'All websites fetched',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== UPDATE ====================
    updateWebsite: catchAsync(async (req: Request, res: Response) => {
        const isAdmin = req.user!.role === 'admin';
        const website = await WebsiteService.updateWebsite(
            req.params.id,
            req.body,
            isAdmin
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website updated successfully',
            data: website,
        });
    }),

    // ==================== DELETE ====================
    deleteWebsite: catchAsync(async (req: Request, res: Response) => {
        const isAdmin = req.user!.role === 'admin';
        await WebsiteService.deleteWebsite(req.params.id, isAdmin);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website deleted successfully',
        });
    }),

    // ==================== ADMIN: GET ALL ====================
    getAdminWebsites: catchAsync(async (req: Request, res: Response) => {
        const filters = pick(req.query, ['searchTerm', 'status', 'category', 'platform']) as IWebsiteFilters;
        const query: IWebsiteQuery = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await WebsiteService.getAdminWebsites(filters, query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Websites fetched',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== ADMIN: APPROVE/REJECT ====================
    updateWebsiteStatus: catchAsync(async (req: Request, res: Response) => {
        const { status } = req.body;
        const website = await WebsiteService.updateWebsiteStatus(req.params.id, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: `Website ${status} successfully`,
            data: website,
        });
    }),

    // ==================== INCREMENT VIEW ====================
    incrementView: catchAsync(async (req: Request, res: Response) => {
        const result = await WebsiteService.incrementViewCount(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'View count incremented',
            data: result,
        });
    }),

    // ==================== LIKE ====================
    likeWebsite: catchAsync(async (req: Request, res: Response) => {
        const result = await WebsiteService.incrementLikeCount(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website liked',
            data: result,
        });
    }),

    // ==================== UNLIKE ====================
    unlikeWebsite: catchAsync(async (req: Request, res: Response) => {
        const result = await WebsiteService.decrementLikeCount(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website unliked',
            data: result,
        });
    }),

    // ==================== GET STATS ====================
    getStats: catchAsync(async (req: Request, res: Response) => {
        const result = await WebsiteService.getWebsiteStats(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Website stats fetched',
            data: result,
        });
    }),

    // ==================== TOGGLE LIKE ====================
    toggleLike: catchAsync(async (req: Request, res: Response) => {
        const userId = req.user?.userId || (req.user as any)?._id || (req.user as any)?.id;
        if (!userId) {
            throw new AppError(401, 'User ID not found in token');
        }
        const result = await WebsiteService.toggleLike(req.params.id, userId.toString());

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: result.isLiked ? 'Website liked' : 'Website unliked',
            data: result,
        });
    }),
};

export default WebsiteController;
