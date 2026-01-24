// ===================================================================
// MotionBoss LMS - Module Service
// Business logic for Module module
// ===================================================================

import { Module } from './module.model';
import { Course } from '../course/course.model';
import { IModule, IModuleFilters } from './module.interface';
import AppError from '../../utils/AppError';

/**
 * Create a new module
 */
const createModule = async (payload: IModule): Promise<IModule> => {
    // Check if course exists
    const course = await Course.findById(payload.course);
    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Create module
    const module = await Module.create(payload);

    // Update course: increment totalModules and add module ID to modules array
    await Course.findByIdAndUpdate(payload.course, {
        $inc: { totalModules: 1 },
        $push: { modules: module._id },
    });

    return module;
};

/**
 * Get all modules for a course
 */
const getModulesByCourse = async (courseId: string, includeUnpublished: boolean = false): Promise<IModule[]> => {
    const query: any = { course: courseId };
    if (!includeUnpublished) {
        query.isPublished = true;
    }

    return await Module.find(query).sort({ order: 1 }).lean();
};

/**
 * Get module by ID
 */
const getModuleById = async (id: string): Promise<IModule | null> => {
    const module = await Module.findById(id).populate('course', 'title');
    if (!module) {
        throw new AppError(404, 'Module not found');
    }
    return module;
};

/**
 * Update module
 */
const updateModule = async (id: string, payload: Partial<IModule>): Promise<IModule | null> => {
    const module = await Module.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (!module) {
        throw new AppError(404, 'Module not found');
    }

    return module;
};

/**
 * Delete module
 */
const deleteModule = async (id: string): Promise<IModule | null> => {
    const module = await Module.findById(id);
    if (!module) {
        throw new AppError(404, 'Module not found');
    }

    const courseId = module.course;

    const deletedModule = await Module.findByIdAndDelete(id);

    // Update course: decrement totalModules and remove module ID from modules array
    await Course.findByIdAndUpdate(courseId, {
        $inc: { totalModules: -1 },
        $pull: { modules: id },
    });

    // Note: We might want to handle what happens to lessons in this module.
    // For now, they will just reference a non-existent module.

    return deletedModule;
};

export const ModuleService = {
    createModule,
    getModulesByCourse,
    getModuleById,
    updateModule,
    deleteModule,
};
