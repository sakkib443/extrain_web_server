// ===================================================================
// ExtraWeb Backend - Platform Model
// MongoDB Platform Schema
// ===================================================================

import { Schema, model } from 'mongoose';
import { IPlatform } from './platform.interface';

const platformSchema = new Schema<IPlatform>(
    {
        name: {
            type: String,
            required: [true, 'Platform name is required'],
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        icon: { type: String, default: '' },
        description: { type: String, maxlength: 500 },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        productCount: { type: Number, default: 0 },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

platformSchema.index({ slug: 1 });
platformSchema.index({ status: 1 });

// Auto-generate slug
platformSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    next();
});

export const Platform = model<IPlatform>('Platform', platformSchema);
