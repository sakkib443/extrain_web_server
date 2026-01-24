// ===================================================================
// MotionBoss LMS - Course Interface
// Course module TypeScript interface definitions
// কোর্স মডিউলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Course Type - কোর্সের ধরণ
 */
export type TCourseType = 'online' | 'offline' | 'recorded';

/**
 * Course Level - কোর্সের লেভেল
 */
export type TCourseLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Course Language - কোর্সের ভাষা
 */
export type TCourseLanguage = 'bangla' | 'english' | 'both';

/**
 * Course Status - কোর্সের স্ট্যাটাস
 */
export type TCourseStatus = 'draft' | 'published' | 'archived';

/**
 * ICourse - Main Course Interface
 * Database এ যে format এ course data save হবে
 */
export interface ICourse {
    _id?: Types.ObjectId;

    // ==================== Basic Info ====================
    title: string;                    // Course title (English)
    titleBn?: string;                 // Course title (Bengali) - Optional
    slug: string;                     // URL friendly slug
    description: string;              // Full description (English)
    descriptionBn?: string;           // Full description (Bengali) - Optional
    shortDescription?: string;        // Short summary
    shortDescriptionBn?: string;      // Short summary (Bengali)

    // ==================== Media ====================
    thumbnail: string;                // Course thumbnail image
    previewVideo?: string;            // Free preview video URL
    bannerImage?: string;             // Banner for course page

    // ==================== Category & Tags ====================
    category: Types.ObjectId;         // Reference to Category
    tags: string[];                   // Search tags


    // ==================== Pricing ====================
    price: number;                    // Regular price
    discountPrice?: number;           // Sale price
    currency: 'BDT' | 'USD';          // Currency
    isFree: boolean;                  // Is it a free course?

    // ==================== Course Details ====================
    courseType: TCourseType;          // Online/Offline/Recorded
    level: TCourseLevel;              // Difficulty level
    language: TCourseLanguage;        // Course language

    // ==================== Duration ====================
    totalDuration: number;            // Total duration in minutes
    totalLessons: number;             // Number of lessons
    totalModules: number;             // Number of modules/sections

    // ==================== Module & Lesson References ====================
    modules: Types.ObjectId[];        // Array of Module references
    lessons: Types.ObjectId[];        // Array of Lesson references

    // ==================== Content Info ====================
    features: string[];               // What's included
    requirements: string[];           // Prerequisites
    whatYouWillLearn: string[];       // Learning outcomes
    targetAudience: string[];         // Who this course is for

    // ==================== Status & Visibility ====================
    status: TCourseStatus;            // Draft/Published/Archived
    isFeatured: boolean;              // Show on homepage
    isPopular: boolean;               // Mark as popular

    // ==================== Statistics (Auto Updated) ====================
    totalEnrollments: number;         // Total students enrolled
    averageRating: number;            // Average review rating
    totalReviews: number;             // Number of reviews
    totalViews: number;               // Page views
    likeCount: number;                // Total likes
    likedBy: Types.ObjectId[];        // Users who liked

    // ==================== SEO ====================
    metaTitle?: string;
    metaDescription?: string;

    // ==================== Timestamps ====================
    publishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ICourseFilters - Query Filters
 * Course list filter করার জন্য
 */
export interface ICourseFilters {
    searchTerm?: string;
    category?: string;
    courseType?: TCourseType;
    level?: TCourseLevel;
    language?: TCourseLanguage;
    status?: TCourseStatus;
    isFeatured?: boolean;
    isFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
}

/**
 * ICourseResponse - API Response format
 */
export interface ICourseResponse {
    course: ICourse;
    lessons?: any[];  // Will be populated with lessons
}

/**
 * CourseModel - Mongoose Model Type
 */
export interface CourseModel extends Model<ICourse> {
    isCourseExists(id: string): Promise<boolean>;
    findBySlug(slug: string): Promise<ICourse | null>;
}
