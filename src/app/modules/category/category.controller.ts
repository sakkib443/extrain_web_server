// ===================================================================
// ExtraWeb Backend - Category Controller
// HTTP Request handling for Category CRUD with Hierarchical Support
// ===================================================================

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import CategoryService from './category.service';
import pick from '../../utils/pick';
import { ICategoryFilters } from './category.interface';

const CategoryController = {
    // ==================== CREATE (Admin) ====================
    createCategory: catchAsync(async (req: Request, res: Response) => {
        const category = await CategoryService.createCategory(req.body);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    }),

    // ==================== GET ALL (Admin) ====================
    getAllCategories: catchAsync(async (req: Request, res: Response) => {
        const filters = pick(req.query, ['searchTerm', 'status', 'type', 'isParent', 'parentCategory']) as ICategoryFilters & { type?: string; isParent?: string; parentCategory?: string };
        const categories = await CategoryService.getAllCategories(filters);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Categories fetched successfully',
            data: categories,
        });
    }),

    // ==================== GET PARENT CATEGORIES ====================
    getParentCategories: catchAsync(async (req: Request, res: Response) => {
        const { type } = req.query;
        const categories = await CategoryService.getParentCategories(type as string);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Parent categories fetched successfully',
            data: categories,
        });
    }),

    // ==================== GET CHILD CATEGORIES ====================
    getChildCategories: catchAsync(async (req: Request, res: Response) => {
        const { parentId } = req.params;
        const categories = await CategoryService.getChildCategories(parentId);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Child categories fetched successfully',
            data: categories,
        });
    }),

    // ==================== GET HIERARCHICAL (Nested) ====================
    getHierarchicalCategories: catchAsync(async (req: Request, res: Response) => {
        const { type } = req.query;
        const categories = await CategoryService.getHierarchicalCategories(type as string);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Hierarchical categories fetched successfully',
            data: categories,
        });
    }),

    // ==================== GET ACTIVE (Public) ====================
    getActiveCategories: catchAsync(async (req: Request, res: Response) => {
        const { type } = req.query;
        const categories = await CategoryService.getActiveCategories(type as string);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Categories fetched successfully',
            data: categories,
        });
    }),

    // ==================== GET BY ID ====================
    getCategoryById: catchAsync(async (req: Request, res: Response) => {
        const category = await CategoryService.getCategoryById(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Category fetched successfully',
            data: category,
        });
    }),

    // ==================== GET BY SLUG (Public) ====================
    getCategoryBySlug: catchAsync(async (req: Request, res: Response) => {
        const category = await CategoryService.getCategoryBySlug(req.params.slug);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Category fetched successfully',
            data: category,
        });
    }),

    // ==================== UPDATE (Admin) ====================
    updateCategory: catchAsync(async (req: Request, res: Response) => {
        const category = await CategoryService.updateCategory(req.params.id, req.body);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    }),

    // ==================== DELETE (Admin) ====================
    deleteCategory: catchAsync(async (req: Request, res: Response) => {
        await CategoryService.deleteCategory(req.params.id);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Category deleted successfully',
        });
    }),
};

export default CategoryController;

