// ===================================================================
// MotionBoss LMS - User Model
// MongoDB User Schema with Mongoose
// ===================================================================

import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../../config';
import { IUser, IUserMethods, UserModel } from './user.interface';

/**
 * User Schema Definition
 * User collection এর structure এখানে define করা হয়েছে
 */
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    // ==================== Basic Info ====================
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Password default এ query result এ আসবে না
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '', // Default avatar URL রাখা যায়
    },

    // ==================== Extended Profile Fields ====================
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters'],
      default: '',
    },
    city: {
      type: String,
      maxlength: [100, 'City cannot exceed 100 characters'],
      default: '',
    },
    country: {
      type: String,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      default: '',
    },
    jobTitle: {
      type: String,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other', ''],
        message: '{VALUE} is not a valid gender',
      },
      default: '',
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    skills: {
      type: [String],
      default: [],
    },

    // ==================== Role & Status ====================
    role: {
      type: String,
      enum: {
        values: ['admin', 'mentor', 'student'],
        message: '{VALUE} is not a valid role',
      },
      default: 'student',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'blocked', 'pending'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // ==================== Statistics ====================
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalCoursesEnrolled: {
      type: Number,
      default: 0,
    },
    totalCoursesCompleted: {
      type: Number,
      default: 0,
    },

    // ==================== LMS Specific ====================
    enrolledCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    completedCourses: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    certificates: [{
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
    }],

    // ==================== Password Reset ====================
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true, // createdAt, updatedAt auto add হবে
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password; // JSON এ password থাকবে না
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ==================== Indexes ====================
// Search performance বাড়ানোর জন্য indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// ==================== Virtual Fields ====================
// fullName virtual field - firstName + lastName
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== Pre-Save Middleware ====================
// Password hash করা save এর আগে
userSchema.pre('save', async function (next) {
  // Password modify হলেই hash করবো
  if (!this.isModified('password')) {
    return next();
  }

  // Password hash করা
  this.password = await bcrypt.hash(this.password, config.bcrypt_salt_rounds);

  // Password change time update
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

// Deleted users কে query থেকে বাদ দেওয়া
userSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// ==================== Instance Methods ====================
// Password compare করার method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// JWT issue এর পর password change হয়েছে কিনা
userSchema.methods.isPasswordChangedAfterJwtIssued = function (
  jwtTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// ==================== Static Methods ====================
// Email দিয়ে user খুঁজে বের করা (password সহ)
userSchema.statics.findByEmail = async function (email: string) {
  return await this.findOne({ email }).select('+password');
};

// User exist করে কিনা
userSchema.statics.isUserExists = async function (email: string) {
  const user = await this.findOne({ email });
  return !!user;
};

// ==================== Export Model ====================
export const User = model<IUser, UserModel>('User', userSchema);
