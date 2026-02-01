// ===================================================================
// ExtraWeb Backend - Software Model
// MongoDB Schema for Software Products
// Script/Plugin collection for the marketplace
// ===================================================================

import { Schema, model } from 'mongoose';
import { ISoftware, PLATFORM_OPTIONS, SOFTWARE_TYPE_OPTIONS } from './software.interface';

const softwareSchema = new Schema<ISoftware>(
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
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
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

        // ==================== Type & Access ====================
        softwareType: {
            type: String,
            enum: SOFTWARE_TYPE_OPTIONS,
            required: [true, 'Software type is required'],
        },
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

        // ==================== Licensing ====================
        licenseType: {
            type: String,
            enum: ['regular', 'extended'],
            default: 'regular',
        },
        regularLicensePrice: {
            type: Number,
            required: [true, 'Regular license price is required'],
            min: [0, 'Price cannot be negative'],
        },
        extendedLicensePrice: {
            type: Number,
            min: [0, 'Price cannot be negative'],
        },

        // ==================== Ratings & Sales ====================
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: { type: Number, default: 0 },
        salesCount: { type: Number, default: 0 },

        // ==================== Analytics & Engagement ====================
        viewCount: { type: Number, default: 0 },
        likeCount: { type: Number, default: 0 },
        likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

        // ==================== Details ====================
        version: {
            type: String,
            default: '1.0.0',
        },
        features: [{ type: String }],
        requirements: [{ type: String }],
        technologies: [{ type: String }],
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        longDescription: { type: String },
        changelog: { type: String },

        // ==================== Compatibility ====================
        browserCompatibility: [{ type: String }],
        softwareCompatibility: [{ type: String }],

        // ==================== Media ====================
        images: [{ type: String }],
        previewUrl: { type: String },
        videoUrl: { type: String },  // YouTube video URL
        downloadFile: {
            type: String,
            required: [true, 'Download file is required'],
        },
        documentationUrl: { type: String },

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
softwareSchema.index({ slug: 1 });
softwareSchema.index({ author: 1 });
softwareSchema.index({ category: 1 });
softwareSchema.index({ platform: 1 });
softwareSchema.index({ status: 1, isDeleted: 1 });
softwareSchema.index({ price: 1 });
softwareSchema.index({ rating: -1 });
softwareSchema.index({ salesCount: -1 });
softwareSchema.index({ viewCount: -1 });
softwareSchema.index({ likeCount: -1 });
softwareSchema.index({ title: 'text', description: 'text' });

// ==================== Pre-find Middleware ====================
softwareSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

softwareSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

// ==================== Auto-generate Slug ====================
softwareSchema.pre('save', function (next) {
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
softwareSchema.virtual('effectivePrice').get(function () {
    return this.offerPrice || this.price;
});

export const Software = model<ISoftware>('Software', softwareSchema);
