// ===================================================================
// Extrain Web Backend - Async Error Wrapper
// Async ফাংশনের error catch করার জন্য wrapper
// ===================================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * catchAsync - Wraps async controller functions to catch errors
 * এই wrapper ব্যবহার করলে প্রতিটা controller এ try-catch লিখতে হবে না
 * 
 * @example
 * const createUser = catchAsync(async (req, res) => {
 *   const user = await UserService.create(req.body);
 *   res.status(201).json({ success: true, data: user });
 * });
 */
const catchAsync = (fn: RequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Promise এর error automatic catch হয়ে globalErrorHandler এ যাবে
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};

export default catchAsync;
