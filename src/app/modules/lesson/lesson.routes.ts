// ===================================================================
// MotionBoss LMS - Lesson Routes (Enhanced)
// Lesson module এর API endpoints - Questions, Documents, TextBlocks, Quiz সহ
// লেসন মডিউলের API রাউটস
// ===================================================================

import express from 'express';
import { LessonController } from './lesson.controller';
import { LessonValidation } from './lesson.validation';
import { authMiddleware, authorizeRoles, optionalAuth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

// ==================== Public Routes ====================

// Get free preview lessons for a course
router.get(
    '/course/:courseId/free',
    LessonController.getFreeLessons
);

// Get lessons grouped by module (public - only published)
router.get(
    '/course/:courseId/grouped',
    optionalAuth,
    LessonController.getGroupedLessons
);

// Get all lessons for a course (flat list)
router.get(
    '/course/:courseId',
    optionalAuth,
    LessonController.getLessonsByCourse
);

// ==================== Quiz Routes (Authenticated) ====================

// Get lesson quiz (questions without answers)
router.get(
    '/:id/quiz',
    authMiddleware,
    LessonController.getLessonQuiz
);

// Submit quiz answers
router.post(
    '/:id/quiz/submit',
    authMiddleware,
    validateRequest(LessonValidation.submitQuizSchema),
    LessonController.submitQuiz
);

// ==================== Authenticated Routes ====================

// Get adjacent lessons (prev/next) - for enrolled students
router.get(
    '/:id/adjacent',
    authMiddleware,
    LessonController.getAdjacentLessons
);

// Get single lesson by ID
router.get(
    '/:id',
    optionalAuth,
    LessonController.getLessonById
);

// ==================== Admin Only Routes ====================

// Get all lessons (admin and mentor)
router.get(
    '/',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    LessonController.getAllLessons
);

// Create new lesson (Admin and Mentor)
router.post(
    '/',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.createLessonSchema),
    LessonController.createLesson
);

// Bulk create lessons (Admin and Mentor)
router.post(
    '/bulk',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.bulkCreateLessonsSchema),
    LessonController.bulkCreateLessons
);

// Reorder lessons (Admin and Mentor)
router.patch(
    '/reorder',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.reorderLessonsSchema),
    LessonController.reorderLessons
);

// Toggle publish status (Admin and Mentor)
router.patch(
    '/:id/toggle-publish',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    LessonController.togglePublishStatus
);

// Update lesson (Admin and Mentor)
router.patch(
    '/:id',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.updateLessonSchema),
    LessonController.updateLesson
);

// Delete lesson
router.delete(
    '/:id',
    authMiddleware,
    authorizeRoles('admin'),
    LessonController.deleteLesson
);

// ==================== Question Routes (Admin) ====================

// Add question to lesson (Admin and Mentor)
router.post(
    '/:id/questions',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.addQuestionSchema),
    LessonController.addQuestion
);

// Reorder questions (must be before :questionId route) (Admin and Mentor)
router.patch(
    '/:id/questions/reorder',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    LessonController.reorderQuestions
);

// Update question (Admin and Mentor)
router.patch(
    '/:id/questions/:questionId',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.updateQuestionSchema),
    LessonController.updateQuestion
);

// Delete question
router.delete(
    '/:id/questions/:questionId',
    authMiddleware,
    authorizeRoles('admin'),
    LessonController.deleteQuestion
);

// ==================== Document Routes (Admin) ====================

// Add document to lesson (Admin and Mentor)
router.post(
    '/:id/documents',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.addDocumentSchema),
    LessonController.addDocument
);

// Update document (Admin and Mentor)
router.patch(
    '/:id/documents/:documentId',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    LessonController.updateDocument
);

// Delete document
router.delete(
    '/:id/documents/:documentId',
    authMiddleware,
    authorizeRoles('admin'),
    LessonController.deleteDocument
);

// ==================== TextBlock Routes (Admin) ====================

// Add text block to lesson (Admin and Mentor)
router.post(
    '/:id/text-blocks',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    validateRequest(LessonValidation.addTextBlockSchema),
    LessonController.addTextBlock
);

// Update text block (Admin and Mentor)
router.patch(
    '/:id/text-blocks/:textBlockId',
    authMiddleware,
    authorizeRoles('admin', 'mentor'),
    LessonController.updateTextBlock
);

// Delete text block
router.delete(
    '/:id/text-blocks/:textBlockId',
    authMiddleware,
    authorizeRoles('admin'),
    LessonController.deleteTextBlock
);

export const LessonRoutes = router;
