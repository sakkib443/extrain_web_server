const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL পাওয়া যায়নি — .env ফাইলে সেট করুন (.env.example দেখুন)'); process.exit(1); }

async function inspectData() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        const web = await db.collection('websites').findOne({});
        console.log('Website Example:', web);

        const soft = await db.collection('softwares').findOne({});
        console.log('Software Example:', soft);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspectData();
