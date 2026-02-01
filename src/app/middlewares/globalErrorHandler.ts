// ===================================================================
// Extrain Web Backend - Global Error Handler
// সব error এক জায়গায় handle করার জন্য middleware
// ===================================================================

import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../config';
import AppError from '../utils/AppError';

/**
 * Handle Zod Validation Errors
 * Zod দিয়ে validation fail হলে এই format এ error message তৈরি হবে
 */
const handleZodError = (err: ZodError) => {
  const errors = err.issues.map((issue) => {
    // Clean up the path - remove 'body.' prefix for cleaner messages
    let path = issue.path.join('.');
    if (path.startsWith('body.')) {
      path = path.replace('body.', '');
    }

    // Create user-friendly field names
    const fieldNames: { [key: string]: string } = {
      'code': 'Coupon Code',
      'name': 'Coupon Name',
      'discountType': 'Discount Type',
      'discountValue': 'Discount Value',
      'maxDiscount': 'Maximum Discount',
      'minPurchase': 'Minimum Purchase',
      'installmentEnabled': 'Installment Enabled',
      'installmentCount': 'Installment Count',
      'installmentIntervalDays': 'Installment Interval',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'usageLimit': 'Usage Limit',
      'usagePerUser': 'Per User Limit',
      'applicableTo': 'Applicable To',
      'isActive': 'Active Status'
    };

    const friendlyFieldName = fieldNames[path] || path;

    return {
      path: path,
      message: path ? `${friendlyFieldName}: ${issue.message}` : issue.message,
    };
  });

  // Create a summary message
  const fieldList = errors.map(e => e.path).filter(p => p).join(', ');
  const summaryMessage = fieldList
    ? `Validation Error in: ${fieldList}`
    : 'Validation Error';

  return {
    statusCode: 400,
    message: summaryMessage,
    errorMessages: errors,
  };
};

/**
 * Handle Mongoose Cast Error (Invalid ObjectId)
 * যখন ভুল format এর MongoDB ID পাঠানো হয়
 */
const handleCastError = (err: any) => {
  return {
    statusCode: 400,
    message: `Invalid ${err.path}: ${err.value}`,
    errorMessages: [{ path: err.path, message: `Invalid ${err.path}` }],
  };
};

/**
 * Handle Mongoose Duplicate Key Error
 * যখন unique field এ duplicate value দেওয়া হয়
 */
const handleDuplicateError = (err: any) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    statusCode: 400,
    message: `${field} already exists`,
    errorMessages: [{ path: field, message: `${field} already exists` }],
  };
};

/**
 * Handle Mongoose Validation Error
 * Mongoose schema validation fail হলে
 */
const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => ({
    path: el.path,
    message: el.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessages: errors,
  };
};

/**
 * Global Error Handler Middleware
 * সব ধরনের error এখানে এসে process হবে এবং client কে response যাবে
 */
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Default values
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorMessages: { path: string; message: string }[] = [];

  // ==================== Handle Different Error Types ====================

  // Zod Validation Error (from validateRequest middleware)
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // Custom AppError (thrown intentionally)
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = [{ path: '', message: err.message }];
  }
  // Mongoose CastError (Invalid ObjectId)
  else if (err.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
    errorMessages = [{ path: '', message }];
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
    errorMessages = [{ path: '', message }];
  }
  // Generic Error
  else if (err instanceof Error) {
    message = err.message;
    errorMessages = [{ path: '', message: err.message }];
  }

  // ==================== Send Error Response ====================
  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    // Development mode এ stack trace দেখাবে
    stack: config.env === 'development' ? err.stack : undefined,
  });
};

export default globalErrorHandler;
