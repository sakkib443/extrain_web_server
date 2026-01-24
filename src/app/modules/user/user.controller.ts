// ===================================================================
// ExtraWeb Backend - User Controller
// HTTP Request handling for User module
// ===================================================================

import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import UserService from './user.service';
import pick from '../../utils/pick';
import { IUserFilters } from './user.interface';

// ===================================================================
// USER CONTROLLER
// ===================================================================

const UserController = {
  // ==================== GET CURRENT USER PROFILE ====================
  /**
   * GET /api/users/me
   * Logged in user এর নিজের profile fetch
   */
  getMyProfile: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await UserService.getUserById(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile fetched successfully',
      data: user,
    });
  }),

  // ==================== UPDATE CURRENT USER PROFILE ====================
  /**
   * PATCH /api/users/me
   * Logged in user নিজের profile update করা
   */
  updateMyProfile: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await UserService.updateProfile(userId, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  }),

  // ==================== CHANGE PASSWORD ====================
  /**
   * PATCH /api/users/change-password
   * Password change করা
   */
  changePassword: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await UserService.changePassword(userId, currentPassword, newPassword);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Password changed successfully',
    });
  }),

  // ==================== GET ALL USERS (ADMIN) ====================
  /**
   * GET /api/admin/users
   * Admin - সব users list করা with filtering & pagination
   */
  getAllUsers: catchAsync(async (req: Request, res: Response) => {
    // Filter options extract করা
    const filters = pick(req.query, [
      'searchTerm',
      'email',
      'role',
      'status',
    ]) as IUserFilters;

    // Pagination options extract করা
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);

    // String to number convert
    const options = {
      page: paginationOptions.page ? Number(paginationOptions.page) : undefined,
      limit: paginationOptions.limit ? Number(paginationOptions.limit) : undefined,
      sortBy: paginationOptions.sortBy as string | undefined,
      sortOrder: paginationOptions.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await UserService.getAllUsers(filters, options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Users fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  }),

  // ==================== GET SINGLE USER (ADMIN) ====================
  /**
   * GET /api/admin/users/:id
   * Admin - Single user details
   */
  getSingleUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  }),

  // ==================== UPDATE USER (ADMIN) ====================
  /**
   * PATCH /api/admin/users/:id
   * Admin - User role, status update করা
   */
  updateUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.adminUpdateUser(id, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  }),

  // ==================== DELETE USER (ADMIN) ====================
  /**
   * DELETE /api/admin/users/:id
   * Admin - User soft delete করা
   */
  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await UserService.deleteUser(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User deleted successfully',
    });
  }),

  // ==================== GET USER STATS (ADMIN) ====================
  /**
   * GET /api/admin/users/stats
   * Admin dashboard এর জন্য user statistics
   */
  getUserStats: catchAsync(async (req: Request, res: Response) => {
    const stats = await UserService.getUserStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User stats fetched successfully',
      data: stats,
    });
  }),
};

export default UserController;
