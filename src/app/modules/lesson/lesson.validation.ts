// ===================================================================
// MotionBoss LMS - Lesson Validation (Enhanced)
// Zod validation schemas for Lesson module
// লেসন মডিউলের জন্য Zod ভ্যালিডেশন স্কিমা - Questions, Documents, Text সহ
// ===================================================================

import { z } from 'zod';

// ==================== MCQ Option Schema ====================
const mcqOptionSchema = z.object({
    text: z.string().min(1, 'Option text is required').max(500),
    textBn: z.string().max(500).optional().or(z.literal('')),
    isCorrect: z.boolean().default(false),
});

// ==================== Question Schema ====================
const questionSchema = z.object({
    type: z.enum(['mcq', 'short'], {
        required_error: 'Question type is required',
    }),
    question: z.string().min(1, 'Question text is required').max(2000),
    questionBn: z.string().max(2000).optional().or(z.literal('')),

    // MCQ specific
    options: z.array(mcqOptionSchema).min(2).max(6).optional(),

    // Short answer specific
    correctAnswer: z.string().max(1000).optional().or(z.literal('')),
    correctAnswerBn: z.string().max(1000).optional().or(z.literal('')),
    caseSensitive: z.boolean().optional().default(false),

    // Common fields
    points: z.number().min(1).max(100).default(1),
    explanation: z.string().max(2000).optional().or(z.literal('')),
    explanationBn: z.string().max(2000).optional().or(z.literal('')),
    hint: z.string().max(500).optional().or(z.literal('')),
    hintBn: z.string().max(500).optional().or(z.literal('')),
    order: z.number().min(1).optional().default(1),
    isRequired: z.boolean().optional().default(true),
}).refine((data) => {
    // MCQ must have options with at least one correct answer
    if (data.type === 'mcq') {
        if (!data.options || data.options.length < 2) {
            return false;
        }
        const hasCorrectAnswer = data.options.some(opt => opt.isCorrect);
        return hasCorrectAnswer;
    }
    // Short answer must have correctAnswer
    if (data.type === 'short') {
        return !!data.correctAnswer && data.correctAnswer.trim().length > 0;
    }
    return true;
}, {
    message: 'MCQ must have 2-6 options with at least one correct, Short answer must have correct answer',
});

// ==================== Document Schema ====================
const documentSchema = z.object({
    title: z.string().min(1, 'Document title is required').max(200),
    titleBn: z.string().max(200).optional().or(z.literal('')),
    description: z.string().max(500).optional().or(z.literal('')),
    descriptionBn: z.string().max(500).optional().or(z.literal('')),
    fileUrl: z.string().url('File URL must be valid'),
    fileType: z.enum(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'image', 'video', 'other']).optional().default('other'),
    fileSize: z.string().optional(),
    downloadable: z.boolean().optional().default(true),
    order: z.number().min(1).optional().default(1),
});

// ==================== Text Block Schema ====================
const textBlockSchema = z.object({
    title: z.string().max(200).optional().or(z.literal('')),
    titleBn: z.string().max(200).optional().or(z.literal('')),
    content: z.string().min(1, 'Content is required').max(50000),
    contentBn: z.string().max(50000).optional().or(z.literal('')),
    order: z.number().min(1).optional().default(1),
});

// ==================== Quiz Settings Schema ====================
const quizSettingsSchema = z.object({
    passingScore: z.number().min(0).max(100).optional().default(70),
    maxAttempts: z.number().min(0).optional().default(0),
    showCorrectAnswers: z.boolean().optional().default(true),
    shuffleQuestions: z.boolean().optional().default(false),
    timeLimit: z.number().min(0).optional().default(0),
});

// ==================== Legacy Resource Schema ====================
const resourceSchema = z.object({
    title: z.string().min(1, 'Resource title is required'),
    titleBn: z.string().optional(),
    fileUrl: z.string().url('File URL must be valid'),
    fileType: z.enum(['pdf', 'doc', 'zip', 'image', 'other']).optional(),
    fileSize: z.string().optional(),
});

// ==================== Create Lesson Schema ====================
const createLessonSchema = z.object({
    body: z.object({
        // Course reference
        course: z.string({ required_error: 'Course ID is required' }),

        // Module info
        module: z.string({ required_error: 'Module ID is required' }),

        // Lesson info
        title: z
            .string({ required_error: 'Lesson title is required' })
            .min(1, 'Lesson title is required')
            .max(200, 'Lesson title cannot exceed 200 characters'),

        titleBn: z
            .string()
            .min(1)
            .max(200)
            .optional()
            .or(z.literal('')),

        description: z.string().max(2000).optional(),
        descriptionBn: z.string().max(2000).optional(),

        // Lesson type
        lessonType: z.enum(['video', 'text', 'quiz', 'mixed']).optional().default('video'),

        // Video content (optional now)
        videoUrl: z.string().url().optional().or(z.literal('')),
        videoDuration: z.number().min(0).optional().default(0),
        videoProvider: z.enum(['cloudinary', 'vimeo', 'youtube', 'bunny', 'custom']).optional().default('youtube'),
        videoThumbnail: z.string().url().optional().or(z.literal('')),

        // Text content (NEW)
        textContent: z.string().max(100000).optional().or(z.literal('')),
        textContentBn: z.string().max(100000).optional().or(z.literal('')),
        textBlocks: z.array(textBlockSchema).optional().default([]),

        // Documents (NEW)
        documents: z.array(documentSchema).optional().default([]),

        // Questions/Quiz (NEW)
        questions: z.array(questionSchema).optional().default([]),
        quizSettings: quizSettingsSchema.optional(),

        // Resources (Legacy)
        resources: z.array(resourceSchema).optional().default([]),

        // Order & Access
        order: z.number().min(1).optional().default(1),
        isFree: z.boolean().optional().default(false),
        isPublished: z.boolean().optional().default(false),

        // Legacy quiz
        hasQuiz: z.boolean().optional(),
        quizId: z.string().optional(),
    }),
});

