// ===================================================================
// MotionBoss LMS - Course Controller
// HTTP request handlers for Course module
// কোর্স মডিউলের HTTP রিকোয়েস্ট হ্যান্ডলার
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { CourseService } from './course.service';
import { ICourseFilters } from './course.interface';
import AppError from '../../utils/AppError';
import { Enrollment } from '../enrollment/enrollment.model';

/**
 * Create a new course
 * POST /api/courses
 */
const createCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const course = await CourseService.createCourse(req.body);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all courses with filters
 * GET /api/courses
 */
const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            searchTerm,
            category,
            courseType,
            level,
            language,
            status,
            isFeatured,
            isFree,
            minPrice,
            maxPrice,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        // Build filters
        const filters: ICourseFilters = {};

        if (searchTerm) filters.searchTerm = searchTerm as string;
        if (category) filters.category = category as string;
        if (courseType) filters.courseType = courseType as any;
        if (level) filters.level = level as any;
        if (language) filters.language = language as any;
        if (status) filters.status = status as any;
        if (isFeatured === 'true') filters.isFeatured = true;
        if (isFeatured === 'false') filters.isFeatured = false;
        if (isFree === 'true') filters.isFree = true;
        if (isFree === 'false') filters.isFree = false;
        if (minPrice) filters.minPrice = Number(minPrice);
        if (maxPrice) filters.maxPrice = Number(maxPrice);

        // Pagination options
        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            sortBy: (sortBy as string) || 'createdAt',
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        };

        const result = await CourseService.getAllCourses(filters, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single course by ID
 * GET /api/courses/:id
 */
const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const course = await CourseService.getCourseById(id);

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && course.likedBy?.some((id: any) => id.toString() === userId);

        res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: { ...JSON.parse(JSON.stringify(course)), isLiked: !!isLiked },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get course by slug (public)
 * GET /api/courses/slug/:slug
 */
const getCourseBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        const course = await CourseService.getCourseBySlug(slug);

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && course.likedBy?.some((id: any) => id.toString() === userId);

        res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: { ...JSON.parse(JSON.stringify(course)), isLiked: !!isLiked },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update course
 * PATCH /api/courses/:id
 */
const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const course = await CourseService.updateCourse(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete course
 * DELETE /api/courses/:id
 */
const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await CourseService.deleteCourse(id);

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get featured courses
 * GET /api/courses/featured
 */
const getFeaturedCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const courses = await CourseService.getFeaturedCourses(limit);

        res.status(200).json({
            success: true,
            message: 'Featured courses retrieved successfully',
            data: courses,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get popular courses
 * GET /api/courses/popular
 */
const getPopularCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const courses = await CourseService.getPopularCourses(limit);

        res.status(200).json({
            success: true,
            message: 'Popular courses retrieved successfully',
            data: courses,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get courses by category
 * GET /api/courses/category/:categoryId
 */
const getCoursesByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoryId } = req.params;
        const { page, limit } = req.query;

        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
        };

        const result = await CourseService.getCoursesByCategory(categoryId, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Courses by category retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get full course content for enrolled student
 * GET /api/courses/:id/content
 */
// GET /api/courses/:id/content (Private - Enrolled Students Only)
const getCourseContentForStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Verify enrollment
        const enrolled = await Enrollment.findOne({
            student: userId,
            course: id,
            status: { $in: ['active', 'completed'] }
        });

        if (!enrolled) {
            throw new AppError(403, 'You are not enrolled in this course');
        }

        const course = await CourseService.getCourseContentForStudent(id);

        res.status(200).json({
            success: true,
            message: 'Course content retrieved successfully',
            data: course,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Sync all course statistics
 * POST /api/courses/sync-stats
 */
const syncAllCourseStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await CourseService.syncAllCourseStats();

        res.status(200).json({
            success: true,
            message: 'All course statistics synced successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle like for a course
 * POST /api/courses/:id/toggle-like
 */
const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || (req.user as any)?._id || (req.user as any)?.id;
        if (!userId) {
            throw new AppError(401, 'User ID not found in token');
        }
        const result = await CourseService.toggleLike(id, userId.toString());

        res.status(200).json({
            success: true,
            message: result.isLiked ? 'Course liked' : 'Course unliked',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const CourseController = {
    createCourse,
    getAllCourses,
    getCourseById,
    getCourseBySlug,
    updateCourse,
    deleteCourse,
    getFeaturedCourses,
    getPopularCourses,
    getCoursesByCategory,
    getCourseContentForStudent,
    syncAllCourseStats,
    toggleLike,
};
