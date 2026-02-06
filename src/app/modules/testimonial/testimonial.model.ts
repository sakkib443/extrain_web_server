// ===================================================================
// Extrain Web - Testimonial Model
// Mongoose schema for Testimonial module
// টেস্টিমোনিয়াল মডিউলের Mongoose স্কিমা
// ===================================================================

import { Schema, model } from 'mongoose';
import { ITestimonial, TestimonialModel } from './testimonial.interface';

// ==================== Testimonial Schema ====================
const testimonialSchema = new Schema<ITestimonial, TestimonialModel>(
    {
        // Basic Info
        clientName: {
            type: String,
            required: [true, 'Client name is required'],
            trim: true,
            maxlength: [100, 'Client name cannot exceed 100 characters'],
        },
        clientNameBn: {
            type: String,
            trim: true,
            maxlength: [100, 'Bengali client name cannot exceed 100 characters'],
        },
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            maxlength: [150, 'Company name cannot exceed 150 characters'],
        },
        companyNameBn: {
            type: String,
            trim: true,
            maxlength: [150, 'Bengali company name cannot exceed 150 characters'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },

        // Type & Category
        type: {
            type: String,
            enum: ['testimonial', 'review'],
            default: 'testimonial',
        },

        // Content
        videoId: {
            type: String,
            required: [true, 'YouTube video ID is required'],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        descriptionBn: {
            type: String,
            maxlength: [500, 'Bengali description cannot exceed 500 characters'],
        },

        // Client Info
        clientImage: {
            type: String,
        },
        clientDesignation: {
            type: String,
            maxlength: [100, 'Designation cannot exceed 100 characters'],
        },
        clientDesignationBn: {
            type: String,
            maxlength: [100, 'Bengali designation cannot exceed 100 characters'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5,
        },

        // Status
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ==================== Indexes ====================
testimonialSchema.index({ type: 1 });
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ isFeatured: 1 });
testimonialSchema.index({ order: 1 });
testimonialSchema.index({ createdAt: -1 });

// ==================== Static Methods ====================
testimonialSchema.statics.isTestimonialExists = async function (id: string): Promise<boolean> {
    const testimonial = await this.findById(id);
    return !!testimonial;
};

// ==================== Export Model ====================
export const Testimonial = model<ITestimonial, TestimonialModel>('Testimonial', testimonialSchema);
