// ===================================================================
// MotionBoss LMS - Lesson Service
// Business logic for Lesson module
// লেসন মডিউলের বিজনেস লজিক
// ===================================================================

import { Lesson } from './lesson.model';
import { Module } from '../module/module.model';
import { Course } from '../course/course.model';
import { ILesson, ILessonFilters, IModuleGroup, IQuestion, IDocument, ITextContent } from './lesson.interface';
import AppError from '../../utils/AppError';
import { Types } from 'mongoose';

/**
 * Create a new lesson
 */
const createLesson = async (payload: Partial<ILesson>): Promise<ILesson> => {
    // Check if course exists
    const course = await Course.findById(payload.course);
    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Create lesson
    const lesson = await Lesson.create(payload);

    // Add lesson ID to Course.lessons array
    await Course.findByIdAndUpdate(payload.course, {
        $addToSet: { lessons: lesson._id },
    });

    // Update course stats
    await updateCourseStats(payload.course!.toString());

    return lesson;
};

/**
 * Create multiple lessons at once
 */
const bulkCreateLessons = async (
    courseId: string,
    lessonsData: Partial<ILesson>[]
): Promise<ILesson[]> => {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new AppError(404, 'Course not found');
    }

    // Add course reference to all lessons
    const lessonsWithCourse = lessonsData.map((lesson) => ({
        ...lesson,
        course: courseId,
    }));

    // Create all lessons
    const lessons = await Lesson.insertMany(lessonsWithCourse);

    // Add lesson IDs to Course.lessons array
    const lessonIds = lessons.map((l) => l._id);
    await Course.findByIdAndUpdate(courseId, {
        $addToSet: { lessons: { $each: lessonIds } },
    });

    // Update course stats
    await updateCourseStats(courseId);

    return lessons as unknown as ILesson[];
};

/**
 * Get all lessons across all courses (for admin)
 */
const getAllLessons = async (
    filters: ILessonFilters,
    paginationOptions: { page?: number; limit?: number }
) => {
    const { searchTerm, course, isFree, isPublished } = filters;
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    if (course) query.course = course;
    if (isFree !== undefined) query.isFree = isFree;
    if (isPublished !== undefined) query.isPublished = isPublished;

    const lessons = await Lesson.find(query)
        .populate('course', 'title thumbnail')
        .populate('module', 'title order')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Lesson.countDocuments(query);

    return {
        data: lessons,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get all lessons for a course (flat list)
 */
const getLessonsByCourse = async (
    courseId: string,
    includeUnpublished: boolean = false
): Promise<ILesson[]> => {
    const query: any = { course: courseId };

    if (!includeUnpublished) {
        query.isPublished = true;
    }

    const lessons = await Lesson.find(query)
        .sort({ moduleOrder: 1, order: 1 })
        .lean();

    return lessons;
};

/**
 * Get lessons grouped by module
 */
const getGroupedLessons = async (
    courseId: string,
    includeUnpublished: boolean = false
): Promise<IModuleGroup[]> => {
    // 1. Get all modules for the course
    const moduleQuery: any = { course: courseId };
    if (!includeUnpublished) {
        moduleQuery.isPublished = true;
    }
    const modules = await Module.find(moduleQuery).sort({ order: 1 }).lean();

    // 2. Get all lessons for the course
    const lessonQuery: any = { course: courseId };
    if (!includeUnpublished) {
        lessonQuery.isPublished = true;
    }
    const lessons = await Lesson.find(lessonQuery).sort({ order: 1 }).lean();

    // 3. Group lessons by module
    const groupedModules: IModuleGroup[] = (modules as any).map((mod: any) => {
        const moduleLessons = (lessons as any).filter(
            (lesson: any) => lesson.module.toString() === mod._id.toString()
        );

        return {
            moduleTitle: mod.title,
            moduleTitleBn: mod.titleBn || '',
            moduleOrder: mod.order,
            moduleDescription: mod.description,
            lessons: moduleLessons,
            totalDuration: moduleLessons.reduce((sum: number, l: any) => sum + l.videoDuration, 0),
            totalLessons: moduleLessons.length,
        };
    });

    return groupedModules;
};

/**
 * Get single lesson by ID
 */
const getLessonById = async (
    lessonId: string,
    checkPublished: boolean = true
): Promise<ILesson | null> => {
    const query: any = { _id: lessonId };

    if (checkPublished) {
        query.isPublished = true;
    }

    const lesson = await Lesson.findOne(query)
        .populate('course', 'title')
        .populate('module', 'title order titleBn description');

    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    return lesson;
};

/**
 * Get free preview lessons for a course
 */
const getFreeLessons = async (courseId: string): Promise<ILesson[]> => {
    const lessons = await Lesson.find({
        course: courseId,
        isFree: true,
        isPublished: true,
    })
        .populate('module')
        .sort({ 'module.order': 1, order: 1 })
        .lean();

    return lessons;
};

/**
 * Update lesson
 */
const updateLesson = async (
    lessonId: string,
    payload: Partial<ILesson>
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, payload, {
        new: true,
        runValidators: true,
    });

    // Update course stats if duration changed
    if (payload.videoDuration !== undefined) {
        await updateCourseStats(lesson.course.toString());
    }

    return updatedLesson;
};

/**
 * Delete lesson
 */
const deleteLesson = async (lessonId: string): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const courseId = lesson.course.toString();

    const deletedLesson = await Lesson.findByIdAndDelete(lessonId);

    // Remove lesson ID from Course.lessons array
    await Course.findByIdAndUpdate(courseId, {
        $pull: { lessons: lessonId },
    });

    // Update course stats
    await updateCourseStats(courseId);

    return deletedLesson;
};

