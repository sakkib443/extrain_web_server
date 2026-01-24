// ===================================================================
// MotionBoss LMS - Module Controller
// HTTP request handlers for Module module
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { ModuleService } from './module.service';
import catchAsync from '../../utils/catchAsync';

/**
 * Create a new module
 */
const createModule = catchAsync(async (req: Request, res: Response) => {
    const module = await ModuleService.createModule(req.body);

    res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
    });
});

/**
 * Get all modules for a course
 */
const getModulesByCourse = catchAsync(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const isAdmin = req.user?.role === 'admin';

    const modules = await ModuleService.getModulesByCourse(
        courseId,
        isAdmin && includeUnpublished
    );

    res.status(200).json({
        success: true,
        message: 'Modules retrieved successfully',
        data: modules,
    });
});

/**
 * Get module by ID
 */
const getModuleById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const module = await ModuleService.getModuleById(id);

    res.status(200).json({
        success: true,
        message: 'Module retrieved successfully',
        data: module,
    });
});

/**
 * Update module
 */
const updateModule = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const module = await ModuleService.updateModule(id, req.body);

    res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: module,
    });
});

/**
 * Delete module
 */
const deleteModule = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ModuleService.deleteModule(id);

    res.status(200).json({
        success: true,
        message: 'Module deleted successfully',
        data: null,
    });
});

export const ModuleController = {
    createModule,
    getModulesByCourse,
    getModuleById,
    updateModule,
    deleteModule,
};
