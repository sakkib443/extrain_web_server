// ===================================================================
// Extrain Web LMS - Blog Model
// Mongoose schema for Blog module
// ব্লগ মডিউলের Mongoose স্কিমা
// ===================================================================

import { Schema, model } from 'mongoose';
import { IBlog, BlogModel, IBlogComment, BlogCommentModel } from './blog.interface';

// ==================== Blog Schema ====================
const blogSchema = new Schema<IBlog, BlogModel>(
    {
        // Basic Info
        title: {
            type: String,
            required: [true, 'Blog title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        excerpt: {
            type: String,
            required: [true, 'Blog excerpt is required'],
            maxlength: [500, 'Excerpt cannot exceed 500 characters'],
        },
        excerptBn: {
            type: String,
            maxlength: [500, 'Bengali excerpt cannot exceed 500 characters'],
        },
        content: {
            type: String,
            required: [true, 'Blog content is required'],
        },
        contentBn: {
            type: String,
        },

        // Media
        thumbnail: {
            type: String,
            required: [true, 'Thumbnail image is required'],
        },
        images: [{
            type: String,
        }],
        videoUrl: {
            type: String,
        },

        // Category & Tags
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],

        // Author Info
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        authorRole: {
            type: String,
            enum: ['admin', 'mentor'],
            required: true,
        },

        // Status & Visibility
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPopular: {
            type: Boolean,
            default: false,
        },
        allowComments: {
            type: Boolean,
            default: true,
        },

        // Statistics
        totalViews: {
            type: Number,
            default: 0,
            min: 0,
        },
        likeCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        likedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        commentCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        shareCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Reading Info
        readingTime: {
            type: Number,
            default: 1,
            min: 1,
        },
        wordCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // SEO
        metaTitle: {
            type: String,
            maxlength: [70, 'Meta title cannot exceed 70 characters'],
        },
        metaDescription: {
            type: String,
            maxlength: [160, 'Meta description cannot exceed 160 characters'],
        },
        metaKeywords: [{
            type: String,
            trim: true,
        }],

        // Timestamps
        publishedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ==================== Indexes ====================
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isFeatured: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ totalViews: -1 });
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// ==================== Static Methods ====================
blogSchema.statics.isBlogExists = async function (id: string): Promise<boolean> {
    const blog = await this.findById(id);
    return !!blog;
};

blogSchema.statics.findBySlug = async function (slug: string): Promise<IBlog | null> {
    return this.findOne({ slug });
};

// ==================== Pre-save Hook ====================
blogSchema.pre('save', function (next) {
    // Calculate reading time (average 200 words per minute)
    if (this.content) {
        const wordCount = this.content.split(/\s+/).length;
        this.wordCount = wordCount;
        this.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

// ==================== Blog Comment Schema ====================
const blogCommentSchema = new Schema<IBlogComment, BlogCommentModel>(
    {
        blog: {
            type: Schema.Types.ObjectId,
            ref: 'Blog',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: 'BlogComment',
        },
        isApproved: {
            type: Boolean,
            default: true,
        },
        likeCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Comment indexes
blogCommentSchema.index({ blog: 1 });
blogCommentSchema.index({ user: 1 });
blogCommentSchema.index({ parentComment: 1 });

// Static method for comments
blogCommentSchema.statics.getCommentsByBlog = async function (blogId: string): Promise<IBlogComment[]> {
    return this.find({ blog: blogId, isApproved: true })
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 });
};

// ==================== Export Models ====================
export const Blog = model<IBlog, BlogModel>('Blog', blogSchema);
export const BlogComment = model<IBlogComment, BlogCommentModel>('BlogComment', blogCommentSchema);
