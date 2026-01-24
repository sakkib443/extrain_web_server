// ===================================================================
// MotionBoss LMS - Design Controller
// HTTP request handlers for Design module
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { DesignService } from './design.service';

/**
 * Get design by section (public)
 */
const getDesignBySection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { section } = req.params;
        const result = await DesignService.getDesignBySection(section);

        res.status(200).json({
            success: true,
            message: `${section} design retrieved successfully`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all designs (admin)
 */
const getAllDesigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await DesignService.getAllDesigns();

        res.status(200).json({
            success: true,
            message: 'All designs retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update design by section (admin)
 */
const updateDesignBySection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { section } = req.params;
        const result = await DesignService.updateDesignBySection(section, req.body);

        res.status(200).json({
            success: true,
            message: `${section} design updated successfully`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create design (admin)
 */
const createDesign = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await DesignService.createDesign(req.body);

        res.status(201).json({
            success: true,
            message: 'Design created successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const DesignController = {
    getDesignBySection,
    getAllDesigns,
    updateDesignBySection,
    createDesign
};
