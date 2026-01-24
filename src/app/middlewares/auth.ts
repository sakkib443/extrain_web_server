// ===================================================================
// MotionBoss LMS - Authentication Middleware
// JWT Token verify করে user authenticate করার জন্য middleware
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../utils/AppError';
import { User } from '../modules/user/user.model';

/**
 * Extended Request interface with user data
 * Request এ user data attach করার জন্য type extend করা হচ্ছে
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        userId: string;
        email: string;
        role: 'admin' | 'mentor' | 'student';
      };
    }
  }
}

/**
 * authMiddleware - Verify JWT token and attach user to request
 * Protected routes এ এই middleware use করা হবে
 * 
 * @example
 * router.get('/profile', authMiddleware, UserController.getProfile);
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ==================== 1. Get Token from Header ====================
    // Header থেকে Authorization token বের করা
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'You are not logged in. Please login to continue.');
    }

    // "Bearer <token>" থেকে শুধু token part নেওয়া
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'Invalid authentication token.');
    }

    // ==================== 2. Verify Token ====================
    // Token verify করা - valid না হলে error throw হবে
    const decoded = jwt.verify(token, config.jwt.access_secret) as JwtPayload & {
      userId: string;
      email: string;
      role: 'admin' | 'mentor' | 'student';
    };

    // ==================== 3. Check if User Exists ====================
    // User database এ আছে কিনা এবং active কিনা check করা
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(401, 'User belonging to this token no longer exists.');
    }

    if (user.isDeleted) {
      throw new AppError(401, 'This user account has been deleted.');
    }

    if (user.status === 'blocked') {
      throw new AppError(403, 'Your account has been blocked. Contact support.');
    }

    // ==================== 4. Attach User to Request ====================
    // Request object এ user data attach করা যাতে controller থেকে access করা যায়
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * authorizeRoles - Role-based access control middleware
 * নির্দিষ্ট role এর users কে access দেওয়ার জন্য
 * 
 * @example
 * router.delete('/user/:id', authMiddleware, authorizeRoles('admin'), UserController.delete);
 */
export const authorizeRoles = (...allowedRoles: ('admin' | 'mentor' | 'student')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // User এর role allowed list এ আছে কিনা check করা
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action.');
    }
    next();
  };
};

/**
 * optionalAuth - Optional authentication middleware
 * User logged in থাকলে data পাবে, না থাকলেও route access করতে পারবে
 * 
 * @example
 * router.get('/products', optionalAuth, ProductController.getAll);
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.access_secret) as JwtPayload & {
            userId: string;
            email: string;
            role: 'admin' | 'mentor' | 'student';
          };
          req.user = decoded;
        } catch {
          // Token invalid হলে ignore করবো, guest হিসেবে continue করবে
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
