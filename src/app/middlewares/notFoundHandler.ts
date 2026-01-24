// ===================================================================
// Extrain Web Backend - 404 Not Found Handler
// যে route exist করে না সেগুলোর জন্য 404 error
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';

/**
 * notFoundHandler - Handle 404 Not Found errors
 * যখন কোনো route match করে না তখন এই middleware কাজ করে
 * 
 * @example
 * // app.ts এ সব route এর পরে add করতে হবে
 * app.use(notFoundHandler);
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    next(new AppError(404, `Route ${req.originalUrl} not found on this server.`));
};

export default notFoundHandler;
