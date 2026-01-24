// ===================================================================
// Extrain Web Backend - Request Validation Middleware
// Zod দিয়ে request body validate করার জন্য middleware
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

/**
 * validateRequest - Middleware to validate request using Zod schema
 * Controller এ data যাওয়ার আগে এই middleware validate করে
 * 
 * @example
 * router.post('/signup', validateRequest(userValidationSchema), UserController.create);
 */
const validateRequest = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body, query, params, and cookies
      // সব ধরনের request data validate করা হচ্ছে
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      // Validation pass হলে next middleware/controller এ যাবে
      next();
    } catch (error) {
      // Validation fail হলে error globalErrorHandler এ যাবে
      next(error);
    }
  };
};

export default validateRequest;
