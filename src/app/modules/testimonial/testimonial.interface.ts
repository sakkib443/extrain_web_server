// ===================================================================
// Extrain Web - Testimonial Interface
// Testimonial module TypeScript interface definitions
// টেস্টিমোনিয়াল মডিউলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Testimonial Type - টেস্টিমোনিয়াল টাইপ
 */
export type TTestimonialType = 'testimonial' | 'review';

/**
 * Testimonial Status - টেস্টিমোনিয়াল স্ট্যাটাস
 */
export type TTestimonialStatus = 'pending' | 'approved' | 'rejected';

/**
 * ITestimonial - Main Testimonial Interface
 */
export interface ITestimonial {
    _id?: Types.ObjectId;

    // ==================== Basic Info ====================
    clientName: string;               // Client name (English)
    clientNameBn?: string;            // Client name (Bengali)
    companyName: string;              // Company name (English)
    companyNameBn?: string;           // Company name (Bengali)
    title: string;                    // Testimonial title (English)
    titleBn?: string;                 // Testimonial title (Bengali)

    // ==================== Type & Category ====================
    type: TTestimonialType;           // testimonial or review

    // ==================== Content ====================
    videoId: string;                  // YouTube video ID
    description?: string;             // Short description (English)
    descriptionBn?: string;           // Short description (Bengali)

    // ==================== Client Info ====================
    clientImage?: string;             // Client profile image
    clientDesignation?: string;       // Client designation
    clientDesignationBn?: string;     // Client designation (Bengali)
    rating?: number;                  // 1-5 star rating

    // ==================== Status ====================
    status: TTestimonialStatus;       // pending/approved/rejected
    isFeatured: boolean;              // Show on homepage
    order: number;                    // Display order

    // ==================== Timestamps ====================
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ITestimonialFilters - Query Filters
 */
export interface ITestimonialFilters {
    searchTerm?: string;
    type?: TTestimonialType;
    status?: TTestimonialStatus;
    isFeatured?: boolean;
}

/**
 * TestimonialModel - Mongoose Model Type
 */
export interface TestimonialModel extends Model<ITestimonial> {
    isTestimonialExists(id: string): Promise<boolean>;
}
