// ===================================================================
// MotionBoss LMS - Module Model
// MongoDB Module Schema with Mongoose
// ===================================================================

import { Schema, model } from 'mongoose';
import { IModule, ModuleModel } from './module.interface';

/**
 * Module Schema Definition
 */
const moduleSchema = new Schema<IModule, ModuleModel>(
    {
        course: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Module title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
        },
        order: {
            type: Number,
            required: [true, 'Module order is required'],
            min: [1, 'Order must be at least 1'],
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
    }
);

// ==================== Indexes ====================
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ title: 'text', titleBn: 'text' });

// ==================== Export Model ====================
export const Module = model<IModule, ModuleModel>('Module', moduleSchema);
