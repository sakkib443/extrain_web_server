// ===================================================================
// MotionBoss LMS - Lesson Model (Enhanced)
// MongoDB Lesson Schema with Mongoose
// লেসন কালেকশনের Mongoose স্কিমা - Questions, Documents, Text Content সহ
// ===================================================================

import { Schema, model } from 'mongoose';
import { ILesson, LessonModel, IDocument, IQuestion, ITextContent, IMCQOption } from './lesson.interface';

// ==================== MCQ Option Sub-Schema ====================
const mcqOptionSchema = new Schema<IMCQOption>(
    {
        text: {
            type: String,
            required: [true, 'Option text is required'],
            trim: true,
            maxlength: [500, 'Option text cannot exceed 500 characters'],
        },
        textBn: {
            type: String,
            trim: true,
            maxlength: [500, 'Bengali option text cannot exceed 500 characters'],
        },
        isCorrect: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true }
);

// ==================== Question Sub-Schema ====================
const questionSchema = new Schema<IQuestion>(
    {
        type: {
            type: String,
            enum: {
                values: ['mcq', 'short'],
                message: '{VALUE} is not a valid question type',
            },
            required: [true, 'Question type is required'],
        },
        question: {
            type: String,
            required: [true, 'Question text is required'],
            trim: true,
            maxlength: [2000, 'Question cannot exceed 2000 characters'],
        },
        questionBn: {
            type: String,
            trim: true,
            maxlength: [2000, 'Bengali question cannot exceed 2000 characters'],
        },

        // MCQ specific
        options: {
            type: [mcqOptionSchema],
            validate: {
                validator: function (this: IQuestion, options: IMCQOption[]) {
                    // MCQ must have 2-6 options
                    if (this.type === 'mcq') {
                        return options && options.length >= 2 && options.length <= 6;
                    }
                    return true;
                },
                message: 'MCQ questions must have 2-6 options',
            },
        },

        // Short answer specific
        correctAnswer: {
            type: String,
            trim: true,
            maxlength: [1000, 'Answer cannot exceed 1000 characters'],
        },
        correctAnswerBn: {
            type: String,
            trim: true,
            maxlength: [1000, 'Bengali answer cannot exceed 1000 characters'],
        },
        caseSensitive: {
            type: Boolean,
            default: false,
        },

        // Common fields
        points: {
            type: Number,
            required: [true, 'Points are required'],
            min: [1, 'Points must be at least 1'],
            max: [100, 'Points cannot exceed 100'],
            default: 1,
        },
        explanation: {
            type: String,
            maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
        },
        explanationBn: {
            type: String,
            maxlength: [2000, 'Bengali explanation cannot exceed 2000 characters'],
        },
        hint: {
            type: String,
            maxlength: [500, 'Hint cannot exceed 500 characters'],
        },
        hintBn: {
            type: String,
            maxlength: [500, 'Bengali hint cannot exceed 500 characters'],
        },
        order: {
            type: Number,
            default: 1,
        },
        isRequired: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true, timestamps: true }
);

// ==================== Document Sub-Schema ====================
const documentSchema = new Schema<IDocument>(
    {
        title: {
            type: String,
            required: [true, 'Document title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        descriptionBn: {
            type: String,
            maxlength: [500, 'Bengali description cannot exceed 500 characters'],
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
        },
        fileType: {
            type: String,
            enum: {
                values: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'image', 'video', 'other'],
                message: '{VALUE} is not a valid file type',
            },
            default: 'other',
        },
        fileSize: {
            type: String,
        },
        downloadable: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 1,
        },
    },
    { _id: true, timestamps: true }
);

// ==================== Text Content Block Sub-Schema ====================
const textBlockSchema = new Schema<ITextContent>(
    {
        title: {
            type: String,
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            maxlength: [50000, 'Content cannot exceed 50000 characters'],
        },
        contentBn: {
            type: String,
            maxlength: [50000, 'Bengali content cannot exceed 50000 characters'],
        },
        order: {
            type: Number,
            default: 1,
        },
    },
    { _id: true, timestamps: true }
);

// ==================== Quiz Settings Sub-Schema ====================
const quizSettingsSchema = new Schema(
    {
        passingScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 70,
        },
        maxAttempts: {
            type: Number,
            min: 0,
            default: 0, // 0 = unlimited
        },
        showCorrectAnswers: {
            type: Boolean,
            default: true,
        },
        shuffleQuestions: {
            type: Boolean,
            default: false,
        },
        timeLimit: {
            type: Number,
            min: 0,
            default: 0, // 0 = no limit (in minutes)
        },
    },
    { _id: false }
);

