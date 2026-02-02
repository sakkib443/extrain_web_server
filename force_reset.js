const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

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