// ==================== Update Lesson Schema ====================
const updateLessonSchema = z.object({
    body: z.object({
        module: z.string().optional(),

        title: z.string().min(1).max(200).optional(),
        titleBn: z.string().min(1).max(200).optional().or(z.literal('')),
        description: z.string().max(2000).optional(),
        descriptionBn: z.string().max(2000).optional(),

        // Lesson type
        lessonType: z.enum(['video', 'text', 'quiz', 'mixed']).optional(),

        // Video content
        videoUrl: z.string().url().optional().or(z.literal('')),
        videoDuration: z.number().min(0).optional(),
        videoProvider: z.enum(['cloudinary', 'vimeo', 'youtube', 'bunny', 'custom']).optional(),
        videoThumbnail: z.string().url().optional().or(z.literal('')),

        // Text content
        textContent: z.string().max(100000).optional().or(z.literal('')),
        textContentBn: z.string().max(100000).optional().or(z.literal('')),
        textBlocks: z.array(textBlockSchema).optional(),

        // Documents
        documents: z.array(documentSchema).optional(),

        // Questions/Quiz
        questions: z.array(questionSchema).optional(),
        quizSettings: quizSettingsSchema.optional(),

        // Resources (Legacy)
        resources: z.array(resourceSchema).optional(),

        order: z.number().min(1).optional(),
        isFree: z.boolean().optional(),
        isPublished: z.boolean().optional(),

        hasQuiz: z.boolean().optional(),
        quizId: z.string().optional().nullable(),
    }),
});

// ==================== Add Question Schema ====================
const addQuestionSchema = z.object({
    body: questionSchema,
});

// ==================== Update Question Schema ====================
const updateQuestionSchema = z.object({
    body: z.object({
        type: z.enum(['mcq', 'short']).optional(),
        question: z.string().min(1).max(2000).optional(),
        questionBn: z.string().max(2000).optional().or(z.literal('')),
        options: z.array(mcqOptionSchema).min(2).max(6).optional(),
        correctAnswer: z.string().max(1000).optional().or(z.literal('')),
        correctAnswerBn: z.string().max(1000).optional().or(z.literal('')),
        caseSensitive: z.boolean().optional(),
        points: z.number().min(1).max(100).optional(),
        explanation: z.string().max(2000).optional().or(z.literal('')),
        explanationBn: z.string().max(2000).optional().or(z.literal('')),
        hint: z.string().max(500).optional().or(z.literal('')),
        hintBn: z.string().max(500).optional().or(z.literal('')),
        order: z.number().min(1).optional(),
        isRequired: z.boolean().optional(),
    }),
});

// ==================== Add Document Schema ====================
const addDocumentSchema = z.object({
    body: documentSchema,
});

// ==================== Add TextBlock Schema ====================
const addTextBlockSchema = z.object({
    body: textBlockSchema,
});

// ==================== Submit Quiz Schema ====================
const submitQuizSchema = z.object({
    body: z.object({
        answers: z.array(z.object({
            questionId: z.string(),
            answer: z.union([z.string(), z.array(z.string())]),
        })).min(1, 'At least one answer is required'),
    }),
});

// ==================== Bulk Create Lessons Schema ====================
const bulkCreateLessonsSchema = z.object({
    body: z.object({
        course: z.string({ required_error: 'Course ID is required' }),
        lessons: z
            .array(
                z.object({
                    module: z.string({ required_error: 'Module ID is required' }),
                    title: z.string().min(1).max(200),
                    titleBn: z.string().min(1).max(200).optional().or(z.literal('')),
                    description: z.string().max(2000).optional(),
                    descriptionBn: z.string().max(2000).optional(),
                    lessonType: z.enum(['video', 'text', 'quiz', 'mixed']).optional(),
                    videoUrl: z.string().url().optional().or(z.literal('')),
                    videoDuration: z.number().min(0).optional(),
                    videoProvider: z.enum(['cloudinary', 'vimeo', 'youtube', 'bunny', 'custom']).optional(),
                    textContent: z.string().max(100000).optional(),
                    documents: z.array(documentSchema).optional(),
                    questions: z.array(questionSchema).optional(),
                    resources: z.array(resourceSchema).optional(),
                    order: z.number().min(1),
                    isFree: z.boolean().optional(),
                    isPublished: z.boolean().optional(),
                })
            )
            .min(1, 'At least one lesson is required'),
    }),
});

// ==================== Reorder Lessons Schema ====================
const reorderLessonsSchema = z.object({
    body: z.object({
        lessons: z
            .array(
                z.object({
                    lessonId: z.string(),
                    moduleId: z.string(),
                    order: z.number().min(1),
                })
            )
            .min(1, 'At least one lesson is required'),
    }),
});

// ==================== Export ====================
export const LessonValidation = {
    createLessonSchema,
    updateLessonSchema,
    addQuestionSchema,
    updateQuestionSchema,
    addDocumentSchema,
    addTextBlockSchema,
    submitQuizSchema,
    bulkCreateLessonsSchema,
    reorderLessonsSchema,
};
