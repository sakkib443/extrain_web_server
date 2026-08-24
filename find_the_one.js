const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL পাওয়া যায়নি — .env ফাইলে সেট করুন (.env.example দেখুন)'); process.exit(1); }

async function findTheOne() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        const web = await db.collection('websites').findOne({
            $or: [
                { viewCount: { $gt: 0 } },
                { likeCount: { $gt: 0 } },
                { salesCount: { $gt: 0 } },
                { rating: { $gt: 0 } }
            ]
        });
        console.log('Website needing reset:', web);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findTheOne();