// ==================== Legacy Resource Sub-Schema ====================
const resourceSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        titleBn: String,
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            enum: ['pdf', 'doc', 'zip', 'image', 'other'],
            default: 'other',
        },
        fileSize: String,
    },
    { _id: false }
);

// ==================== Main Lesson Schema ====================
const lessonSchema = new Schema<ILesson, LessonModel>(
    {
        // ==================== Course Reference ====================
        course: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course reference is required'],
            index: true,
        },

        // ==================== Module/Section Info ====================
        module: {
            type: Schema.Types.ObjectId,
            ref: 'Module',
            required: [true, 'Module reference is required'],
            index: true,
        },

        // ==================== Lesson Basic Info ====================
        title: {
            type: String,
            required: [true, 'Lesson title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        titleBn: {
            type: String,
            trim: true,
            maxlength: [200, 'Bengali title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            maxlength: 2000,
        },
        descriptionBn: {
            type: String,
            maxlength: 2000,
        },

        // ==================== Lesson Type ====================
        lessonType: {
            type: String,
            enum: {
                values: ['video', 'text', 'quiz', 'mixed'],
                message: '{VALUE} is not a valid lesson type',
            },
            default: 'video',
        },

        // ==================== Video Content ====================
        videoUrl: {
            type: String,
            // Not required anymore - text/quiz lessons may not have video
        },
        videoDuration: {
            type: Number,
            min: [0, 'Duration cannot be negative'],
            default: 0,
        },
        videoProvider: {
            type: String,
            enum: {
                values: ['cloudinary', 'vimeo', 'youtube', 'bunny', 'custom'],
                message: '{VALUE} is not a valid video provider',
            },
            default: 'youtube',
        },
        videoThumbnail: {
            type: String,
        },

        // ==================== Text Content (NEW) ====================
        textContent: {
            type: String,
            maxlength: [100000, 'Text content cannot exceed 100000 characters'],
        },
        textContentBn: {
            type: String,
            maxlength: [100000, 'Bengali text content cannot exceed 100000 characters'],
        },
        textBlocks: {
            type: [textBlockSchema],
            default: [],
        },

        // ==================== Documents (NEW) ====================
        documents: {
            type: [documentSchema],
            default: [],
        },

        // ==================== Questions/Quiz (NEW) ====================
        questions: {
            type: [questionSchema],
            default: [],
        },
        quizSettings: {
            type: quizSettingsSchema,
            default: {},
        },

        // ==================== Resources (Legacy) ====================
        resources: {
            type: [resourceSchema],
            default: [],
        },

        // ==================== Order & Access ====================
        order: {
            type: Number,
            required: true,
            default: 1,
        },
        isFree: {
            type: Boolean,
            default: false,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },

        // ==================== Quiz/Assignment (Legacy) ====================
        hasQuiz: {
            type: Boolean,
            default: false,
        },
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Exam',
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

// ==================== Virtuals ====================

// Calculate total questions count
lessonSchema.virtual('totalQuestions').get(function () {
    return this.questions?.length || 0;
});

// Calculate total documents count
lessonSchema.virtual('totalDocuments').get(function () {
    return this.documents?.length || 0;
});

// Calculate total quiz points
lessonSchema.virtual('totalPoints').get(function () {
    if (!this.questions || this.questions.length === 0) return 0;
    return this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
});

// ==================== Indexes ====================
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, isPublished: 1 });
lessonSchema.index({ course: 1, lessonType: 1 });
lessonSchema.index({ title: 'text', titleBn: 'text' });

// ==================== Pre-save Hook ====================
lessonSchema.pre('save', function (next) {
    // Auto-set hasQuiz if questions exist
    if (this.questions && this.questions.length > 0) {
        this.hasQuiz = true;
    }

    // Auto-determine lessonType based on content
    if (!this.lessonType) {
        if (this.questions && this.questions.length > 0 && !this.videoUrl && !this.textContent) {
            this.lessonType = 'quiz';
        } else if (this.videoUrl && (this.questions?.length || this.textContent)) {
            this.lessonType = 'mixed';
        } else if (this.textContent && !this.videoUrl) {
            this.lessonType = 'text';
        } else {
            this.lessonType = 'video';
        }
    }

    next();
});

// ==================== Static Methods ====================

/**
 * Get all lessons for a course
 */
lessonSchema.statics.getLessonsByCourse = async function (
    courseId: string
): Promise<ILesson[]> {
    return await this.find({ course: courseId, isPublished: true })
        .populate('module')
        .sort({ 'module.order': 1, order: 1 })
        .lean();
};

// ==================== Export Model ====================
export const Lesson = model<ILesson, LessonModel>('Lesson', lessonSchema);
