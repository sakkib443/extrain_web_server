// ===================================================================
// MotionBoss - Page Content Model
// Mongoose schema for dynamic page content
// ===================================================================

import { Schema, model } from 'mongoose';
import { IPageContent, PageContentModel } from './pageContent.interface';

const pageContentSchema = new Schema<IPageContent, PageContentModel>(
    {
        pageKey: {
            type: String,
            required: true,
            index: true
        },
        sectionKey: {
            type: String,
            required: true,
            index: true
        },
        content: {
            type: Schema.Types.Mixed,
            default: {}
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Compound unique index for pageKey + sectionKey
pageContentSchema.index({ pageKey: 1, sectionKey: 1 }, { unique: true });

// Static method to find by page and section
pageContentSchema.statics.findByPageAndSection = async function (
    pageKey: string,
    sectionKey: string
) {
    return this.findOne({ pageKey, sectionKey });
};

export const PageContent = model<IPageContent, PageContentModel>('PageContent', pageContentSchema);
