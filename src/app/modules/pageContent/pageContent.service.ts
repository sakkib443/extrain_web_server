// ===================================================================
// MotionBoss - Page Content Service
// Business logic for page content management
// ===================================================================

import { Types } from 'mongoose';
import { IPageContent, PAGE_DEFINITIONS } from './pageContent.interface';
import { PageContent } from './pageContent.model';

/**
 * Get all page definitions (structure only, no content)
 */
const getPageDefinitions = () => {
    return PAGE_DEFINITIONS;
};

/**
 * Get content for a specific page section
 */
const getPageSectionContent = async (
    pageKey: string,
    sectionKey: string
): Promise<IPageContent | null> => {
    let content = await PageContent.findByPageAndSection(pageKey, sectionKey);

    // If doesn't exist, create with empty content
    if (!content) {
        content = await PageContent.create({
            pageKey,
            sectionKey,
            content: {},
            isActive: true
        });
    }

    return content;
};

/**
 * Get all content for a specific page
 */
const getPageContent = async (pageKey: string): Promise<IPageContent[]> => {
    const contents = await PageContent.find({ pageKey });
    return contents;
};

/**
 * Get all sections content for a page (with structure)
 */
const getPageWithSections = async (pageKey: string) => {
    const pageDef = PAGE_DEFINITIONS.find(p => p.pageKey === pageKey);
    if (!pageDef) return null;

    // Get all existing content for this page
    const contents = await PageContent.find({ pageKey });

    // Map sections with their content
    const sectionsWithContent = pageDef.sections.map(section => {
        const existingContent = contents.find(c => c.sectionKey === section.sectionKey);
        return {
            ...section,
            savedContent: existingContent?.content || {},
            contentId: existingContent?._id || null,
            isActive: existingContent?.isActive ?? true,
            updatedAt: existingContent?.updatedAt || null
        };
    });

    return {
        ...pageDef,
        sections: sectionsWithContent
    };
};

/**
 * Update content for a specific page section
 */
const updatePageSectionContent = async (
    pageKey: string,
    sectionKey: string,
    content: Record<string, unknown>,
    userId?: Types.ObjectId
): Promise<IPageContent | null> => {
    const result = await PageContent.findOneAndUpdate(
        { pageKey, sectionKey },
        {
            $set: {
                content,
                lastUpdatedBy: userId
            }
        },
        { new: true, upsert: true }
    );

    return result;
};

/**
 * Update multiple sections for a page at once
 */
const updateMultipleSections = async (
    pageKey: string,
    sections: Array<{ sectionKey: string; content: Record<string, unknown> }>,
    userId?: Types.ObjectId
): Promise<IPageContent[]> => {
    const results: IPageContent[] = [];

    for (const section of sections) {
        const result = await PageContent.findOneAndUpdate(
            { pageKey, sectionKey: section.sectionKey },
            {
                $set: {
                    content: section.content,
                    lastUpdatedBy: userId
                }
            },
            { new: true, upsert: true }
        );

        if (result) {
            results.push(result);
        }
    }

    return results;
};

/**
 * Toggle section active status
 */
const toggleSectionActive = async (
    pageKey: string,
    sectionKey: string
): Promise<IPageContent | null> => {
    const existing = await PageContent.findOne({ pageKey, sectionKey });
    if (!existing) return null;

    existing.isActive = !existing.isActive;
    await existing.save();

    return existing;
};

/**
 * Get all pages with their content count
 */
const getAllPagesOverview = async () => {
    const overview = await Promise.all(
        PAGE_DEFINITIONS.map(async (page) => {
            const contentCount = await PageContent.countDocuments({ pageKey: page.pageKey });
            const totalSections = page.sections.length;

            return {
                pageKey: page.pageKey,
                pageName: page.pageName,
                pageNameBn: page.pageNameBn,
                icon: page.icon,
                route: page.route,
                totalSections,
                completedSections: contentCount,
                progress: Math.round((contentCount / totalSections) * 100)
            };
        })
    );

    return overview;
};

/**
 * Get public content for frontend display
 */
const getPublicPageContent = async (pageKey: string): Promise<Record<string, unknown>> => {
    const contents = await PageContent.find({ pageKey, isActive: true });

    // Convert to object with sectionKey as key
    const result: Record<string, unknown> = {};
    contents.forEach(content => {
        result[content.sectionKey] = content.content;
    });

    return result;
};

export const PageContentService = {
    getPageDefinitions,
    getPageSectionContent,
    getPageContent,
    getPageWithSections,
    updatePageSectionContent,
    updateMultipleSections,
    toggleSectionActive,
    getAllPagesOverview,
    getPublicPageContent
};
