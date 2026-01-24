// ===================================================================
// Extrain Web LMS - Blog Controller
// HTTP request handlers for Blog module
// ব্লগ মডিউলের HTTP রিকোয়েস্ট হ্যান্ডলার
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { BlogService } from './blog.service';
import { IBlogFilters } from './blog.interface';
import AppError from '../../utils/AppError';

/**
 * Create a new blog
 * POST /api/blogs
 */
const createBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new AppError(401, 'User not authenticated');
        }

        const blog = await BlogService.createBlog(req.body, userId, userRole);

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: blog,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all blogs with filters
 * GET /api/blogs
 */
const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            searchTerm,
            category,
            status,
            author,
            authorRole,
            isFeatured,
            isPopular,
            tags,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        // Build filters
        const filters: IBlogFilters = {};

        if (searchTerm) filters.searchTerm = searchTerm as string;
        if (category) filters.category = category as string;
        if (status) filters.status = status as any;
        if (author) filters.author = author as string;
        if (authorRole) filters.authorRole = authorRole as any;
        if (isFeatured === 'true') filters.isFeatured = true;
        if (isFeatured === 'false') filters.isFeatured = false;
        if (isPopular === 'true') filters.isPopular = true;
        if (isPopular === 'false') filters.isPopular = false;
        if (tags) filters.tags = (tags as string).split(',');

        // Pagination options
        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
            sortBy: (sortBy as string) || 'createdAt',
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        };

        const result = await BlogService.getAllBlogs(filters, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Blogs retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single blog by ID
 * GET /api/blogs/:id
 */
const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const blog = await BlogService.getBlogById(id);

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && blog.likedBy?.some((id: any) => id.toString() === userId);

        res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully',
            data: { ...JSON.parse(JSON.stringify(blog)), isLiked: !!isLiked },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get blog by slug (public)
 * GET /api/blogs/slug/:slug
 */
const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        const blog = await BlogService.getBlogBySlug(slug);

        // Check if user has liked
        const userId = req.user?.userId;
        const isLiked = userId && blog.likedBy?.some((id: any) => id.toString() === userId);

        res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully',
            data: { ...JSON.parse(JSON.stringify(blog)), isLiked: !!isLiked },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update blog
 * PATCH /api/blogs/:id
 */
const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new AppError(401, 'User not authenticated');
        }

        const blog = await BlogService.updateBlog(id, req.body, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            data: blog,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete blog
 * DELETE /api/blogs/:id
 */
const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new AppError(401, 'User not authenticated');
        }

        await BlogService.deleteBlog(id, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get featured blogs
 * GET /api/blogs/featured
 */
const getFeaturedBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const blogs = await BlogService.getFeaturedBlogs(limit);

        res.status(200).json({
            success: true,
            message: 'Featured blogs retrieved successfully',
            data: blogs,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get popular blogs
 * GET /api/blogs/popular
 */
const getPopularBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const blogs = await BlogService.getPopularBlogs(limit);

        res.status(200).json({
            success: true,
            message: 'Popular blogs retrieved successfully',
            data: blogs,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get recent blogs
 * GET /api/blogs/recent
 */
const getRecentBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const blogs = await BlogService.getRecentBlogs(limit);

        res.status(200).json({
            success: true,
            message: 'Recent blogs retrieved successfully',
            data: blogs,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get blogs by category
 * GET /api/blogs/category/:categoryId
 */
const getBlogsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoryId } = req.params;
        const { page, limit } = req.query;

        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
        };

        const result = await BlogService.getBlogsByCategory(categoryId, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Blogs by category retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get blogs by author
 * GET /api/blogs/author/:authorId
 */
const getBlogsByAuthor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { authorId } = req.params;
        const { page, limit, all } = req.query;
        const currentUserId = req.user?.userId;

        const paginationOptions = {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10,
        };

        // Only show all blogs (including unpublished) if viewing own blogs
        const includeAll = all === 'true' && currentUserId === authorId;

        const result = await BlogService.getBlogsByAuthor(authorId, paginationOptions, includeAll);

        res.status(200).json({
            success: true,
            message: 'Blogs by author retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle like for a blog
 * POST /api/blogs/:id/toggle-like
 */
const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError(401, 'User ID not found in token');
        }

        const result = await BlogService.toggleLike(id, userId);

        res.status(200).json({
            success: true,
            message: result.isLiked ? 'Blog liked' : 'Blog unliked',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Increment share count
 * POST /api/blogs/:id/share
 */
const incrementShareCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await BlogService.incrementShareCount(id);

        res.status(200).json({
            success: true,
            message: 'Share count incremented',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add comment to blog
 * POST /api/blogs/:id/comments
 */
const addComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { content, parentComment } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            throw new AppError(401, 'User not authenticated');
        }

        const comment = await BlogService.addComment(id, userId, content, parentComment);

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: comment,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get comments for a blog
 * GET /api/blogs/:id/comments
 */
const getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const comments = await BlogService.getComments(id);

        res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            data: comments,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete comment
 * DELETE /api/blogs/comments/:commentId
 */
const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            throw new AppError(401, 'User not authenticated');
        }

        await BlogService.deleteComment(commentId, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const BlogController = {
    createBlog,
    getAllBlogs,
    getBlogById,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    getFeaturedBlogs,
    getPopularBlogs,
    getRecentBlogs,
    getBlogsByCategory,
    getBlogsByAuthor,
    toggleLike,
    incrementShareCount,
    addComment,
    getComments,
    deleteComment,
};
