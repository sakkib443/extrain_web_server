// ===================================================================
// MotionBoss - Page Content Controller
// HTTP request handlers for page content management
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { PageContentService } from './pageContent.service';

/**
 * Get all page definitions (structure only)
 */
const getPageDefinitions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = PageContentService.getPageDefinitions();

        res.status(200).json({
            success: true,
            message: 'Page definitions retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all pages overview (with progress)
 */
const getAllPagesOverview = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await PageContentService.getAllPagesOverview();

        res.status(200).json({
            success: true,
            message: 'Pages overview retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single page with all sections and content
 */
const getPageWithSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey } = req.params;
        const result = await PageContentService.getPageWithSections(pageKey);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Page not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Page content retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific section content
 */
const getSectionContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey, sectionKey } = req.params;
        const result = await PageContentService.getPageSectionContent(pageKey, sectionKey);

        res.status(200).json({
            success: true,
            message: 'Section content retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a specific section content
 */
const updateSectionContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey, sectionKey } = req.params;
        const { content } = req.body;

        const result = await PageContentService.updatePageSectionContent(
            pageKey,
            sectionKey,
            content
        );

        res.status(200).json({
            success: true,
            message: 'Section content updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update multiple sections at once
 */
const updateMultipleSections = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey } = req.params;
        const { sections } = req.body;

        const result = await PageContentService.updateMultipleSections(pageKey, sections);

        res.status(200).json({
            success: true,
            message: 'Sections updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle section active status
 */
const toggleSectionActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey, sectionKey } = req.params;

        const result = await PageContentService.toggleSectionActive(pageKey, sectionKey);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Section not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: `Section ${result.isActive ? 'activated' : 'deactivated'} successfully`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get public page content (for frontend)
 */
const getPublicPageContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { pageKey } = req.params;
        const result = await PageContentService.getPublicPageContent(pageKey);

        res.status(200).json({
            success: true,
            message: 'Public page content retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const PageContentController = {
    getPageDefinitions,
    getAllPagesOverview,
    getPageWithSections,
    getSectionContent,
    updateSectionContent,
    updateMultipleSections,
    toggleSectionActive,
    getPublicPageContent
};
