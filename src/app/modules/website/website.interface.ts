// ===================================================================
// ExtraWeb Backend - Website Interface
// Website Product মডেলের TypeScript interface
// ThemeForest style website/template products
// ===================================================================

import { Types } from 'mongoose';

// Platform options enum
export type TPlatform = 'WordPress' | 'React' | 'Next.js' | 'PHP' | 'HTML/CSS' | 'Vue.js' | 'Angular' | 'Laravel' | 'Other';

export const PLATFORM_OPTIONS: TPlatform[] = [
    'WordPress', 'React', 'Next.js', 'PHP', 'HTML/CSS', 'Vue.js', 'Angular', 'Laravel', 'Other'
];

/**
 * IWebsite - Main product data structure
 * Website templates/themes that are sold on the marketplace
 */
export interface IWebsite {
    _id?: Types.ObjectId;

    // Basic Info
    title: string;
    slug: string;
    platform: TPlatform;             // Platform enum (WordPress, React etc.)
    category: Types.ObjectId;        // Category reference
    subCategory?: string;

    // Access Type
    accessType: 'free' | 'paid';

    // Pricing
    price: number;
    offerPrice?: number;

    // Ratings & Sales (real-time counters, default 0)
    rating: number;                  // Average rating (1-5)
    reviewCount: number;
    salesCount: number;
    viewCount: number;               // Total views
    likeCount: number;               // Total likes/loves
    likedBy?: Types.ObjectId[];       // Users who liked

    // Details
    features: string[];              // Feature list
    aiFeatures?: string[];           // Artificial Intelligence features
    technologies: string[];          // Tech stack used
    description: string;             // Short description
    longDescription?: string;        // Full description (markdown)

    // Media
    images: string[];                // Screenshot URLs
    previewUrl?: string;             // Live demo URL
    downloadFile: string;            // Secure file path/URL

    // Status
    status: 'pending' | 'approved' | 'rejected' | 'draft';
    isDeleted: boolean;
    isFeatured: boolean;

    // Dates
    publishDate?: Date;
    lastUpdate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IWebsiteFilters - Query filters for product listing
 */
export interface IWebsiteFilters {
    searchTerm?: string;
    category?: string;
    platform?: string;
    accessType?: 'free' | 'paid';
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    isFeatured?: boolean;
}

/**
 * IWebsiteQuery - Pagination and sorting options
 */
export interface IWebsiteQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

