/**
 * Admin Seed Script
 * Run this to create an admin user
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.DATABASE_URL!;

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Delete existing admin first (to recreate with fresh password)
        await usersCollection.deleteOne({ email: 'admin@motionboss.com' });
        console.log('Removed old admin user (if existed)');

        // Hash password with same salt rounds as in config (12)
        const hashedPassword = await bcrypt.hash('Admin@123', 12);

        // Create admin user with correct fields
        const adminUser = {
            email: 'admin@motionboss.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            phone: '',
            avatar: '',
            bio: '',
            address: '',
            city: '',
            country: '',
            website: '',
            company: '',
            jobTitle: '',
            gender: '',
            socialLinks: {
                facebook: '',
                twitter: '',
                linkedin: '',
                github: '',
                instagram: ''
            },
            skills: [],
            role: 'admin',
            status: 'active',
            isEmailVerified: true,
            isDeleted: false,
            totalPurchases: 0,
            totalSpent: 0,
            totalCoursesEnrolled: 0,
            totalCoursesCompleted: 0,
            enrolledCourses: [],
            completedCourses: [],
            certificates: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await usersCollection.insertOne(adminUser);

        console.log('');
        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('📧 Email: admin@motionboss.com');
        console.log('🔑 Password: Admin@123');
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedAdmin();
