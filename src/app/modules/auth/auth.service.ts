// ===================================================================
// MotionBoss LMS - Auth Service
// Authentication business logic (login, register, token management)
// ===================================================================

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config';
import AppError from '../../utils/AppError';
import { User } from '../user/user.model';
import { IAuthResponse, IJwtPayload, ITokens } from './auth.interface';
import { TLoginInput, TRegisterInput } from './auth.validation';
import EmailService from '../email/email.service';

// ===================================================================
// AUTH SERVICE
// ===================================================================

const AuthService = {
    // ==================== GENERATE TOKENS ====================
    /**
     * Generate access and refresh tokens
     * JWT tokens তৈরি করা
     */
    generateTokens(payload: IJwtPayload): ITokens {
        // Access Token (Short lived - 1 day)
        const accessToken = jwt.sign(payload, config.jwt.access_secret, {
            expiresIn: config.jwt.access_expires_in as SignOptions['expiresIn'],
        });

        // Refresh Token (Long lived - 7 days)
        const refreshToken = jwt.sign(payload, config.jwt.refresh_secret, {
            expiresIn: config.jwt.refresh_expires_in as SignOptions['expiresIn'],
        });

        return { accessToken, refreshToken };
    },

    // ==================== REGISTER ====================
    /**
     * Register a new user
     * নতুন user তৈরি এবং tokens generate করা
     */
    async register(payload: TRegisterInput): Promise<IAuthResponse> {
        // Check if email already exists
        const isExists = await User.isUserExists(payload.email);
        if (isExists) {
            throw new AppError(400, 'Email already registered. Please login.');
        }

        // Create user
        const user = await User.create({
            ...payload,
            status: 'active', // Or 'pending' if email verification required
            isEmailVerified: false,
        });

        // Generate tokens
        const jwtPayload: IJwtPayload = {
            userId: user._id!.toString(),
            email: user.email,
            role: user.role,
        };

        const tokens = this.generateTokens(jwtPayload);

        // Send welcome email (async, don't wait)
        EmailService.sendWelcomeEmail(user.email, user.firstName).catch(err =>
            console.error('Welcome email error:', err)
        );

        return {
            user: {
                _id: user._id!.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
            tokens,
        };
    },

    // ==================== LOGIN ====================
    /**
     * Login user with email and password
     * Email এবং password দিয়ে login করা
     */
    async login(payload: TLoginInput): Promise<IAuthResponse> {
        const { email, password } = payload;

        // Find user with password
        const user = await User.findByEmail(email);

        if (!user) {
            throw new AppError(401, 'Invalid email or password');
        }

        // Check if user is deleted
        if (user.isDeleted) {
            throw new AppError(401, 'This account has been deleted');
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            throw new AppError(403, 'Your account has been blocked. Contact support.');
        }

        // Verify password
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw new AppError(401, 'Invalid email or password');
        }

        // Generate tokens
        const jwtPayload: IJwtPayload = {
            userId: user._id!.toString(),
            email: user.email,
            role: user.role,
        };

        const tokens = this.generateTokens(jwtPayload);

        return {
            user: {
                _id: user._id!.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
            tokens,
        };
    },

    // ==================== REFRESH TOKEN ====================
    /**
     * Generate new access token using refresh token
     * Refresh token দিয়ে নতুন access token নেওয়া
     */
    async refreshToken(refreshToken: string): Promise<ITokens> {
        // Verify refresh token
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(refreshToken, config.jwt.refresh_secret) as JwtPayload;
        } catch {
            throw new AppError(401, 'Invalid or expired refresh token');
        }

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user || user.isDeleted) {
            throw new AppError(401, 'User not found');
        }

        if (user.status === 'blocked') {
            throw new AppError(403, 'Your account has been blocked');
        }

        // Check if password was changed after token was issued
        if (user.isPasswordChangedAfterJwtIssued(decoded.iat as number)) {
            throw new AppError(401, 'Password changed. Please login again.');
        }

        // Generate new tokens
        const jwtPayload: IJwtPayload = {
            userId: user._id!.toString(),
            email: user.email,
            role: user.role,
        };

        return this.generateTokens(jwtPayload);
    },

    // ==================== FORGOT PASSWORD ====================
    /**
     * Generate password reset token and send email
     * Password reset এর জন্য token তৈরি করা
     */
    async forgotPassword(email: string): Promise<string> {
        const user = await User.findOne({ email, isDeleted: false });

        if (!user) {
            throw new AppError(404, 'No user found with this email');
        }

        // Generate random reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token and save to database
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save({ validateBeforeSave: false });

        // Return plain token (will be sent via email)
        // TODO: Send email with reset link
        return resetToken;
    },

    // ==================== RESET PASSWORD ====================
    /**
     * Reset password using token
     * Token দিয়ে password reset করা
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
            isDeleted: false,
        });

        if (!user) {
            throw new AppError(400, 'Invalid or expired reset token');
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
    },

    // ==================== UPDATE PASSWORD ====================
    /**
     * Update password for logged-in user
     * Logged-in user এর password update করা
     */
    async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        // Find user with password
        const user = await User.findById(userId).select('+password');

        if (!user || user.isDeleted) {
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

    // ==================== VERIFY TOKEN ====================
    /**
     * Verify access token and return payload
     * Token verify করা
     */
    verifyAccessToken(token: string): IJwtPayload {
        try {
            const decoded = jwt.verify(token, config.jwt.access_secret) as IJwtPayload;
            return decoded;
        } catch {
            throw new AppError(401, 'Invalid or expired token');
        }
    },
};

export default AuthService;
