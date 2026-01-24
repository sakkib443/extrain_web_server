// ===================================================================
// ExtraWeb Backend - Website Model
// MongoDB Schema for Website Products
// Main product collection for the marketplace
// ===================================================================

import { Schema, model } from 'mongoose';
import { IWebsite, PLATFORM_OPTIONS } from './website.interface';

const websiteSchema = new Schema<IWebsite>(
    {
        // ==================== Basic Info ====================
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        platform: {
            type: String,
            enum: PLATFORM_OPTIONS,
            required: [true, 'Platform is required'],
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        subCategory: { type: String },

        // ==================== Access Type ====================
        accessType: {
            type: String,
            enum: ['free', 'paid'],
            default: 'paid',
        },

        // ==================== Pricing ====================
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        offerPrice: {
            type: Number,
            min: [0, 'Offer price cannot be negative'],
        },

        // ==================== Ratings & Sales (Real-time counters) ====================
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: { type: Number, default: 0 },
        salesCount: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
        likeCount: { type: Number, default: 0 },
        likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

        // ==================== Details ====================
        features: [{ type: String }],
        technologies: [{ type: String }],
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        longDescription: { type: String },

        // ==================== Media ====================
        images: [{ type: String }],
        previewUrl: { type: String },
        downloadFile: {
            type: String,
            required: [true, 'Download file is required'],
        },

        // ==================== Status ====================
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'draft'],
            default: 'pending',
        },
        isDeleted: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },

        // ==================== Dates ====================
        publishDate: { type: Date },
        lastUpdate: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// ==================== Indexes ====================
websiteSchema.index({ slug: 1 });
websiteSchema.index({ category: 1 });
websiteSchema.index({ platform: 1 });
websiteSchema.index({ status: 1, isDeleted: 1 });
websiteSchema.index({ price: 1 });
websiteSchema.index({ rating: -1 });
websiteSchema.index({ salesCount: -1 });
websiteSchema.index({ title: 'text', description: 'text' });

// ==================== Pre-find Middleware ====================
websiteSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

websiteSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

// ==================== Auto-generate Slug ====================
websiteSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            + '-' + Date.now();
    }
    next();
});

// ==================== Virtual for effective price ====================
websiteSchema.virtual('effectivePrice').get(function () {
    return this.offerPrice || this.price;
});

export const Website = model<IWebsite>('Website', websiteSchema);

