// ===================================================================
// MotionBoss LMS - Course Model
// MongoDB Course Schema with Mongoose
// কোর্স কালেকশনের Mongoose স্কিমা
// ===================================================================

import { Schema, model } from 'mongoose';
import { ICourse, CourseModel } from './course.interface';

/**
 * Course Schema Definition
 * Course collection এর structure এখানে define করা হয়েছে
 */
const courseSchema = new Schema<ICourse, CourseModel>(
    {
        // ==================== Basic Info ====================
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        descriptionBn: {
            type: String,
        },
        shortDescription: {
            type: String,
            maxlength: [500, 'Short description cannot exceed 500 characters'],
        },
        shortDescriptionBn: {
            type: String,
            maxlength: [500, 'Bengali short description cannot exceed 500 characters'],
        },

        // ==================== Media ====================
        thumbnail: {
            type: String,
            required: [true, 'Thumbnail is required'],
        },
        previewVideo: {
            type: String,
            default: '',
        },
        bannerImage: {
            type: String,
            default: '',
        },

        // ==================== Category & Tags ====================
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        tags: {
            type: [String],
            default: [],
        },


        // ==================== Pricing ====================
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountPrice: {
            type: Number,
            min: [0, 'Discount price cannot be negative'],
        },
        currency: {
            type: String,
            enum: {
                values: ['BDT', 'USD'],
                message: '{VALUE} is not a valid currency',
            },
            default: 'BDT',
        },
        isFree: {
            type: Boolean,
            default: false,
        },

        // ==================== Course Details ====================
        courseType: {
            type: String,
            enum: {
                values: ['online', 'offline', 'recorded'],
                message: '{VALUE} is not a valid course type',
            },
            default: 'recorded',
        },
        level: {
            type: String,
            enum: {
                values: ['beginner', 'intermediate', 'advanced'],
                message: '{VALUE} is not a valid level',
            },
            default: 'beginner',
        },
        language: {
            type: String,
            enum: {
                values: ['bangla', 'english', 'both'],
                message: '{VALUE} is not a valid language',
            },
            default: 'bangla',
        },

        // ==================== Duration ====================
        totalDuration: {
            type: Number,
            default: 0,
            min: [0, 'Duration cannot be negative'],
        },
        totalLessons: {
            type: Number,
            default: 0,
            min: [0, 'Lessons count cannot be negative'],
        },
        totalModules: {
            type: Number,
            default: 0,
            min: [0, 'Modules count cannot be negative'],
        },

        // ==================== Module & Lesson References ====================
        modules: [{
            type: Schema.Types.ObjectId,
            ref: 'Module',
        }],
        lessons: [{
            type: Schema.Types.ObjectId,
            ref: 'Lesson',
        }],


        // ==================== Content Info ====================
        features: {
            type: [String],
            default: [],
        },
        requirements: {
            type: [String],
            default: [],
        },
        whatYouWillLearn: {
            type: [String],
            default: [],
        },
        targetAudience: {
            type: [String],
            default: [],
        },

        // ==================== Status & Visibility ====================
        status: {
            type: String,
            enum: {
                values: ['draft', 'published', 'archived'],
                message: '{VALUE} is not a valid status',
            },
            default: 'draft',
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPopular: {
            type: Boolean,
            default: false,
        },

        // ==================== Statistics ====================
        totalEnrollments: {
            type: Number,
            default: 0,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        totalViews: {
            type: Number,
            default: 0,
        },
        likeCount: {
            type: Number,
            default: 0,
        },
        likedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],

        // ==================== SEO ====================
        metaTitle: {
            type: String,
            maxlength: [100, 'Meta title cannot exceed 100 characters'],
        },
        metaDescription: {
            type: String,
            maxlength: [300, 'Meta description cannot exceed 300 characters'],
        },

        // ==================== Publish Date ====================
        publishedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ==================== Indexes ====================
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ courseType: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ totalEnrollments: -1 });
courseSchema.index({ title: 'text', titleBn: 'text', description: 'text', tags: 'text' });

// ==================== Pre-Save Middleware ====================
courseSchema.pre('save', function (next) {
    // Auto-set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    // If price is 0, mark as free
    if (this.price === 0) {
        this.isFree = true;
    }

    next();
});

// ==================== Static Methods ====================
courseSchema.statics.isCourseExists = async function (id: string): Promise<boolean> {
    const course = await this.findById(id);
    return !!course;
};

courseSchema.statics.findBySlug = async function (slug: string): Promise<ICourse | null> {
    return await this.findOne({ slug, status: 'published' });
};

// ==================== Export Model ====================
export const Course = model<ICourse, CourseModel>('Course', courseSchema);
