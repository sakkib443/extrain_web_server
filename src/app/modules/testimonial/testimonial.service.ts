// ===================================================================
// Extrain Web - Testimonial Service
// Business logic for Testimonial module
// টেস্টিমোনিয়াল মডিউলের বিজনেস লজিক
// ===================================================================

import { ITestimonial, ITestimonialFilters } from './testimonial.interface';
import { Testimonial } from './testimonial.model';
import AppError from '../../utils/AppError';

// ==================== Create Testimonial ====================
const createTestimonial = async (payload: ITestimonial): Promise<ITestimonial> => {
    const result = await Testimonial.create(payload);
    return result;
};

// ==================== Get All Testimonials ====================
const getAllTestimonials = async (
    filters: ITestimonialFilters,
    paginationOptions: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
): Promise<{
    meta: { page: number; limit: number; total: number; totalPages: number };
    data: ITestimonial[];
}> => {
    const { searchTerm, ...filtersData } = filters;
    const { page = 1, limit = 10, sortBy = 'order', sortOrder = 'asc' } = paginationOptions;
    const skip = (page - 1) * limit;

    const conditions: any[] = [];

    // Search
    if (searchTerm) {
        conditions.push({
            $or: [
                { clientName: { $regex: searchTerm, $options: 'i' } },
                { companyName: { $regex: searchTerm, $options: 'i' } },
                { title: { $regex: searchTerm, $options: 'i' } },
            ],
        });
    }

    // Filter conditions
    if (Object.keys(filtersData).length) {
        Object.entries(filtersData).forEach(([field, value]) => {
            if (value !== undefined) {
                conditions.push({ [field]: value });
            }
        });
    }

    const whereConditions = conditions.length > 0 ? { $and: conditions } : {};

    const sortConfig: any = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const result = await Testimonial.find(whereConditions)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit);

    const total = await Testimonial.countDocuments(whereConditions);

    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};

// ==================== Get Approved Testimonials (Public) ====================
const getApprovedTestimonials = async (type?: string): Promise<ITestimonial[]> => {
    const query: any = { status: 'approved' };
    if (type) {
        query.type = type;
    }

    const result = await Testimonial.find(query)
        .sort({ order: 1, createdAt: -1 });
    return result;
};

// ==================== Get Single Testimonial ====================
const getSingleTestimonial = async (id: string): Promise<ITestimonial | null> => {
    const result = await Testimonial.findById(id);
    if (!result) {
        throw new AppError(404, 'Testimonial not found');
    }
    return result;
};

// ==================== Update Testimonial ====================
const updateTestimonial = async (
    id: string,
    payload: Partial<ITestimonial>
): Promise<ITestimonial | null> => {
    const isExist = await Testimonial.findById(id);
    if (!isExist) {
        throw new AppError(404, 'Testimonial not found');
    }

    const result = await Testimonial.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

// ==================== Delete Testimonial ====================
const deleteTestimonial = async (id: string): Promise<ITestimonial | null> => {
    const isExist = await Testimonial.findById(id);
    if (!isExist) {
        throw new AppError(404, 'Testimonial not found');
    }

    const result = await Testimonial.findByIdAndDelete(id);
    return result;
};

// ==================== Update Status ====================
const updateStatus = async (
    id: string,
    status: 'pending' | 'approved' | 'rejected'
): Promise<ITestimonial | null> => {
    const result = await Testimonial.findByIdAndUpdate(
        id,
        { status },
        { new: true }
    );
    if (!result) {
        throw new AppError(404, 'Testimonial not found');
    }
    return result;
};

// ==================== Toggle Featured ====================
const toggleFeatured = async (id: string): Promise<ITestimonial | null> => {
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
        throw new AppError(404, 'Testimonial not found');
    }

    const result = await Testimonial.findByIdAndUpdate(
        id,
        { isFeatured: !testimonial.isFeatured },
        { new: true }
    );
    return result;
};

export const TestimonialService = {
    createTestimonial,
    getAllTestimonials,
    getApprovedTestimonials,
    getSingleTestimonial,
    updateTestimonial,
    deleteTestimonial,
    updateStatus,
    toggleFeatured,
};
