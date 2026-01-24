// ===================================================================
// MotionBoss LMS - Lesson Controller
// HTTP request handlers for Lesson module
// লেসন মডিউলের HTTP রিকোয়েস্ট হ্যান্ডলার
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { LessonService } from './lesson.service';

/**
 * Create a new lesson
 * POST /api/lessons
 */
const createLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const lesson = await LessonService.createLesson(req.body);

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk create lessons
 * POST /api/lessons/bulk
 */
const bulkCreateLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { course, lessons: lessonsData } = req.body;
        const lessons = await LessonService.bulkCreateLessons(course, lessonsData);

        res.status(201).json({
            success: true,
            message: `${lessons.length} lessons created successfully`,
            data: lessons,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all lessons with filters and pagination
 * GET /api/lessons
 */
const getAllLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            searchTerm: req.query.searchTerm as string,
            course: req.query.course as string,
            isFree: req.query.isFree === 'true' ? true : req.query.isFree === 'false' ? false : undefined,
            isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
        };

        const paginationOptions = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 100, // Default to a large number for list
        };

        const result = await LessonService.getAllLessons(filters, paginationOptions);

        res.status(200).json({
            success: true,
            message: 'Lessons retrieved successfully',
            data: result.data,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all lessons for a course (flat list)
 * GET /api/lessons/course/:courseId
 */
const getLessonsByCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const includeUnpublished = req.query.includeUnpublished === 'true';

        // Only admin can see unpublished lessons
        const isAdmin = req.user?.role === 'admin';

        const lessons = await LessonService.getLessonsByCourse(
            courseId,
            isAdmin && includeUnpublished
        );

        res.status(200).json({
            success: true,
            message: 'Lessons retrieved successfully',
            data: lessons,
            meta: {
                total: lessons.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get lessons grouped by module
 * GET /api/lessons/course/:courseId/grouped
 */
const getGroupedLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const includeUnpublished = req.query.includeUnpublished === 'true';

        const isAdmin = req.user?.role === 'admin';

        const modules = await LessonService.getGroupedLessons(
            courseId,
            isAdmin && includeUnpublished
        );

        // Calculate totals
        const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
        const totalDuration = modules.reduce((sum, m) => sum + m.totalDuration, 0);

        res.status(200).json({
            success: true,
            message: 'Grouped lessons retrieved successfully',
            data: modules,
            meta: {
                totalModules: modules.length,
                totalLessons,
                totalDuration,
                totalDurationFormatted: formatDuration(totalDuration),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single lesson by ID
 * GET /api/lessons/:id
 */
const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user?.role === 'admin';

        const lesson = await LessonService.getLessonById(id, !isAdmin);

        res.status(200).json({
            success: true,
            message: 'Lesson retrieved successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get free preview lessons
 * GET /api/lessons/course/:courseId/free
 */
const getFreeLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId } = req.params;
        const lessons = await LessonService.getFreeLessons(courseId);

        res.status(200).json({
            success: true,
            message: 'Free lessons retrieved successfully',
            data: lessons,
            meta: {
                total: lessons.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update lesson
 * PATCH /api/lessons/:id
 */
const updateLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await LessonService.updateLesson(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Lesson updated successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete lesson
 * DELETE /api/lessons/:id
 */
const deleteLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await LessonService.deleteLesson(id);

        res.status(200).json({
            success: true,
            message: 'Lesson deleted successfully',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder lessons
 * PATCH /api/lessons/reorder
 */
const reorderLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lessons } = req.body;
        await LessonService.reorderLessons(lessons);

        res.status(200).json({
            success: true,
            message: 'Lessons reordered successfully',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle publish status
 * PATCH /api/lessons/:id/toggle-publish
 */
const togglePublishStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await LessonService.togglePublishStatus(id);

        res.status(200).json({
            success: true,
            message: `Lesson ${lesson?.isPublished ? 'published' : 'unpublished'} successfully`,
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get adjacent lessons (prev/next)
 * GET /api/lessons/:id/adjacent
 */
const getAdjacentLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { courseId } = req.query;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required',
            });
        }

        const adjacent = await LessonService.getAdjacentLessons(
            courseId as string,
            id
        );

        res.status(200).json({
            success: true,
            message: 'Adjacent lessons retrieved successfully',
            data: adjacent,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Format duration (seconds to readable string)
 */
const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

// ==================== Question Controllers ====================

/**
 * Add question to lesson
 * POST /api/lessons/:id/questions
 */
const addQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await LessonService.addQuestion(id, req.body);

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update question in lesson
 * PATCH /api/lessons/:id/questions/:questionId
 */
const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, questionId } = req.params;
        const lesson = await LessonService.updateQuestion(id, questionId, req.body);

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete question from lesson
 * DELETE /api/lessons/:id/questions/:questionId
 */
const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, questionId } = req.params;
        const lesson = await LessonService.deleteQuestion(id, questionId);

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder questions in lesson
 * PATCH /api/lessons/:id/questions/reorder
 */
const reorderQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { questions } = req.body;
        const lesson = await LessonService.reorderQuestions(id, questions);

        res.status(200).json({
            success: true,
            message: 'Questions reordered successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Document Controllers ====================

/**
 * Add document to lesson
 * POST /api/lessons/:id/documents
 */
const addDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await LessonService.addDocument(id, req.body);

        res.status(201).json({
            success: true,
            message: 'Document added successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update document in lesson
 * PATCH /api/lessons/:id/documents/:documentId
 */
const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, documentId } = req.params;
        const lesson = await LessonService.updateDocument(id, documentId, req.body);

        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete document from lesson
 * DELETE /api/lessons/:id/documents/:documentId
 */
const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, documentId } = req.params;
        const lesson = await LessonService.deleteDocument(id, documentId);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== TextBlock Controllers ====================

/**
 * Add text block to lesson
 * POST /api/lessons/:id/text-blocks
 */
const addTextBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await LessonService.addTextBlock(id, req.body);

        res.status(201).json({
            success: true,
            message: 'Text block added successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update text block in lesson
 * PATCH /api/lessons/:id/text-blocks/:textBlockId
 */
const updateTextBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, textBlockId } = req.params;
        const lesson = await LessonService.updateTextBlock(id, textBlockId, req.body);

        res.status(200).json({
            success: true,
            message: 'Text block updated successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete text block from lesson
 * DELETE /api/lessons/:id/text-blocks/:textBlockId
 */
const deleteTextBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, textBlockId } = req.params;
        const lesson = await LessonService.deleteTextBlock(id, textBlockId);

        res.status(200).json({
            success: true,
            message: 'Text block deleted successfully',
            data: lesson,
        });
    } catch (error) {
        next(error);
    }
};

// ==================== Quiz Controllers ====================

/**
 * Get lesson quiz (questions for students)
 * GET /api/lessons/:id/quiz
 */
const getLessonQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const questions = await LessonService.getLessonQuiz(id);

        res.status(200).json({
            success: true,
            message: 'Quiz retrieved successfully',
            data: questions,
            meta: {
                totalQuestions: questions.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit quiz answers
 * POST /api/lessons/:id/quiz/submit
 */
const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const { answers } = req.body;
        const result = await LessonService.submitQuiz(id, userId, answers);

        res.status(200).json({
            success: true,
            message: result.passed ? 'Congratulations! You passed the quiz!' : 'Quiz submitted. Keep practicing!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const LessonController = {
    createLesson,
    bulkCreateLessons,
    getAllLessons,
    getLessonsByCourse,
    getGroupedLessons,
    getLessonById,
    getFreeLessons,
    updateLesson,
    deleteLesson,
    reorderLessons,
    togglePublishStatus,
    getAdjacentLessons,
    // Question management
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    // Document management
    addDocument,
    updateDocument,
    deleteDocument,
    // TextBlock management
    addTextBlock,
    updateTextBlock,
    deleteTextBlock,
    // Quiz
    getLessonQuiz,
    submitQuiz,
};
