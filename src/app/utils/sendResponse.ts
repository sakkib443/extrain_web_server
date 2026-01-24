// ===================================================================
// Extrain Web Backend - Response Helper
// সব API response এক format এ send করার জন্য helper
// ===================================================================

import { Response } from 'express';

/**
 * Response interface - সব API response এই format এ হবে
 */
interface IResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * sendResponse - Standardized API Response Sender
 * সব controller থেকে এই function call করে response পাঠাবো
 * 
 * @example
 * sendResponse(res, {
 *   statusCode: 200,
 *   success: true,
 *   message: 'User fetched successfully',
 *   data: user
 * });
 */
const sendResponse = <T>(res: Response, data: IResponse<T>): void => {
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        meta: data.meta,
        data: data.data,
    });
};

export default sendResponse;
