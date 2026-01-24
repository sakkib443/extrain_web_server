// ===================================================================
// ExtraWeb Backend - User Service
// User related business logic (CRUD operations)
// ===================================================================

import { FilterQuery, SortOrder } from 'mongoose';
import config from '../../config';
import AppError from '../../utils/AppError';
import { IUser, IUserFilters, TUserRole, TUserStatus } from './user.interface';
import { User } from './user.model';
import { TCreateUserInput, TUpdateUserInput } from './user.validation';

/**
 * Pagination Options Interface
 */
interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination Result Interface
 */
interface IPaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===================================================================
// USER SERVICE CLASS
// ===================================================================

const UserService = {
  // ==================== CREATE USER ====================
  /**
   * Create a new user
   * নতুন user তৈরি করা (registration এ use হবে)
   */
  async createUser(payload: TCreateUserInput): Promise<IUser> {
    // Check if email already exists
    const isExists = await User.isUserExists(payload.email);
    if (isExists) {
      throw new AppError(400, 'Email already registered. Please login.');
    }

    // Create user
    const user = await User.create(payload);

    // Password remove করে return
    const userObject = user.toObject();
    delete (userObject as any).password;

    return userObject;
  },

  // ==================== GET ALL USERS (ADMIN) ====================
  /**
   * Get all users with pagination and filters
   * Admin panel এর জন্য সব users fetch করা
   */
  async getAllUsers(
    filters: IUserFilters,
    paginationOptions: IPaginationOptions
  ): Promise<IPaginationResult<IUser>> {
    const { searchTerm, ...filterData } = filters;
    const {
      page = config.pagination.default_page,
      limit = config.pagination.default_limit,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = paginationOptions;

    // Build search conditions
    const andConditions: FilterQuery<IUser>[] = [];

    // Search in multiple fields
    if (searchTerm) {
      andConditions.push({
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
        ],
      });
    }

    // Exact match filters
    if (Object.keys(filterData).length) {
      andConditions.push({
        $and: Object.entries(filterData).map(([field, value]) => ({
          [field]: value,
        })),
      });
    }

    const whereConditions = andConditions.length > 0 ? { $and: andConditions } : {};

    // Sort order
    const sortConditions: { [key: string]: SortOrder } = {};
    sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const users = await User.find(whereConditions)
      .sort(sortConditions)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(whereConditions);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ==================== GET SINGLE USER ====================
  /**
   * Get user by ID
   * Single user details fetch করা
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  // ==================== GET USER BY EMAIL ====================
  /**
   * Get user by email (with password for login)
   * Login এ use হবে
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findByEmail(email);
  },

  // ==================== UPDATE USER PROFILE ====================
  /**
   * Update user profile (self update)
   * User নিজে নিজের profile update করবে
   */
  async updateProfile(userId: string, payload: TUpdateUserInput): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  // ==================== ADMIN UPDATE USER ====================
  /**
   * Admin update user (role, status change)
   * Admin user এর role, status পরিবর্তন করতে পারবে
   */
  async adminUpdateUser(
    userId: string,
    payload: Partial<IUser>
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  // ==================== DELETE USER (SOFT DELETE) ====================
  /**
   * Soft delete user
   * User কে permanently delete না করে isDeleted = true করা
   */
  async deleteUser(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true, status: 'blocked' },
      { new: true }
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  // ==================== CHANGE PASSWORD ====================
  /**
   * Change user password
   * Password change করা (old password verify করে)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  },

  // ==================== UPDATE USER STATS ====================
  /**
   * Update purchase statistics
   * Order complete হলে stats update করা
   */
  async updatePurchaseStats(
    userId: string,
    amount: number
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalPurchases: 1,
        totalSpent: amount,
      },
    });
  },

  // ==================== GET USER STATS (ADMIN) ====================
  /**
   * Get user statistics for dashboard
   * Admin dashboard এর জন্য user stats
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    blocked: number;
    pending: number;
    buyers: number;
    sellers: number;
    admins: number;
  }> {
    const [total, active, blocked, pending, buyers, sellers, admins] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ status: 'active', isDeleted: false }),
      User.countDocuments({ status: 'blocked', isDeleted: false }),
      User.countDocuments({ status: 'pending', isDeleted: false }),
      User.countDocuments({ role: 'buyer', isDeleted: false }),
      User.countDocuments({ role: 'seller', isDeleted: false }),
      User.countDocuments({ role: 'admin', isDeleted: false }),
    ]);

    return { total, active, blocked, pending, buyers, sellers, admins };
  },
};

export default UserService;
