// ===================================================================
// Extrain Web LMS - Blog Interface
// Blog module TypeScript interface definitions
// ব্লগ মডিউলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Blog Status - ব্লগের স্ট্যাটাস
 */
export type TBlogStatus = 'draft' | 'published' | 'archived';

/**
 * IBlog - Main Blog Interface
 * Database এ যে format এ blog data save হবে
 */
export interface IBlog {
    _id?: Types.ObjectId;

    // ==================== Basic Info ====================
    title: string;                    // Blog title (English)
    titleBn?: string;                 // Blog title (Bengali) - Optional
    slug: string;                     // URL friendly slug
    excerpt: string;                  // Short summary/excerpt
    excerptBn?: string;               // Short summary (Bengali)
    content: string;                  // Full blog content (HTML/Markdown)
    contentBn?: string;               // Full content (Bengali)

    // ==================== Media ====================
    thumbnail: string;                // Featured image
    images?: string[];                // Additional images in content
    videoUrl?: string;                // Embedded video URL (YouTube, etc.)

    // ==================== Category & Tags ====================
    category: Types.ObjectId;         // Reference to Category
    tags: string[];                   // Search tags

    // ==================== Author Info ====================
    author: Types.ObjectId;           // Reference to User (admin/mentor)
    authorRole: 'admin' | 'mentor';   // Who wrote the blog

    // ==================== Status & Visibility ====================
    status: TBlogStatus;              // Draft/Published/Archived
    isFeatured: boolean;              // Show on homepage
    isPopular: boolean;               // Mark as popular
    allowComments: boolean;           // Enable/disable comments

    // ==================== Statistics (Auto Updated) ====================
    totalViews: number;               // Page views
    likeCount: number;                // Total likes
    likedBy: Types.ObjectId[];        // Users who liked
    commentCount: number;             // Number of comments
    shareCount: number;               // Number of shares

    // ==================== Reading Info ====================
    readingTime: number;              // Estimated reading time in minutes
    wordCount: number;                // Total word count

    // ==================== SEO ====================
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];

    // ==================== Timestamps ====================
    publishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IBlogComment - Blog Comment Interface
 * ব্লগ কমেন্ট ইন্টারফেস
 */
export interface IBlogComment {
    _id?: Types.ObjectId;
    blog: Types.ObjectId;             // Reference to Blog
    user: Types.ObjectId;             // Reference to User
    content: string;                  // Comment content
    parentComment?: Types.ObjectId;   // For nested comments/replies
    isApproved: boolean;              // Admin approval status
    likeCount: number;                // Comment likes
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IBlogFilters - Query Filters
 * Blog list filter করার জন্য
 */
export interface IBlogFilters {
    searchTerm?: string;
    category?: string;
    status?: TBlogStatus;
    author?: string;
    authorRole?: 'admin' | 'mentor';
    isFeatured?: boolean;
    isPopular?: boolean;
    tags?: string[];
}

/**
 * IBlogResponse - API Response format
 */
export interface IBlogResponse {
    blog: IBlog;
    relatedBlogs?: IBlog[];
}

/**
 * BlogModel - Mongoose Model Type
 */
export interface BlogModel extends Model<IBlog> {
    isBlogExists(id: string): Promise<boolean>;
    findBySlug(slug: string): Promise<IBlog | null>;
}

/**
 * BlogCommentModel - Mongoose Model Type for Comments
 */
export interface BlogCommentModel extends Model<IBlogComment> {
    getCommentsByBlog(blogId: string): Promise<IBlogComment[]>;
}
