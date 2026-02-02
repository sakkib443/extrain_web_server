const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

async function completeReset() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        console.log('--- Reseting Product Metrics ---');
        await db.collection('websites').updateMany({}, {
            $set: { viewCount: 0, likeCount: 0, salesCount: 0, rating: 0, reviewCount: 0, likedBy: [] }
        });
        await db.collection('softwares').updateMany({}, {
            $set: { viewCount: 0, likeCount: 0, salesCount: 0, rating: 0, reviewCount: 0, likedBy: [] }
        });

        console.log('--- Clearing Related Collections ---');

        // Clear Reviews
        const r1 = await db.collection('reviews').deleteMany({});
        console.log(`Deleted ${r1.deletedCount} Reviews.`);

        // Clear Enrollments (Free sales/downloads)
        const r2 = await db.collection('enrollments').deleteMany({});
        console.log(`Deleted ${r2.deletedCount} Enrollments.`);

        // Clear Orders (Paid sales)
        const r3 = await db.collection('orders').deleteMany({});
        console.log(`Deleted ${r3.deletedCount} Orders.`);

        // Clear Analytics (if any)
        const r4 = await db.collection('analytics').deleteMany({});
        console.log(`Deleted ${r4.deletedCount} Analytics logs.`);

        console.log('COMPLETE RESET DONE!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
completeReset();
