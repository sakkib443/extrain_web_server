// ===================================================================
// Extrain Web - Testimonial Controller
// HTTP request handlers for Testimonial module
// টেস্টিমোনিয়াল মডিউলের HTTP request handlers
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { TestimonialService } from './testimonial.service';
import { ITestimonialFilters } from './testimonial.interface';

// ==================== Create Testimonial ====================
const createTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await TestimonialService.createTestimonial(req.body);

        res.status(201).json({
            success: true,
            message: 'Testimonial created successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Get All Testimonials (Admin) ====================
const getAllTestimonials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            searchTerm,
            type,
            status,
            isFeatured,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        // Build filters
        const filters: ITestimonialFilters = {};
        if (searchTerm) filters.searchTerm = searchTerm as string;
        if (type) filters.type = type as any;
        if (status) filters.status = status as any;
        if (isFeatured === 'true') filters.isFeatured = true;
        if (isFeatured === 'false') filters.isFeatured = false;

        // Pagination options
        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            sortBy: (sortBy as string) || 'order',
            sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
        };

        const result = await TestimonialService.getAllTestimonials(filters, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Testimonials retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Get Approved Testimonials (Public) ====================
const getApprovedTestimonials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as string | undefined;
        const result = await TestimonialService.getApprovedTestimonials(type);

        res.status(200).json({
            success: true,
            message: 'Testimonials retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Get Single Testimonial ====================
const getSingleTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await TestimonialService.getSingleTestimonial(id);

        res.status(200).json({
            success: true,
            message: 'Testimonial retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Update Testimonial ====================
const updateTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await TestimonialService.updateTestimonial(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Testimonial updated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Delete Testimonial ====================
const deleteTestimonial = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await TestimonialService.deleteTestimonial(id);

        res.status(200).json({
            success: true,
            message: 'Testimonial deleted successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Update Status ====================
const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await TestimonialService.updateStatus(id, status);

        res.status(200).json({
            success: true,
            message: 'Testimonial status updated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Toggle Featured ====================
const toggleFeatured = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await TestimonialService.toggleFeatured(id);

        res.status(200).json({
            success: true,
            message: 'Testimonial featured status toggled successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const TestimonialController = {
    createTestimonial,
    getAllTestimonials,
    getApprovedTestimonials,
    getSingleTestimonial,
    updateTestimonial,
    deleteTestimonial,
    updateStatus,
    toggleFeatured,
};
