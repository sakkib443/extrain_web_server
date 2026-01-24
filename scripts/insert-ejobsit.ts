// Script to insert eJobsIT LMS website product
// Run with: npx ts-node scripts/insert-ejobsit.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const websiteData = {
    title: "eJobsIT LMS - Premium Learning Management & Digital Marketplace",
    slug: "ejobsit-lms-premium-learning-management-digital-marketplace-" + Date.now(),
    platform: "Next.js",
    category: new mongoose.Types.ObjectId("6974845527f13ce95029564e"), // LMS category
    subCategory: "LMS + E-commerce",
    accessType: "paid",
    price: 85000,
    offerPrice: 50000,
    rating: 5,
    reviewCount: 12,
    salesCount: 45,
    viewCount: 1250,
    likeCount: 89,
    description: "Complete LMS & Digital Marketplace solution with Next.js 14, Node.js, MongoDB. Features 84+ pages, Admin/Mentor/Student dashboards, bKash payment, Cloudinary uploads, multi-language support (EN/BN), dark mode, and real-time notifications.",
    longDescription: `## 🚀 eJobsIT LMS - Complete Solution

### ✨ Key Highlights
- **84+ Frontend Pages** - Full-featured public site + 3 dashboards
- **23 Backend API Modules** - Complete REST API with Zod validation
- **Real-time Notifications** - Order, enrollment, review alerts
- **bKash Payment Gateway** - Bangladesh payment integration
- **Multi-language** - English & Bengali with persistent preference
- **Dark/Light Mode** - System theme detection

### 📊 Dashboard Features
- **Admin (24 pages)** - Full control, analytics, reports, PDF export
- **Mentor (13 pages)** - Course management, student tracking, earnings
- **Student (15 pages)** - Learning progress, certificates, downloads

### 🎓 LMS Features
- Course creation with modules & lessons
- Video (YouTube/Vimeo), Text, Quiz, Document lessons
- Progress tracking & certificate generation
- Enrollment management

### 🛒 E-commerce Features
- Shopping cart & wishlist
- Coupon/discount system
- Order management
- Digital downloads

### 🔧 Tech Stack
- Frontend: Next.js 14, Tailwind CSS, Redux Toolkit, Framer Motion
- Backend: Node.js, Express.js, MongoDB, JWT Auth
- Services: Cloudinary, Nodemailer, bKash SDK`,
    images: [
        "https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg"
    ],
    previewUrl: "https://ejobsit-lms-demo.vercel.app",
    downloadFile: "https://drive.google.com/file/d/ejobsit-lms-source",
    features: [
        "84+ Frontend Pages with 3 Dashboards",
        "23 Backend API Modules",
        "Real-time Notification System",
        "bKash Payment Gateway Integration",
        "Multi-language Support (EN/BN)",
        "Dark/Light Mode with Theme Persistence",
        "Cloudinary File & Image Upload",
        "PDF Report Generation (jsPDF)",
        "Coupon & Discount System",
        "Quiz System with Auto-scoring",
        "Certificate Generation & Verification",
        "Responsive Design (Mobile First)"
    ],
    technologies: [
        "Next.js 14",
        "Node.js",
        "Express.js",
        "MongoDB",
        "Tailwind CSS",
        "Redux Toolkit",
        "Framer Motion",
        "Cloudinary",
        "bKash SDK",
        "JWT Auth",
        "Zod",
        "Nodemailer"
    ],
    status: "approved",
    isDeleted: false,
    isFeatured: true,
    publishDate: new Date(),
    lastUpdate: new Date()
};

async function insertWebsite() {
    try {
        const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const result = await db.collection('websites').insertOne(websiteData);

        console.log('✅ eJobsIT LMS inserted successfully!');
        console.log('📌 Document ID:', result.insertedId);
        console.log('💰 Price: ৳85,000 → ৳50,000 (Offer)');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

insertWebsite();
