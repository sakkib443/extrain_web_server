// ===================================================================
// MotionBoss LMS - User Interface
// User মডেলের TypeScript interface definitions
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * User Role Types
 * admin - System administrator with full access
 * mentor - Limited admin access (create/update only, no delete, no analytics)
 * student - Learner who enrolls in courses and purchases products
 */
export type TUserRole = 'admin' | 'mentor' | 'student';

/**
 * User Status Types
 * active - Normal active user
 * blocked - Blocked by admin
 * pending - Awaiting email verification
 */
export type TUserStatus = 'active' | 'blocked' | 'pending';

/**
 * IUser - Main User Interface
 * Database এ যে format এ user data save হবে
 */
export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;  // Mandatory phone number
  avatar?: string;
  role: TUserRole;
  status: TUserStatus;
  isEmailVerified: boolean;
  isDeleted: boolean;

  // ==================== Extended Profile Fields ====================
  bio?: string;           // Short biography
  address?: string;       // Street address
  city?: string;          // City name
  country?: string;       // Country name
  website?: string;       // Personal/company website
  company?: string;       // Company/organization name
  jobTitle?: string;      // Job designation
  dateOfBirth?: Date;     // Birth date
  gender?: 'male' | 'female' | 'other';

  // Social media links
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };

  // Skills/expertise
  skills?: string[];

  // LMS Specific Fields
  enrolledCourses?: Types.ObjectId[];   // Courses enrolled
  completedCourses?: Types.ObjectId[];  // Courses completed
  certificates?: Types.ObjectId[];      // Earned certificates

  // Statistics - Auto updated
  totalPurchases: number;
  totalSpent: number;
  totalCoursesEnrolled: number;         // Total courses enrolled
  totalCoursesCompleted: number;        // Total courses completed

  // Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * IUserMethods - Instance Methods
 * User document এর উপর যে methods call করা যাবে
 */
export interface IUserMethods {
  // Password compare করার জন্য method
  comparePassword(candidatePassword: string): Promise<boolean>;

  // JWT token তৈরি করার পর password change হয়েছে কিনা check
  isPasswordChangedAfterJwtIssued(jwtTimestamp: number): boolean;
}

/**
 * UserModel - Static Methods
 * User.method() এভাবে call করা যাবে এমন methods
 */
export interface UserModel extends Model<IUser, object, IUserMethods> {
  // Email দিয়ে user খুঁজে বের করা (password সহ)
  findByEmail(email: string): Promise<IUser & IUserMethods>;

  // User exist করে কিনা check
  isUserExists(email: string): Promise<boolean>;
}

/**
 * IUserFilters - Query Filters
 * User list filter করার জন্য
 */
export interface IUserFilters {
  searchTerm?: string;
  email?: string;
  role?: TUserRole;
  status?: TUserStatus;
}