/**
 * Reorder lessons
 */
const reorderLessons = async (
    lessonsOrder: { lessonId: string; moduleId: string; order: number }[]
): Promise<void> => {
    const bulkOps = lessonsOrder.map((item) => ({
        updateOne: {
            filter: { _id: new Types.ObjectId(item.lessonId) },
            update: { $set: { module: new Types.ObjectId(item.moduleId), order: item.order } },
        },
    }));

    await Lesson.bulkWrite(bulkOps as any);
};

/**
 * Toggle lesson publish status
 */
const togglePublishStatus = async (lessonId: string): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    lesson.isPublished = !lesson.isPublished;
    await lesson.save();

    return lesson;
};

/**
 * Update course stats (total duration, lessons count)
 * Internal helper function
 */
const updateCourseStats = async (courseId: string): Promise<void> => {
    // 1. Get lesson stats (total duration and total lessons count)
    const stats = await Lesson.aggregate([
        { $match: { course: new Types.ObjectId(courseId) } },
        {
            $group: {
                _id: null,
                totalDuration: { $sum: '$videoDuration' },
                totalLessons: { $sum: 1 },
            },
        },
    ]);

    // 2. Get total modules count directly from Module collection
    const totalModules = await Module.countDocuments({ course: courseId });

    if (stats.length > 0) {
        await Course.findByIdAndUpdate(courseId, {
            totalDuration: Math.round(stats[0].totalDuration / 60), // Convert to minutes
            totalLessons: stats[0].totalLessons,
            totalModules: totalModules,
        });
    } else {
        await Course.findByIdAndUpdate(courseId, {
            totalDuration: 0,
            totalLessons: 0,
            totalModules: totalModules,
        });
    }
};

/**
 * Get next and previous lesson
 */
const getAdjacentLessons = async (
    courseId: string,
    currentLessonId: string
): Promise<{ prev: ILesson | null; next: ILesson | null }> => {
    const lessons = await Lesson.find({ course: courseId, isPublished: true })
        .populate('module')
        .sort({ 'module.order': 1, order: 1 })
        .lean();

    const currentIndex = lessons.findIndex(
        (l) => l._id?.toString() === currentLessonId
    );

    return {
        prev: currentIndex > 0 ? lessons[currentIndex - 1] : null,
        next: currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null,
    };
};

