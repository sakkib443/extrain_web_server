// ===================================================================
// Site Content Interface
// Editable website content management
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Content Type - কন্টেন্টের ধরণ
 */
export type TContentType = 'text' | 'html' | 'image' | 'link';

/**
 * ISiteContent - Site Content Interface
 */
export interface ISiteContent {
    _id?: Types.ObjectId;

    // Unique identifier for the content
    key: string;                      // e.g., "hero.title", "hero.subtitle", "about.heading"

    // Content values
    value: string;                    // English content
    valueBn?: string;                 // Bengali content (optional)

    // Metadata
    type: TContentType;               // Content type
    section: string;                  // Section name (hero, about, features, etc.)
    label?: string;                   // Human-readable label for admin

    // Tracking
    lastUpdatedBy?: Types.ObjectId;   // Who updated this

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ISiteContentFilters - Query Filters
 */
export interface ISiteContentFilters {
    section?: string;
    type?: TContentType;
    key?: string;
}

/**
 * SiteContentModel - Mongoose Model Type
 */
export interface SiteContentModel extends Model<ISiteContent> {
    findByKey(key: string): Promise<ISiteContent | null>;
}
