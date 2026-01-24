// ===================================================================
// Extrain Web Backend - Custom Error Class
// কাস্টম এরর ক্লাস - সব API errors এই ক্লাস দিয়ে handle হবে
// ===================================================================

/**
 * AppError - Custom Error Class for API Errors
 * এই ক্লাস দিয়ে আমরা সব ধরনের API error throw করবো
 * 
 * @example
 * throw new AppError(404, 'User not found');
 * throw new AppError(401, 'Unauthorized access');
 */
class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(statusCode: number, message: string, stack = '') {
        super(message);

        // HTTP Status Code (400, 401, 404, 500 etc.)
        this.statusCode = statusCode;

        // Status string based on code (fail for 4xx, error for 5xx)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Operational errors are expected errors (not programming bugs)
        // অপারেশনাল এরর মানে এমন এরর যা আমরা expect করি (যেমন: user not found)
        this.isOperational = true;

        // Stack trace for debugging
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default AppError;
