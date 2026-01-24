// ===================================================================
// ExtraWeb Backend - Category Routes
// API endpoints for Category module with Hierarchical Support
// ===================================================================

import express from 'express';
import CategoryController from './category.controller';
import validateRequest from '../../middlewares/validateRequest';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import { createCategoryValidation, updateCategoryValidation } from './category.validation';

const router = express.Router();

// ===================================================================
// PUBLIC ROUTES
// ===================================================================

// GET /api/categories - Get all active categories (for website filter)
router.get('/', CategoryController.getActiveCategories);

// GET /api/categories/parents - Get parent categories only
router.get('/parents', CategoryController.getParentCategories);

// GET /api/categories/hierarchical - Get nested categories (parent with children)
router.get('/hierarchical', CategoryController.getHierarchicalCategories);

// GET /api/categories/children/:parentId - Get child categories
router.get('/children/:parentId', CategoryController.getChildCategories);

// GET /api/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', CategoryController.getCategoryBySlug);

// ===================================================================
// ADMIN ROUTES
// ===================================================================

// GET /api/categories/admin/all - Get all categories with filters (Admin and Mentor)
router.get(
    '/admin/all',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    CategoryController.getAllCategories
);

// GET /api/categories/admin/parents - Get parent categories (Admin and Mentor)
router.get(
    '/admin/parents',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    CategoryController.getParentCategories
);

// GET /api/categories/admin/:id - Get single category (Admin and Mentor)
router.get(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    CategoryController.getCategoryById
);

// POST /api/categories/admin - Create new category (Admin and Mentor)
router.post(
    '/admin',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(createCategoryValidation),
    CategoryController.createCategory
);

// PATCH /api/categories/admin/:id - Update category (Admin and Mentor)
router.patch(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(updateCategoryValidation),
    CategoryController.updateCategory
);

// DELETE /api/categories/admin/:id - Delete category
router.delete(
    '/admin/:id',
    authMiddleware,
    authorizeRoles('admin'),
    CategoryController.deleteCategory
);

export const CategoryRoutes = router;

