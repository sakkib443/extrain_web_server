const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL পাওয়া যায়নি — .env ফাইলে সেট করুন (.env.example দেখুন)'); process.exit(1); }

async function resetDB() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        console.log('Resetting Website metrics...');
        const websiteResult = await db.collection('websites').updateMany({}, {
            $set: { rating: 0, reviewCount: 0, salesCount: 0, viewCount: 0, likeCount: 0, likedBy: [] }
        });
        console.log(`Updated ${websiteResult.modifiedCount} Websites.`);

        console.log('Resetting Software metrics...');
        const softwareResult = await db.collection('softwares').updateMany({}, {
            $set: { rating: 0, reviewCount: 0, salesCount: 0, viewCount: 0, likeCount: 0, likedBy: [] }
        });
        console.log(`Updated ${softwareResult.modifiedCount} Softwares.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
resetDB();
