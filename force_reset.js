const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL পাওয়া যায়নি — .env ফাইলে সেট করুন (.env.example দেখুন)'); process.exit(1); }

async function forceReset() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        console.log('Force Resetting all Websites...');
        const r1 = await db.collection('websites').updateMany({}, {
            $set: {
                viewCount: 0,
                likeCount: 0,
                salesCount: 0,
                rating: 0,
                reviewCount: 0,
                likedBy: []
            }
        });
        console.log(`Updated ${r1.modifiedCount} of ${r1.matchedCount} Websites.`);

        console.log('Force Resetting all Softwares...');
        const r2 = await db.collection('softwares').updateMany({}, {
            $set: {
                viewCount: 0,
                likeCount: 0,
                salesCount: 0,
                rating: 0,
                reviewCount: 0,
                likedBy: []
            }
        });
        console.log(`Updated ${r2.modifiedCount} of ${r2.matchedCount} Softwares.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
forceReset();
