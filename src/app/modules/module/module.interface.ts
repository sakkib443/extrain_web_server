// ===================================================================
// MotionBoss LMS - Module Interface
// Module module TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * IModule - Course Module Interface
 * Database এ যে format এ module data save হবে
 */
export interface IModule {
    _id?: Types.ObjectId;
    course: Types.ObjectId;           // Parent course
    title: string;                    // Module title (English)
    titleBn?: string;                 // Module title (Bengali) - Optional
    description?: string;             // Optional description
    order: number;                    // Order of this module in the course
    isPublished: boolean;             // Published/Draft status
    totalLessons?: number;            // Virtual or calculated field
    totalDuration?: number;           // Virtual or calculated field
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IModuleFilters - Query Filters
 */
export interface IModuleFilters {
    course?: string;
    searchTerm?: string;
    isPublished?: boolean;
}

/**
 * ModuleModel - Mongoose Model Type
 */
export interface ModuleModel extends Model<IModule> {
    // We can add static methods here if needed
}
