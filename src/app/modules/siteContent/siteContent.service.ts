// ===================================================================
// Site Content Service
// Business logic for site content CRUD operations
// ===================================================================

import { Types } from 'mongoose';
import { SiteContent } from './siteContent.model';
import { ISiteContent, ISiteContentFilters } from './siteContent.interface';

/**
 * Get all site content
 */
const getAllContent = async (filters?: ISiteContentFilters) => {
    const query: any = {};

    if (filters?.section) {
        query.section = filters.section;
    }
    if (filters?.type) {
        query.type = filters.type;
    }
    if (filters?.key) {
        query.key = { $regex: filters.key, $options: 'i' };
    }

    const contents = await SiteContent.find(query).sort({ section: 1, key: 1 });
    return contents;
};

/**
 * Get content by key
 */
const getContentByKey = async (key: string) => {
    const content = await SiteContent.findByKey(key);
    return content;
};

/**
 * Get content by section
 */
const getContentBySection = async (section: string) => {
    const contents = await SiteContent.find({ section }).sort({ key: 1 });
    return contents;
};

/**
 * Get multiple contents by keys
 */
const getContentsByKeys = async (keys: string[]) => {
    const contents = await SiteContent.find({ key: { $in: keys } });
    // Convert to object with key as property
    const result: Record<string, ISiteContent> = {};
    contents.forEach(content => {
        result[content.key] = content;
    });
    return result;
};

/**
 * Create or update content (upsert)
 */
const upsertContent = async (contentData: Partial<ISiteContent>, userId?: string) => {
    const { key, value, valueBn, type, section, label } = contentData;

    if (!key) {
        throw new Error('Content key is required');
    }

    const updateData: any = {
        value,
        valueBn,
        type: type || 'text',
        section: section || key.split('.')[0],
        label,
    };

    if (userId) {
        updateData.lastUpdatedBy = new Types.ObjectId(userId);
    }

    const content = await SiteContent.findOneAndUpdate(
        { key },
        updateData,
        { upsert: true, new: true, runValidators: true }
    );

    return content;
};

/**
 * Bulk update contents
 */
const bulkUpdateContents = async (contents: Partial<ISiteContent>[], userId?: string) => {
    const results: ISiteContent[] = [];

    for (const content of contents) {
        if (content.key) {
            const updated = await upsertContent(content, userId);
            if (updated) {
                results.push(updated);
            }
        }
    }

    return results;
};

/**
 * Delete content by key
 */
const deleteContent = async (key: string) => {
    const result = await SiteContent.findOneAndDelete({ key });
    return result;
};

/**
 * Initialize default content (seed)
 */
const seedDefaultContent = async () => {
    const defaultContents: Partial<ISiteContent>[] = [
        // Hero Section
        { key: 'hero.badge', value: 'Learn Without Limits', valueBn: 'সীমাহীন শিখুন', section: 'hero', label: 'Hero Badge Text', type: 'text' },
        { key: 'hero.title', value: 'Launch Your Tech Career with Expert-Led Courses', valueBn: 'বিশেষজ্ঞ-নেতৃত্বাধীন কোর্সের মাধ্যমে আপনার প্রযুক্তি ক্যারিয়ার শুরু করুন', section: 'hero', label: 'Hero Title', type: 'text' },
        { key: 'hero.subtitle', value: 'Master in-demand skills with hands-on projects and earn certificates', valueBn: 'হাতে-কলমে প্রজেক্টের মাধ্যমে চাহিদাসম্পন্ন দক্ষতা অর্জন করুন', section: 'hero', label: 'Hero Subtitle', type: 'text' },

        // About Section
        { key: 'about.title', value: 'About Us', valueBn: 'আমাদের সম্পর্কে', section: 'about', label: 'About Title', type: 'text' },
        { key: 'about.description', value: 'We are committed to providing quality education', valueBn: 'আমরা মানসম্মত শিক্ষা প্রদানে প্রতিশ্রুতিবদ্ধ', section: 'about', label: 'About Description', type: 'text' },

        // Features
        { key: 'features.title', value: 'Why Choose Us', valueBn: 'কেন আমাদের বেছে নেবেন', section: 'features', label: 'Features Title', type: 'text' },
    ];

    for (const content of defaultContents) {
        await SiteContent.findOneAndUpdate(
            { key: content.key },
            content,
            { upsert: true }
        );
    }

    return { message: 'Default content seeded successfully' };
};

export const SiteContentService = {
    getAllContent,
    getContentByKey,
    getContentBySection,
    getContentsByKeys,
    upsertContent,
    bulkUpdateContents,
    deleteContent,
    seedDefaultContent,
};
