// Migration script to add viewCount, likeCount, likedBy to existing websites
// Run this once: npx ts-node src/scripts/migrate-website-stats.ts

import mongoose from 'mongoose';
import config from '../app/config';

const MONGO_URI = config.database_url;

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        // Update all websites that don't have these fields
        const websiteResult = await mongoose.connection.db.collection('websites').updateMany(
            {
                $or: [
                    { viewCount: { $exists: false } },
                    { likeCount: { $exists: false } },
                    { likedBy: { $exists: false } }
                ]
            },
            {
                $set: {
                    viewCount: 0,
                    likeCount: 0,
                    likedBy: []
                }
            }
        );
        console.log(`Websites updated: ${websiteResult.modifiedCount}`);

        // Update all software that don't have these fields
        const softwareResult = await mongoose.connection.db.collection('softwares').updateMany(
            {
                $or: [
                    { viewCount: { $exists: false } },
                    { likeCount: { $exists: false } },
                    { likedBy: { $exists: false } }
                ]
            },
            {
                $set: {
                    viewCount: 0,
                    likeCount: 0,
                    likedBy: []
                }
            }
        );
        console.log(`Software updated: ${softwareResult.modifiedCount}`);

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
