// ===================================================================
// Extrain Web LMS - Blog Service
// Business logic for Blog module
// ব্লগ মডিউলের বিজনেস লজিক
// ===================================================================

import { Types } from 'mongoose';
import { Blog, BlogComment } from './blog.model';
import { IBlog, IBlogFilters, IBlogComment } from './blog.interface';
import AppError from '../../utils/AppError';
import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.module';

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

/**
 * Create a new blog
 * নতুন ব্লগ তৈরি করা
 */
const createBlog = async (payload: Partial<IBlog>, userId: string, userRole: string): Promise<IBlog> => {
    // Generate slug from title
    let slug = generateSlug(payload.title || '');

    // Check if slug already exists, if so append a number
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    while (existingBlog) {
        slug = `${generateSlug(payload.title || '')}-${counter}`;
        existingBlog = await Blog.findOne({ slug });
        counter++;
    }

    const blogData = {
        ...payload,
        slug,
        author: new Types.ObjectId(userId),
        authorRole: userRole as 'admin' | 'mentor',
    };

    const blog = await Blog.create(blogData);

    // Create notification for new blog
    if (blog.status === 'published') {
        const author = await User.findById(userId);
        if (author) {
            await NotificationService.createNotification({
                type: 'blog',
                title: 'New Blog Published',
                message: `${author.firstName} ${author.lastName} published a new blog: "${blog.title}"`,
                data: {
                    link: `/blog/${blog.slug}`,
                },
            });
        }
    }

    return blog;
};

/**
 * Get all blogs with filters and pagination
 * ফিল্টার ও পেজিনেশন সহ সব ব্লগ পাওয়া
 */
const getAllBlogs = async (
    filters: IBlogFilters,
    paginationOptions: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
) => {
    const {
        searchTerm,
        category,
        status,
        author,
        authorRole,
        isFeatured,
        isPopular,
        tags,
    } = filters;

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

    // Build query conditions
    const conditions: any[] = [];

    // Search term - search in title, content, tags
    if (searchTerm) {
        conditions.push({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { titleBn: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } },
                { excerpt: { $regex: searchTerm, $options: 'i' } },
                { tags: { $in: [new RegExp(searchTerm, 'i')] } },
            ],
        });
    }

    // Category filter
    if (category) {
        conditions.push({ category: category });
    }

    // Status filter
    if (status) {
        conditions.push({ status: status });
    }

    // Author filter
    if (author) {
        conditions.push({ author: author });
    }

    // Author role filter
    if (authorRole) {
        conditions.push({ authorRole: authorRole });
    }

    // Featured filter
    if (isFeatured !== undefined) {
        conditions.push({ isFeatured: isFeatured });
    }

    // Popular filter
    if (isPopular !== undefined) {
        conditions.push({ isPopular: isPopular });
    }

    // Tags filter
    if (tags && tags.length > 0) {
        conditions.push({ tags: { $in: tags } });
    }

    // Combine all conditions
    const whereCondition = conditions.length > 0 ? { $and: conditions } : {};

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const blogs = await Blog.find(whereCondition)
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean();

    // Get total count
    const total = await Blog.countDocuments(whereCondition);

    return {
        data: blogs,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get single blog by ID
 * ID দিয়ে একটি ব্লগ পাওয়া
 */
const getBlogById = async (id: string): Promise<IBlog | any | null> => {
    const blog = await Blog.findById(id)
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar email')
        .lean();

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    return blog;
};

/**
 * Get blog by slug (public access)
 * Slug দিয়ে ব্লগ পাওয়া (public access এর জন্য)
 */
const getBlogBySlug = async (slug: string): Promise<IBlog | any | null> => {
    const blog = await Blog.findOne({ slug, status: 'published' })
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .lean();

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    // Increment view count
    await Blog.findByIdAndUpdate(blog._id, { $inc: { totalViews: 1 } });

    // Get related blogs
    const relatedBlogs = await Blog.find({
        _id: { $ne: blog._id },
        status: 'published',
        $or: [
            { category: blog.category },
            { tags: { $in: blog.tags } },
        ],
    })
        .populate('author', 'firstName lastName avatar')
        .limit(4)
        .lean();

    return {
        ...blog,
        relatedBlogs,
    };
};

/**
 * Update blog
 * ব্লগ আপডেট করা
 */
const updateBlog = async (
    id: string,
    payload: Partial<IBlog>,
    userId: string,
    userRole: string
): Promise<IBlog | null> => {
    const blog = await Blog.findById(id);

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== userId && userRole !== 'admin') {
        throw new AppError(403, 'You are not authorized to update this blog');
    }

    // If title is being updated, update slug too
    if (payload.title && payload.title !== blog.title) {
        let newSlug = generateSlug(payload.title);
        const existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
        if (existingBlog) {
            newSlug = `${newSlug}-${Date.now()}`;
        }
        payload.slug = newSlug;
    }

    // Set publishedAt if status is being changed to published
    if (payload.status === 'published' && blog.status !== 'published') {
        payload.publishedAt = new Date();
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).populate('category', 'name nameEn icon').populate('author', 'firstName lastName avatar');

    return updatedBlog;
};

/**
 * Delete blog
 * ব্লগ ডিলিট করা
 */
const deleteBlog = async (id: string, userId: string, userRole: string): Promise<IBlog | null> => {
    const blog = await Blog.findById(id);

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== userId && userRole !== 'admin') {
        throw new AppError(403, 'You are not authorized to delete this blog');
    }

    // Delete all comments associated with the blog
    await BlogComment.deleteMany({ blog: id });

    const deletedBlog = await Blog.findByIdAndDelete(id);
    return deletedBlog;
};

