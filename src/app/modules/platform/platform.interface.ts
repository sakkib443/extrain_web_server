// ===================================================================
// ExtraWeb Backend - Platform Interface
// Platform মডেলের TypeScript interface
// ===================================================================

import { Types } from 'mongoose';

/**
 * IPlatform - Platform data structure
 * Product platforms (WordPress, React, MERN, PHP etc.)
 */
export interface IPlatform {
    _id?: Types.ObjectId;
    name: string;           // Platform name (e.g., "WordPress")
    slug: string;           // URL slug (e.g., "wordpress")
    icon?: string;          // Platform icon
    description?: string;   // Platform description
    status: 'active' | 'inactive';
    productCount: number;   // Products using this platform
    order: number;          // Display order
    createdAt?: Date;
    updatedAt?: Date;
}
