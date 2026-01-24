// ===================================================================
// ExtraWeb Backend - Category Interface
// Category মডেলের TypeScript interface
// ===================================================================

import { Types } from 'mongoose';

/**
 * ICategory - Category data structure
 * Website/Software এর categories (Ecommerce, Blog, LMS etc)
 */
export interface ICategory {
    _id?: Types.ObjectId;
    name: string;           // Category name (e.g., "Ecommerce")
    slug: string;           // URL-friendly slug (e.g., "ecommerce")
    description?: string;   // Category description
    icon?: string;          // Icon class or URL
    image?: string;         // Category thumbnail image
    parentCategory?: Types.ObjectId | ICategory | null;  // Parent category reference
    status: 'active' | 'inactive';
    type: 'course' | 'website' | 'software'; // Type of category
    productCount: number;   // Total products in this category
    order: number;          // Display order
    isParent: boolean;      // Is this a parent category?
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ICategoryFilters - Query filters for categories
 */
export interface ICategoryFilters {
    searchTerm?: string;
    status?: 'active' | 'inactive';
}
