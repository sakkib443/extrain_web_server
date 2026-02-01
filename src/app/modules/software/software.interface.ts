// ===================================================================
// ExtraWeb Backend - Software Interface
// Software Product মডেলের TypeScript interface
// CodeCanyon style software/script products
// ===================================================================

import { Types } from 'mongoose';

/**
 * Platform Options - Technology/Framework
 */
export const PLATFORM_OPTIONS = [
    'WordPress',
    'PHP',
    'JavaScript',
    'Python',
    'React',
    'Next.js',
    'Vue.js',
    'Angular',
    'Node.js',
    'Laravel',
    'Django',
    'Flutter',
    'React Native',
    'Android',
    'iOS',
    'Unity',
    'HTML/CSS',
    'jQuery',
    'Bootstrap',
    'Tailwind CSS',
    'Other'
] as const;

export type TPlatform = typeof PLATFORM_OPTIONS[number];

/**
 * Software Type Options
 */
export const SOFTWARE_TYPE_OPTIONS = [
    'Plugin',
    'Script',
    'Application',
    'Tool',
    'Library',
    'Framework',
    'Extension',
    'Theme',
    'Template',
    'Component',
    'API',
    'SDK',
    'CLI Tool',
    'Desktop App',
    'Mobile App',
    'Other'
] as const;

export type TSoftwareType = typeof SOFTWARE_TYPE_OPTIONS[number];

/**
 * ISoftware - Main software product data structure
 * Software/Scripts that are sold on the marketplace
 */
export interface ISoftware {
    _id?: Types.ObjectId;

    // Basic Info
    title: string;
    slug: string;
    author: Types.ObjectId;          // User (seller) reference
    platform: TPlatform;             // Platform enum (PHP, React, etc.)
    category: Types.ObjectId;        // Category reference

    // Type & Access
    softwareType: TSoftwareType;     // Software type enum
    accessType: 'free' | 'paid';

    // Pricing
    price: number;
    offerPrice?: number;

    // Licensing
    licenseType: 'regular' | 'extended';
    regularLicensePrice: number;
    extendedLicensePrice?: number;

    // Ratings & Sales
    rating: number;                  // Average rating (1-5)
    reviewCount: number;
    salesCount: number;

    // Analytics & Engagement
    viewCount: number;               // Page view count
    likeCount: number;               // Total likes
    likedBy: Types.ObjectId[];       // Users who liked this software

    // Details
    version: string;                 // Software version (e.g., "1.0.0")
    features: string[];              // Feature list
    requirements: string[];          // System requirements
    technologies: string[];          // Tech stack used
    description: string;             // Short description
    longDescription?: string;        // Full description (markdown)
    changelog?: string;              // Version history

    // Compatibility
    browserCompatibility?: string[];
    softwareCompatibility?: string[];

    // Media
    images: string[];                // Screenshot URLs
    previewUrl?: string;             // Live demo URL
    videoUrl?: string;               // YouTube video URL
    downloadFile: string;            // Secure file path/URL
    documentationUrl?: string;       // Documentation link

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
 * ISoftwareFilters - Query filters for software listing
 */
export interface ISoftwareFilters {
    searchTerm?: string;
    category?: string;
    platform?: TPlatform;
    author?: string;
    accessType?: 'free' | 'paid';
    status?: string;
    softwareType?: TSoftwareType;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    isFeatured?: boolean;
}

/**
 * ISoftwareQuery - Pagination and sorting options
 */
export interface ISoftwareQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

