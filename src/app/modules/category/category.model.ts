// ===================================================================
// ExtraWeb Backend - Category Model
// MongoDB Category Schema
// ===================================================================

import { Schema, model } from 'mongoose';
import { ICategory } from './category.interface';

/**
 * Category Schema
 * Product categories (Ecommerce, Blog, LMS, Portfolio etc.)
 */
const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        icon: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: '',
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        type: {
            type: String,
            enum: ['course', 'website', 'software'],
            default: 'course',
        },
        productCount: {
            type: Number,
            default: 0,
        },
        order: {
            type: Number,
            default: 0,
        },
        isParent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ order: 1 });

// Pre-save: Generate slug from name
categorySchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export const Category = model<ICategory>('Category', categorySchema);
