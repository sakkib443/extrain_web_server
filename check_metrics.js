const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

async function checkMetrics() {
    try {
        await mongoose.connect(DATABASE_URL);
        const db = mongoose.connection.db;

        const webCount = await db.collection('websites').countDocuments({});
        console.log(`Total Websites: ${webCount}`);

        const webWithMetrics = await db.collection('websites').find({
            $or: [
                { viewCount: { $gt: 0 } },
                { likeCount: { $gt: 0 } },
                { salesCount: { $gt: 0 } },
                { rating: { $gt: 0 } }
            ]
        }).toArray();
        console.log(`Websites with metrics > 0: ${webWithMetrics.length}`);

        const softCount = await db.collection('softwares').countDocuments({});
        console.log(`Total Softwares: ${softCount}`);

        const softWithMetrics = await db.collection('softwares').find({
            $or: [
                { viewCount: { $gt: 0 } },
                { likeCount: { $gt: 0 } },
                { salesCount: { $gt: 0 } },
                { rating: { $gt: 0 } }
            ]
        }).toArray();
        console.log(`Softwares with metrics > 0: ${softWithMetrics.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkMetrics();
