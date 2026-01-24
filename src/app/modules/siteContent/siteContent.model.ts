// ===================================================================
// Site Content Model
// MongoDB schema for editable website content
// ===================================================================

import { Schema, model } from 'mongoose';
import { ISiteContent, SiteContentModel } from './siteContent.interface';

const siteContentSchema = new Schema<ISiteContent, SiteContentModel>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        value: {
            type: String,
            required: true,
        },
        valueBn: {
            type: String,
        },
        type: {
            type: String,
            enum: ['text', 'html', 'image', 'link'],
            default: 'text',
        },
        section: {
            type: String,
            required: true,
            index: true,
        },
        label: {
            type: String,
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// Static method to find by key
siteContentSchema.statics.findByKey = async function (key: string) {
    return this.findOne({ key });
};

export const SiteContent = model<ISiteContent, SiteContentModel>('SiteContent', siteContentSchema);
