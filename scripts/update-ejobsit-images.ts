// Update eJobsIT LMS with gallery images
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const galleryImages = [
    // LMS Dashboard Screenshots (using sample images from Envato/Cloudinary placeholders)
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop", // Dashboard Analytics
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop", // Admin Panel
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop", // Course Page
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop", // Student Dashboard
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=800&fit=crop", // Learning Platform
    "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1200&h=800&fit=crop"  // Courses Grid
];

async function updateImages() {
    try {
        const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MongoDB URI not found');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected');

        const db = mongoose.connection.db;

        const result = await db.collection('websites').updateOne(
            { title: { $regex: /eJobsIT LMS/i } },
            {
                $set: {
                    images: galleryImages,
                    lastUpdate: new Date()
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log('✅ Gallery images updated successfully!');
            console.log(`📸 ${galleryImages.length} images added`);
        } else {
            console.log('⚠️ No document found or already updated');
        }

        await mongoose.disconnect();
        console.log('🔌 Disconnected');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateImages();
