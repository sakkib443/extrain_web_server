const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

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