/**
 * Get featured blogs
 * ফিচার্ড ব্লগ পাওয়া
 */
const getFeaturedBlogs = async (limit: number = 6): Promise<IBlog[]> => {
    const blogs = await Blog.find({ isFeatured: true, status: 'published' })
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .sort({ publishedAt: -1 })
        .limit(limit);

    return blogs;
};

/**
 * Get popular blogs
 * জনপ্রিয় ব্লগ পাওয়া (by views)
 */
const getPopularBlogs = async (limit: number = 6): Promise<IBlog[]> => {
    const blogs = await Blog.find({ status: 'published' })
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .sort({ totalViews: -1, likeCount: -1 })
        .limit(limit);

    return blogs;
};

/**
 * Get recent blogs
 * সাম্প্রতিক ব্লগ পাওয়া
 */
const getRecentBlogs = async (limit: number = 6): Promise<IBlog[]> => {
    const blogs = await Blog.find({ status: 'published' })
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .sort({ publishedAt: -1 })
        .limit(limit);

    return blogs;
};

/**
 * Get blogs by category
 * ক্যাটাগরি অনুযায়ী ব্লগ পাওয়া
 */
const getBlogsByCategory = async (
    categoryId: string,
    paginationOptions: { page?: number; limit?: number }
) => {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ category: categoryId, status: 'published' })
        .populate('category', 'name nameEn icon')
        .populate('author', 'firstName lastName avatar')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Blog.countDocuments({ category: categoryId, status: 'published' });

    return {
        data: blogs,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get blogs by author
 * লেখক অনুযায়ী ব্লগ পাওয়া
 */
const getBlogsByAuthor = async (
    authorId: string,
    paginationOptions: { page?: number; limit?: number },
    includeAll: boolean = false
) => {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const condition = includeAll
        ? { author: authorId }
        : { author: authorId, status: 'published' };

    const blogs = await Blog.find(condition)
        .populate('category', 'name nameEn icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Blog.countDocuments(condition);

    return {
        data: blogs,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Toggle like for a blog
 * ব্লগে লাইক টগল করা
 */
const toggleLike = async (id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> => {
    const blog = await Blog.findById(id);

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const likedBy = blog.likedBy || [];
    const isAlreadyLiked = likedBy.some(likedUserId => likedUserId.equals(userObjectId));

    if (isAlreadyLiked) {
        // Unlike
        await Blog.findByIdAndUpdate(id, {
            $pull: { likedBy: userObjectId },
            $inc: { likeCount: -1 }
        });

        const updated = await Blog.findById(id).select('likeCount');
        return { isLiked: false, likeCount: Math.max(0, updated?.likeCount || 0) };
    } else {
        // Like
        await Blog.findByIdAndUpdate(id, {
            $addToSet: { likedBy: userObjectId },
            $inc: { likeCount: 1 }
        });

        const updated = await Blog.findById(id).select('likeCount');
        return { isLiked: true, likeCount: updated?.likeCount || 0 };
    }
};

/**
 * Increment share count
 * শেয়ার কাউন্ট বাড়ানো
 */
const incrementShareCount = async (id: string): Promise<void> => {
    await Blog.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });
};

// ==================== Comment Methods ====================

/**
 * Add comment to blog
 * ব্লগে কমেন্ট করা
 */
const addComment = async (
    blogId: string,
    userId: string,
    content: string,
    parentCommentId?: string
): Promise<IBlogComment> => {
    const blog = await Blog.findById(blogId);

    if (!blog) {
        throw new AppError(404, 'Blog not found');
    }

    if (!blog.allowComments) {
        throw new AppError(400, 'Comments are disabled for this blog');
    }

    const commentData: Partial<IBlogComment> = {
        blog: new Types.ObjectId(blogId),
        user: new Types.ObjectId(userId),
        content,
    };

    if (parentCommentId) {
        commentData.parentComment = new Types.ObjectId(parentCommentId);
    }

    const comment = await BlogComment.create(commentData);

    // Update comment count
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentCount: 1 } });

    // Populate user info
    await comment.populate('user', 'firstName lastName avatar');

    return comment;
};

/**
 * Get comments for a blog
 * ব্লগের কমেন্ট পাওয়া
 */
const getComments = async (blogId: string): Promise<IBlogComment[]> => {
    const comments = await BlogComment.find({ blog: blogId, isApproved: true, parentComment: { $exists: false } })
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
            const replies = await BlogComment.find({ parentComment: comment._id, isApproved: true })
                .populate('user', 'firstName lastName avatar')
                .sort({ createdAt: 1 });

            return {
                ...comment.toObject(),
                replies,
            };
        })
    );

    return commentsWithReplies as any;
};

/**
 * Delete comment
 * কমেন্ট ডিলিট করা
 */
const deleteComment = async (
    commentId: string,
    userId: string,
    userRole: string
): Promise<void> => {
    const comment = await BlogComment.findById(commentId);

    if (!comment) {
        throw new AppError(404, 'Comment not found');
    }

    // Check if user is the commenter or admin
    if (comment.user.toString() !== userId && userRole !== 'admin') {
        throw new AppError(403, 'You are not authorized to delete this comment');
    }

    // Delete replies too
    await BlogComment.deleteMany({ parentComment: commentId });
    await BlogComment.findByIdAndDelete(commentId);

    // Update comment count
    await Blog.findByIdAndUpdate(comment.blog, { $inc: { commentCount: -1 } });
};

export const BlogService = {
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
