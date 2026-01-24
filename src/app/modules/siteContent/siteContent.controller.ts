// ===================================================================
// Site Content Controller
// HTTP request handlers for site content API
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { SiteContentService } from './siteContent.service';

/**
 * Get all content
 */
const getAllContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { section, type, key } = req.query;
        const contents = await SiteContentService.getAllContent({
            section: section as string,
            type: type as any,
            key: key as string,
        });

        res.status(200).json({
            success: true,
            message: 'Site contents retrieved successfully',
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get content by key
 */
const getContentByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key } = req.params;
        const content = await SiteContentService.getContentByKey(key);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Content retrieved successfully',
            data: content,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get content by section
 */
const getContentBySection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { section } = req.params;
        const contents = await SiteContentService.getContentBySection(section);

        res.status(200).json({
            success: true,
            message: 'Section contents retrieved successfully',
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get multiple contents by keys
 */
const getContentsByKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { keys } = req.body;

        if (!keys || !Array.isArray(keys)) {
            return res.status(400).json({
                success: false,
                message: 'Keys array is required',
            });
        }

        const contents = await SiteContentService.getContentsByKeys(keys);

        res.status(200).json({
            success: true,
            message: 'Contents retrieved successfully',
            data: contents,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create or update content
 */
const upsertContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contentData = req.body;
        const userId = (req as any).user?._id || (req as any).user?.userId;

        const content = await SiteContentService.upsertContent(contentData, userId);

        res.status(200).json({
            success: true,
            message: 'Content saved successfully',
            data: content,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk update contents
 */
const bulkUpdateContents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { contents } = req.body;
        const userId = (req as any).user?._id || (req as any).user?.userId;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({
                success: false,
                message: 'Contents array is required',
            });
        }

        const result = await SiteContentService.bulkUpdateContents(contents, userId);

        res.status(200).json({
            success: true,
            message: 'Contents updated successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete content
 */
const deleteContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key } = req.params;
        const result = await SiteContentService.deleteContent(key);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Content not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Content deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Seed default content
 */
const seedContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await SiteContentService.seedDefaultContent();

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export const SiteContentController = {
    getAllContent,
    getContentByKey,
    getContentBySection,
    getContentsByKeys,
    upsertContent,
    bulkUpdateContents,
    deleteContent,
    seedContent,
};
