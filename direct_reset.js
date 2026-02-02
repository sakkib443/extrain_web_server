const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

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
