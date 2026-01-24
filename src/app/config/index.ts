// ===================================================================
// Extrain Web Backend - Configuration File
// কনফিগারেশন ফাইল - সব environment variables এখানে manage হবে
// ===================================================================

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root directory
// রুট ডিরেক্টরি থেকে .env ফাইল লোড করা হচ্ছে
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  // ==================== Server Configuration ====================
  // সার্ভার কনফিগারেশন
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // ==================== Database Configuration ====================
  // ডাটাবেস কনফিগারেশন (MongoDB)
  database_url: process.env.DATABASE_URL || 'mongodb://localhost:27017/Extrain Web',

  // ==================== JWT Configuration ====================
  // JWT টোকেন কনফিগারেশন (Authentication)
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // ==================== Bcrypt Configuration ====================
  // Password hashing এর জন্য salt rounds
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  // ==================== Cloudinary Configuration ====================
  // ফাইল আপলোড করার জন্য Cloudinary সেটিংস
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // ==================== Email Configuration ====================
  // ইমেইল পাঠানোর জন্য SMTP সেটিংস
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@Extrain Web.com',
  },

  // ==================== Frontend URL ====================
  // Frontend URL (CORS এবং password reset link এর জন্য)
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',

  // ==================== Pagination Defaults ====================
  // ডিফল্ট পেজিনেশন সেটিংস
  pagination: {
    default_page: 1,
    default_limit: 10,
    max_limit: 100,
  },

  // ==================== bKash Payment Configuration ====================
  // বিকাশ পেমেন্ট গেটওয়ে সেটিংস
  bkash: {
    app_key: process.env.BKASH_APP_KEY || 'demo_app_key',
    app_secret: process.env.BKASH_APP_SECRET || 'demo_app_secret',
    username: process.env.BKASH_USERNAME || 'demo_username',
    password: process.env.BKASH_PASSWORD || 'demo_password',
    base_url: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  },
};
