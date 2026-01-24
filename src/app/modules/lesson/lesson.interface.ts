// ===================================================================
// MotionBoss LMS - Lesson Interface
// Lesson module TypeScript interface definitions
// লেসন মডিউলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Video Provider Types
 */
export type TVideoProvider = 'cloudinary' | 'vimeo' | 'youtube' | 'bunny' | 'custom';

/**
 * Question Types
 */
export type TQuestionType = 'mcq' | 'short';

/**
 * IResource - Lesson resource/attachment (Legacy support)
 * লেসনের সাথে যুক্ত রিসোর্স/ফাইল
 */
export interface IResource {
    title: string;
    titleBn?: string;
    fileUrl: string;
    fileType: 'pdf' | 'doc' | 'zip' | 'image' | 'other';
    fileSize?: string;
}

/**
 * IDocument - Enhanced document/attachment interface
 * PDF, Doc, PPT, Video files সাপোর্ট
 */
export interface IDocument {
    _id?: Types.ObjectId;
    title: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    fileUrl: string;
    fileType: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'zip' | 'image' | 'video' | 'other';
    fileSize?: string;                // e.g., "2.5 MB"
    downloadable: boolean;            // Allow download?
    order: number;                    // Display order
    createdAt?: Date;
}

/**
 * IMCQOption - MCQ Question Options
 * MCQ প্রশ্নের অপশন
 */
export interface IMCQOption {
    _id?: Types.ObjectId;
    text: string;                     // Option text (English)
    textBn?: string;                  // Option text (Bengali)
    isCorrect: boolean;               // Is this the correct answer?
}

/**
 * IQuestion - Quiz Question Interface
 * MCQ এবং Short Answer প্রশ্ন
 */
export interface IQuestion {
    _id?: Types.ObjectId;
    type: TQuestionType;              // 'mcq' or 'short'
    question: string;                 // Question text (English)
    questionBn?: string;              // Question text (Bengali)

    // MCQ specific fields
    options?: IMCQOption[];           // Options for MCQ (2-6 options)

    // Short answer specific fields
    correctAnswer?: string;           // Expected answer for short questions
    correctAnswerBn?: string;         // Bengali version
    caseSensitive?: boolean;          // Is answer case-sensitive?

    // Common fields
    points: number;                   // Points for correct answer
    explanation?: string;             // Explanation after answering
    explanationBn?: string;           // Bengali explanation
    hint?: string;                    // Optional hint
    hintBn?: string;                  // Bengali hint
    order: number;                    // Question order
    isRequired?: boolean;             // Must answer to proceed?

    createdAt?: Date;
}

/**
 * ITextContent - Rich Text Content Block
 * Lesson এর মধ্যে text content যোগ করা
 */
export interface ITextContent {
    _id?: Types.ObjectId;
    title?: string;                   // Section title
    titleBn?: string;
    content: string;                  // Rich HTML content (English)
    contentBn?: string;               // Rich HTML content (Bengali)
    order: number;                    // Display order
    createdAt?: Date;
}

/**
 * ILesson - Main Lesson Interface (Enhanced)
 * Database এ যে format এ lesson data save হবে
 */
export interface ILesson {
    _id?: Types.ObjectId;

    // ==================== Course Reference ====================
    course: Types.ObjectId;           // Parent course

    // ==================== Module/Section Info ====================
    module: Types.ObjectId;           // Parent module

    // ==================== Lesson Basic Info ====================
    title: string;                    // Lesson title (English)
    titleBn?: string;                 // Lesson title (Bengali)
    description?: string;             // Lesson description
    descriptionBn?: string;           // Bengali description

    // ==================== Video Content ====================
    videoUrl?: string;                // Video URL (secure) - Now optional
    videoDuration?: number;           // Duration in seconds - Now optional
    videoProvider?: TVideoProvider;   // Video hosting platform
    videoThumbnail?: string;          // Custom thumbnail for video

    // ==================== Text Content (NEW) ====================
    textContent?: string;             // Main text content (Rich HTML)
    textContentBn?: string;           // Bengali version
    textBlocks?: ITextContent[];      // Multiple text sections

    // ==================== Documents/Attachments (NEW) ====================
    documents?: IDocument[];          // Downloadable documents

    // ==================== Questions/Quiz (NEW - Embedded) ====================
    questions?: IQuestion[];          // Quiz questions (MCQ + Short)
    quizSettings?: {
        passingScore?: number;        // Minimum percentage to pass
        maxAttempts?: number;         // Max quiz attempts (0 = unlimited)
        showCorrectAnswers?: boolean; // Show answers after submission
        shuffleQuestions?: boolean;   // Randomize question order
        timeLimit?: number;           // Time limit in minutes (0 = no limit)
    };

    // ==================== Resources/Attachments (Legacy) ====================
    resources?: IResource[];          // Downloadable resources (legacy)

    // ==================== Order & Access ====================
    order: number;                    // Order within module
    isFree: boolean;                  // Free preview lesson
    isPublished: boolean;             // Published/Draft status

    // ==================== Lesson Type ====================
    lessonType?: 'video' | 'text' | 'quiz' | 'mixed'; // Type of lesson content

    // ==================== Quiz/Assignment (Legacy) ====================
    hasQuiz?: boolean;
    quizId?: Types.ObjectId;

    // ==================== Timestamps ====================
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * ILessonFilters - Query Filters
 */
export interface ILessonFilters {
    course?: string;
    module?: string;
    searchTerm?: string;
    isFree?: boolean;
    isPublished?: boolean;
    lessonType?: string;
}

/**
 * IModuleGroup - Grouped lessons by module
 * Module অনুযায়ী lessons group করা
 */
export interface IModuleGroup {
    _id?: Types.ObjectId;
    moduleTitle: string;
    moduleTitleBn: string;
    moduleOrder: number;
    moduleDescription?: string;
    lessons: ILesson[];
    totalDuration: number;            // Total duration of all lessons in module
    totalLessons: number;
    totalQuestions?: number;          // Total questions in module
}

/**
 * IQuizSubmission - Student's quiz answer submission
 */
export interface IQuizSubmission {
    lessonId: Types.ObjectId;
    userId: Types.ObjectId;
    answers: {
        questionId: Types.ObjectId;
        answer: string | string[];    // Selected option(s) or text answer
    }[];
    score?: number;
    totalPoints?: number;
    percentage?: number;
    passed?: boolean;
    attemptNumber: number;
    submittedAt: Date;
}

/**
 * LessonModel - Mongoose Model Type
 */
export interface LessonModel extends Model<ILesson> {
    getLessonsByCourse(courseId: string): Promise<ILesson[]>;
    getGroupedLessons(courseId: string): Promise<IModuleGroup[]>;
}
