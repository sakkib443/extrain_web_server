// ===================================================================
// ExtraWeb Backend - Software Controller
// HTTP Request handling for Software Products
// ===================================================================

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import SoftwareService from './software.service';
import pick from '../../utils/pick';
import { ISoftwareFilters, ISoftwareQuery } from './software.interface';
import AppError from '../../utils/AppError';

const SoftwareController = {
    // ==================== CREATE (Seller/Admin) ====================
    createSoftware: catchAsync(async (req: Request, res: Response) => {
        const software = await SoftwareService.createSoftware(req.body, req.user!.userId);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Software created successfully. Pending approval.',
            data: software,
        });
    }),

    // ==================== GET ALL (Public) ====================
    getAllSoftware: catchAsync(async (req: Request, res: Response) => {
        const filters = pick(req.query, [
            'searchTerm', 'category', 'platform', 'accessType', 'softwareType', 'minPrice', 'maxPrice', 'minRating',
        ]) as ISoftwareFilters;

        // Convert string to number
        if (filters.minPrice) filters.minPrice = Number(filters.minPrice);
        if (filters.maxPrice) filters.maxPrice = Number(filters.maxPrice);
        if (filters.minRating) filters.minRating = Number(filters.minRating);

        const query: ISoftwareQuery = {
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await SoftwareService.getAllSoftware(filters, query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software fetched successfully',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== GET FEATURED ====================
    getFeaturedSoftware: catchAsync(async (req: Request, res: Response) => {
        const limit = req.query.limit ? Number(req.query.limit) : 8;
        const software = await SoftwareService.getFeaturedSoftware(limit);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Featured software fetched',
            data: software,
        });
    }),

    // ==================== GET BY ID ====================
    getSoftwareById: catchAsync(async (req: Request, res: Response) => {
        const software = await SoftwareService.getSoftwareById(req.params.id);

        // Increment view count (fire and forget)
        SoftwareService.incrementViewCount(req.params.id).catch(() => { });

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && software.likedBy?.some((id: any) => id.toString() === userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software fetched successfully',
            data: { ...JSON.parse(JSON.stringify(software)), isLiked: !!isLiked },
        });
    }),

    // ==================== GET BY SLUG (Public) ====================
    getSoftwareBySlug: catchAsync(async (req: Request, res: Response) => {
        const software = await SoftwareService.getSoftwareBySlug(req.params.slug);

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && software.likedBy?.some((id: any) => id.toString() === userId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software fetched successfully',
            data: { ...JSON.parse(JSON.stringify(software)), isLiked: !!isLiked },
        });
    }),

    // ==================== GET MY SOFTWARE (Seller) ====================
    getMySoftware: catchAsync(async (req: Request, res: Response) => {
        const query: ISoftwareQuery = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await SoftwareService.getUserSoftware(req.user!.userId, query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Your software fetched',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== UPDATE ====================
    updateSoftware: catchAsync(async (req: Request, res: Response) => {
        const isAdmin = req.user!.role === 'admin';
        const software = await SoftwareService.updateSoftware(
            req.params.id,
            req.body,
            req.user!.userId,
            isAdmin
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software updated successfully',
            data: software,
        });
    }),

    // ==================== DELETE ====================
    deleteSoftware: catchAsync(async (req: Request, res: Response) => {
        const isAdmin = req.user!.role === 'admin';
        await SoftwareService.deleteSoftware(req.params.id, req.user!.userId, isAdmin);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software deleted successfully',
        });
    }),

    // ==================== ADMIN: GET ALL ====================
    getAdminSoftware: catchAsync(async (req: Request, res: Response) => {
        const filters = pick(req.query, ['searchTerm', 'status', 'category', 'platform', 'softwareType']) as ISoftwareFilters;
        const query: ISoftwareQuery = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc',
        };

        const result = await SoftwareService.getAdminSoftware(filters, query);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Software fetched',
            meta: result.meta,
            data: result.data,
        });
    }),

    // ==================== ADMIN: APPROVE/REJECT ====================
    updateSoftwareStatus: catchAsync(async (req: Request, res: Response) => {
        const { status } = req.body;
        const software = await SoftwareService.updateSoftwareStatus(req.params.id, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: `Software ${status} successfully`,
            data: software,
        });
    }),

    // ==================== TOGGLE LIKE ====================
    toggleLike: catchAsync(async (req: Request, res: Response) => {
        const userId = req.user?.userId || (req.user as any)?._id || (req.user as any)?.id;
        if (!userId) {
            throw new AppError(401, 'User ID not found in token');
        }
        const result = await SoftwareService.toggleLike(req.params.id, userId.toString());

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: result.liked ? 'Software liked' : 'Software unliked',
            data: result,
        });
    }),
};

export default SoftwareController;
