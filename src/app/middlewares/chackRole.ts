// src/app/middlewares/checkRole.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware: Role-based access control
 * Usage: checkRole('admin'), checkRole('mentor', 'student')
 */
export const checkRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // No user or role not allowed
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this route',
      });
    }

    // Role matched, proceed
    next();
  };
};

// Example Usage in route:
// router.get('/admin-area', authMiddleware, checkRole('admin'), AdminController.getDashboard);
// router.post('/course', authMiddleware, checkRole('mentor'), CourseController.createCourse);
