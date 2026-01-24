// ===================================================================
// ExtraWeb Backend - Category Service
// Category CRUD business logic with Hierarchical Support
// ===================================================================

import AppError from '../../utils/AppError';
import { ICategory, ICategoryFilters } from './category.interface';
import { Category } from './category.model';
import { TCreateCategoryInput, TUpdateCategoryInput } from './category.validation';

const CategoryService = {
    // ==================== CREATE CATEGORY ====================
    async createCategory(payload: TCreateCategoryInput): Promise<ICategory> {
        // Generate slug if not provided
        if (!payload.slug) {
            payload.slug = payload.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        // Check if slug exists
        const existing = await Category.findOne({ slug: payload.slug });
        if (existing) {
            throw new AppError(400, 'Category with this slug already exists');
        }

        const category = await Category.create(payload);
        return category;
    },

    // ==================== GET ALL CATEGORIES ====================
    async getAllCategories(filters: ICategoryFilters & { type?: string; isParent?: string; parentCategory?: string }): Promise<ICategory[]> {
        const { searchTerm, status, type, isParent, parentCategory } = filters;
        const query: any = {};

        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        // Filter by isParent
        if (isParent === 'true') {
            query.isParent = true;
        } else if (isParent === 'false') {
            query.isParent = false;
        }

        // Filter by parentCategory
        if (parentCategory) {
            query.parentCategory = parentCategory;
        }

        const categories = await Category.find(query)
            .populate('parentCategory', 'name slug type')
            .sort({ order: 1, name: 1 });
        return categories;
    },

    // ==================== GET PARENT CATEGORIES ====================
    async getParentCategories(type?: string): Promise<ICategory[]> {
        const query: any = { isParent: true };
        if (type) {
            query.type = type;
        }
        return await Category.find(query).sort({ order: 1, name: 1 });
    },

    // ==================== GET CHILD CATEGORIES ====================
    async getChildCategories(parentId: string): Promise<ICategory[]> {
        return await Category.find({ parentCategory: parentId, status: 'active' })
            .sort({ order: 1, name: 1 });
    },

    // ==================== GET HIERARCHICAL CATEGORIES ====================
    async getHierarchicalCategories(type?: string): Promise<any[]> {
        const query: any = { isParent: true };
        if (type) {
            query.type = type;
        }

        const parents = await Category.find(query).sort({ order: 1, name: 1 });

        const result = await Promise.all(
            parents.map(async (parent) => {
                const children = await Category.find({
                    parentCategory: parent._id,
                    status: 'active'
                }).sort({ order: 1, name: 1 });

                return {
                    ...parent.toObject(),
                    children
                };
            })
        );

        return result;
    },

    // ==================== GET ACTIVE CATEGORIES (Public) ====================
    async getActiveCategories(type?: string): Promise<ICategory[]> {
        const query: any = { status: 'active' };
        if (type) {
            query.type = type;
        }
        return await Category.find(query)
            .populate('parentCategory', 'name slug type')
            .sort({ order: 1, name: 1 });
    },

    // ==================== GET SINGLE CATEGORY ====================
    async getCategoryById(id: string): Promise<ICategory> {
        const category = await Category.findById(id).populate('parentCategory', 'name slug type');
        if (!category) {
            throw new AppError(404, 'Category not found');
        }
        return category;
    },

    // ==================== GET BY SLUG ====================
    async getCategoryBySlug(slug: string): Promise<ICategory> {
        const category = await Category.findOne({ slug, status: 'active' })
            .populate('parentCategory', 'name slug type');
        if (!category) {
            throw new AppError(404, 'Category not found');
        }
        return category;
    },

    // ==================== UPDATE CATEGORY ====================
    async updateCategory(id: string, payload: TUpdateCategoryInput): Promise<ICategory> {
        // Check slug uniqueness if updating
        if (payload.slug) {
            const existing = await Category.findOne({ slug: payload.slug, _id: { $ne: id } });
            if (existing) {
                throw new AppError(400, 'Category with this slug already exists');
            }
        }

        const category = await Category.findByIdAndUpdate(
            id,
            { $set: payload },
            { new: true, runValidators: true }
        ).populate('parentCategory', 'name slug type');

        if (!category) {
            throw new AppError(404, 'Category not found');
        }

        return category;
    },

    // ==================== DELETE CATEGORY ====================
    async deleteCategory(id: string): Promise<void> {
        const category = await Category.findById(id);
        if (!category) {
            throw new AppError(404, 'Category not found');
        }

        // Check if category has products
        if (category.productCount > 0) {
            throw new AppError(400, 'Cannot delete category with products. Move products first.');
        }

        // Check if this is a parent with children
        const childCount = await Category.countDocuments({ parentCategory: id });
        if (childCount > 0) {
            throw new AppError(400, 'Cannot delete parent category with sub-categories. Delete children first.');
        }

        await Category.findByIdAndDelete(id);
    },

    // ==================== INCREMENT PRODUCT COUNT ====================
    async incrementProductCount(categoryId: string): Promise<void> {
        await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });
    },

    // ==================== DECREMENT PRODUCT COUNT ====================
    async decrementProductCount(categoryId: string): Promise<void> {
        await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: -1 } });
    },
};

export default CategoryService;

