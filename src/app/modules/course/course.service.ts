// ===================================================================
// MotionBoss LMS - Course Service
// Business logic for Course module
// কোর্স মডিউলের বিজনেস লজিক
// ===================================================================

import { Types } from 'mongoose';
import { Course } from './course.model';
import { ICourse, ICourseFilters } from './course.interface';
import AppError from '../../utils/AppError';
import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.module';

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

/**
 * Create a new course
 * নতুন কোর্স তৈরি করা
 */
const createCourse = async (payload: Partial<ICourse>): Promise<ICourse> => {
    // Generate slug from title
    let slug = generateSlug(payload.title || '');

    // Check if slug already exists, if so append a number
    let existingCourse = await Course.findOne({ slug });
    let counter = 1;
    while (existingCourse) {
        slug = `${generateSlug(payload.title || '')}-${counter}`;
        existingCourse = await Course.findOne({ slug });
        counter++;
    }

    const courseData = {
        ...payload,
        slug,
    };

    const course = await Course.create(courseData);
    return course;
};

/**
 * Get all courses with filters and pagination
 * ফিল্টার ও পেজিনেশন সহ সব কোর্স পাওয়া
 */
const getAllCourses = async (
    filters: ICourseFilters,
    paginationOptions: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
) => {
    const {
        searchTerm,
        category,
        courseType,
        level,
        language,
        status,
        isFeatured,
        isFree,
        minPrice,
        maxPrice,
    } = filters;

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;

    // Build query conditions
    const conditions: any[] = [];

    // Search term - search in title, titleBn, description, tags
    if (searchTerm) {
        conditions.push({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { titleBn: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { tags: { $in: [new RegExp(searchTerm, 'i')] } },
            ],
        });
    }

    // Category filter
    if (category) {
        conditions.push({ category: category });
    }

    // Course type filter
    if (courseType) {
        conditions.push({ courseType: courseType });
    }

    // Level filter
    if (level) {
        conditions.push({ level: level });
    }

    // Language filter
    if (language) {
        conditions.push({ language: language });
    }

    // Status filter
    if (status) {
        conditions.push({ status: status });
    }

    // Featured filter
    if (isFeatured !== undefined) {
        conditions.push({ isFeatured: isFeatured });
    }

    // Free course filter
    if (isFree !== undefined) {
        conditions.push({ isFree: isFree });
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceCondition: any = {};
        if (minPrice !== undefined) priceCondition.$gte = minPrice;
        if (maxPrice !== undefined) priceCondition.$lte = maxPrice;
        conditions.push({ price: priceCondition });
    }

    // Combine all conditions
    const whereCondition = conditions.length > 0 ? { $and: conditions } : {};

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const courses = await Course.find(whereCondition)
        .populate('category', 'name nameEn icon')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean();

    // Get total count
    const total = await Course.countDocuments(whereCondition);

    return {
        data: courses,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get single course by ID
 * ID দিয়ে একটি কোর্স পাওয়া
 */
const getCourseById = async (id: string): Promise<ICourse | any | null> => {
    const course = await Course.findById(id)
        .populate('category', 'name nameEn icon')
        .lean();

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Increment view count
    await Course.findByIdAndUpdate(id, { $inc: { totalViews: 1 } });

    // Populate curriculum (grouped lessons)
    const { LessonService } = await import('../lesson/lesson.service');
    const curriculum = await LessonService.getGroupedLessons(id);

    return {
        ...course,
        curriculum,
    };
};

/**
 * Get course by slug
 * Slug দিয়ে কোর্স পাওয়া (public access এর জন্য)
 */
const getCourseBySlug = async (slug: string): Promise<ICourse | any | null> => {
    const course = await Course.findOne({ slug, status: 'published' })
        .populate('category', 'name nameEn icon')
        .lean();

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Increment view count
    await Course.findByIdAndUpdate(course._id, { $inc: { totalViews: 1 } });

    // Populate curriculum (grouped lessons)
    const { LessonService } = await import('../lesson/lesson.service');
    const curriculum = await LessonService.getGroupedLessons(course._id.toString());

    return {
        ...course,
        curriculum,
    };
};

/**
 * Update course
 * কোর্স আপডেট করা
 */
const updateCourse = async (
    id: string,
    payload: Partial<ICourse>
): Promise<ICourse | null> => {
    const course = await Course.findById(id);

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // If title is being updated, update slug too
    if (payload.title && payload.title !== course.title) {
        let newSlug = generateSlug(payload.title);
        const existingCourse = await Course.findOne({ slug: newSlug, _id: { $ne: id } });
        if (existingCourse) {
            newSlug = `${newSlug}-${Date.now()}`;
        }
        payload.slug = newSlug;
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).populate('category', 'name nameEn icon');

    return updatedCourse;
};

/**
 * Delete course
 * কোর্স ডিলিট করা
 */
const deleteCourse = async (id: string): Promise<ICourse | null> => {
    const course = await Course.findById(id);

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Check if there are any enrollments
    // TODO: Add check for enrollments before deletion

    const deletedCourse = await Course.findByIdAndDelete(id);
    return deletedCourse;
};

/**
 * Get featured courses
 * ফিচার্ড কোর্স পাওয়া
 */
const getFeaturedCourses = async (limit: number = 6): Promise<ICourse[]> => {
    const courses = await Course.find({ isFeatured: true, status: 'published' })
        .populate('category', 'name nameEn icon')
        .sort({ createdAt: -1 })
        .limit(limit);

    return courses;
};

/**
 * Get popular courses
 * জনপ্রিয় কোর্স পাওয়া (by enrollments)
 */
const getPopularCourses = async (limit: number = 6): Promise<ICourse[]> => {
    const courses = await Course.find({ status: 'published' })
        .populate('category', 'name nameEn icon')
        .sort({ totalEnrollments: -1, averageRating: -1 })
        .limit(limit);

    return courses;
};

/**
 * Get courses by category
 * ক্যাটাগরি অনুযায়ী কোর্স পাওয়া
 */
const getCoursesByCategory = async (
    categoryId: string,
    paginationOptions: { page?: number; limit?: number }
) => {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const courses = await Course.find({ category: categoryId, status: 'published' })
        .populate('category', 'name nameEn icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Course.countDocuments({ category: categoryId, status: 'published' });

    return {
        data: courses,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update course statistics
 * কোর্সের statistics আপডেট করা (internal use)
 */
const updateCourseStats = async (
    courseId: string,
    stats: {
        totalEnrollments?: number;
        averageRating?: number;
        totalReviews?: number;
    }
): Promise<void> => {
    await Course.findByIdAndUpdate(courseId, { $set: stats });
};

/**
 * Re-calculate and sync stats for all courses
 * সব কোর্সের স্ট্যাটাস সিনক্রোনাইজ করা (লেসন সংখ্যা, মডিউল সংখ্যা)
 */
const syncAllCourseStats = async (): Promise<void> => {
    const courses = await Course.find();
    const { LessonService } = await import('../lesson/lesson.service');

    for (const course of courses) {
        // This will trigger the updateCourseStats in LessonService
        await (LessonService as any).updateCourseStats(course._id.toString());
    }
};

/**
 * Get full course content (modules + lessons) for an enrolled student
 */
const getCourseContentForStudent = async (courseId: string) => {
    const course = await Course.findById(courseId)
        .populate('category', 'name nameEn icon')
        .lean();

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Import LessonService dynamically to avoid circular dependency
    const { LessonService } = await import('../lesson/lesson.service');

    // Get modules for this course
    const { Module } = await import('../module/module.model');
    const modules = await Module.find({ course: courseId, isPublished: true })
        .sort({ order: 1 })
        .lean();

    // Get lessons for this course
    const { Lesson } = await import('../lesson/lesson.model');
    const lessons = await Lesson.find({ course: courseId, isPublished: true })
        .sort({ order: 1 })
        .lean();

    return {
        ...course,
        modules,
        lessons,
    };
};

/**
 * Toggle like for a course
 */
const toggleLike = async (id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> => {
    const course = await Course.findById(id);

    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const likedBy = course.likedBy || [];
    const isAlreadyLiked = likedBy.some(likedUserId => likedUserId.equals(userObjectId));

    if (isAlreadyLiked) {
        // Unlike
        await Course.findByIdAndUpdate(id, {
            $pull: { likedBy: userObjectId },
            $inc: { likeCount: -1 }
        });

        // Remove from wishlist
        try {
            const WishlistService = (await import('../wishlist/wishlist.module')).default;
            await WishlistService.removeFromWishlist(userId, id);
        } catch (error) {
            console.error('Wishlist sync error (unlike):', error);
        }

        const updated = await Course.findById(id).select('likeCount');
        return { isLiked: false, likeCount: Math.max(0, updated?.likeCount || 0) };
    } else {
        // Like
        await Course.findByIdAndUpdate(id, {
            $addToSet: { likedBy: userObjectId },
            $inc: { likeCount: 1 }
        });

        // Add to wishlist
        try {
            const WishlistService = (await import('../wishlist/wishlist.module')).default;
            await WishlistService.addToWishlist(userId, id, 'course');

            // Notification
            const user = await User.findById(userId);
            if (user && course) {
                await NotificationService.createLikeNotification({
                    userId: user._id,
                    userName: `${user.firstName} ${user.lastName}`,
                    productId: course._id,
                    productName: course.title,
                    productType: 'course'
                });
            }
        } catch (error) {
            console.error('Wishlist/Notification sync error (like):', error);
        }

        const updated = await Course.findById(id).select('likeCount');
        return { isLiked: true, likeCount: updated?.likeCount || 0 };
    }
};

export const CourseService = {
    createCourse,
    getAllCourses,
    getCourseById,
    getCourseBySlug,
    updateCourse,
    deleteCourse,
    getFeaturedCourses,
    getPopularCourses,
    getCoursesByCategory,
    updateCourseStats,
    getCourseContentForStudent,
    syncAllCourseStats,
    toggleLike,
};