// ==================== Question Management ====================

/**
 * Add question to lesson
 */
const addQuestion = async (
    lessonId: string,
    questionData: IQuestion
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    // Set order if not provided
    if (!questionData.order) {
        questionData.order = (lesson.questions?.length || 0) + 1;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        {
            $push: { questions: questionData },
            hasQuiz: true,
        },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Update question in lesson
 */
const updateQuestion = async (
    lessonId: string,
    questionId: string,
    questionData: Partial<IQuestion>
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const questionIndex = lesson.questions?.findIndex(
        (q) => q._id?.toString() === questionId
    );

    if (questionIndex === undefined || questionIndex === -1) {
        throw new AppError(404, 'Question not found');
    }

    // Build update object
    const updateFields: any = {};
    Object.keys(questionData).forEach((key) => {
        updateFields[`questions.${questionIndex}.${key}`] = (questionData as any)[key];
    });

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Delete question from lesson
 */
const deleteQuestion = async (
    lessonId: string,
    questionId: string
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        {
            $pull: { questions: { _id: new Types.ObjectId(questionId) } },
        },
        { new: true }
    );

    // Update hasQuiz flag
    if (updatedLesson && (!updatedLesson.questions || updatedLesson.questions.length === 0)) {
        updatedLesson.hasQuiz = false;
        await updatedLesson.save();
    }

    return updatedLesson;
};

/**
 * Reorder questions in lesson
 */
const reorderQuestions = async (
    lessonId: string,
    questionOrders: { questionId: string; order: number }[]
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    // Update each question's order
    for (const item of questionOrders) {
        const questionIndex = lesson.questions?.findIndex(
            (q) => q._id?.toString() === item.questionId
        );
        if (questionIndex !== undefined && questionIndex !== -1 && lesson.questions) {
            lesson.questions[questionIndex].order = item.order;
        }
    }

    // Sort questions by order
    if (lesson.questions) {
        lesson.questions.sort((a, b) => a.order - b.order);
    }

    await lesson.save();
    return lesson;
};

// ==================== Document Management ====================

/**
 * Add document to lesson
 */
const addDocument = async (
    lessonId: string,
    documentData: IDocument
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    // Set order if not provided
    if (!documentData.order) {
        documentData.order = (lesson.documents?.length || 0) + 1;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $push: { documents: documentData } },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Update document in lesson
 */
const updateDocument = async (
    lessonId: string,
    documentId: string,
    documentData: Partial<IDocument>
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const docIndex = lesson.documents?.findIndex(
        (d) => d._id?.toString() === documentId
    );

    if (docIndex === undefined || docIndex === -1) {
        throw new AppError(404, 'Document not found');
    }

    const updateFields: any = {};
    Object.keys(documentData).forEach((key) => {
        updateFields[`documents.${docIndex}.${key}`] = (documentData as any)[key];
    });

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Delete document from lesson
 */
const deleteDocument = async (
    lessonId: string,
    documentId: string
): Promise<ILesson | null> => {
    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $pull: { documents: { _id: new Types.ObjectId(documentId) } } },
        { new: true }
    );

    if (!updatedLesson) {
        throw new AppError(404, 'Lesson not found');
    }

    return updatedLesson;
};

// ==================== TextBlock Management ====================

/**
 * Add text block to lesson
 */
const addTextBlock = async (
    lessonId: string,
    textBlockData: ITextContent
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    if (!textBlockData.order) {
        textBlockData.order = (lesson.textBlocks?.length || 0) + 1;
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $push: { textBlocks: textBlockData } },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Update text block in lesson
 */
const updateTextBlock = async (
    lessonId: string,
    textBlockId: string,
    textBlockData: Partial<ITextContent>
): Promise<ILesson | null> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    const blockIndex = lesson.textBlocks?.findIndex(
        (t) => t._id?.toString() === textBlockId
    );

    if (blockIndex === undefined || blockIndex === -1) {
        throw new AppError(404, 'Text block not found');
    }

    const updateFields: any = {};
    Object.keys(textBlockData).forEach((key) => {
        updateFields[`textBlocks.${blockIndex}.${key}`] = (textBlockData as any)[key];
    });

    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    return updatedLesson;
};

/**
 * Delete text block from lesson
 */
const deleteTextBlock = async (
    lessonId: string,
    textBlockId: string
): Promise<ILesson | null> => {
    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        { $pull: { textBlocks: { _id: new Types.ObjectId(textBlockId) } } },
        { new: true }
    );

    if (!updatedLesson) {
        throw new AppError(404, 'Lesson not found');
    }

    return updatedLesson;
};

// ==================== Quiz Submission & Grading ====================

/**
 * Submit quiz answers and grade them
 */
const submitQuiz = async (
    lessonId: string,
    userId: string,
    answers: { questionId: string; answer: string | string[] }[]
): Promise<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    results: {
        questionId: string;
        correct: boolean;
        userAnswer: string | string[];
        correctAnswer?: string | string[];
        points: number;
        earnedPoints: number;
    }[];
}> => {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    if (!lesson.questions || lesson.questions.length === 0) {
        throw new AppError(400, 'This lesson has no quiz questions');
    }

    let totalScore = 0;
    let totalPoints = 0;
    const results: any[] = [];

    for (const question of lesson.questions) {
        totalPoints += question.points || 1;

        const userAnswerObj = answers.find(
            (a) => a.questionId === question._id?.toString()
        );
        const userAnswer = userAnswerObj?.answer || '';

        let isCorrect = false;
        let correctAnswer: string | string[] = '';

        if (question.type === 'mcq') {
            // Find correct option
            const correctOption = question.options?.find((opt) => opt.isCorrect);
            correctAnswer = correctOption?.text || '';

            // Check if user selected the correct option
            if (typeof userAnswer === 'string') {
                isCorrect = correctOption?._id?.toString() === userAnswer ||
                    correctOption?.text.toLowerCase() === userAnswer.toLowerCase();
            }
        } else if (question.type === 'short') {
            correctAnswer = question.correctAnswer || '';

            // Compare answers
            if (question.caseSensitive) {
                isCorrect = question.correctAnswer?.trim() === (userAnswer as string).trim();
            } else {
                isCorrect = question.correctAnswer?.toLowerCase().trim() ===
                    (userAnswer as string).toLowerCase().trim();
            }
        }

        const earnedPoints = isCorrect ? (question.points || 1) : 0;
        totalScore += earnedPoints;

        results.push({
            questionId: question._id?.toString(),
            correct: isCorrect,
            userAnswer,
            correctAnswer: lesson.quizSettings?.showCorrectAnswers ? correctAnswer : undefined,
            points: question.points || 1,
            earnedPoints,
        });
    }

    const percentage = Math.round((totalScore / totalPoints) * 100);
    const passingScore = lesson.quizSettings?.passingScore || 70;
    const passed = percentage >= passingScore;

    return {
        score: totalScore,
        totalPoints,
        percentage,
        passed,
        results,
    };
};

/**
 * Get lesson quiz (questions without correct answers)
 */
const getLessonQuiz = async (lessonId: string): Promise<IQuestion[]> => {
    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
        throw new AppError(404, 'Lesson not found');
    }

    if (!lesson.questions || lesson.questions.length === 0) {
        return [];
    }

    // Remove correct answer info from questions
    return lesson.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        correctAnswerBn: undefined,
        options: q.options?.map((opt) => ({
            ...opt,
            isCorrect: undefined, // Don't reveal correct answer
        })),
        explanation: undefined,
        explanationBn: undefined,
    })) as IQuestion[];
};

export const LessonService = {
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
    submitQuiz,
    getLessonQuiz,
};
