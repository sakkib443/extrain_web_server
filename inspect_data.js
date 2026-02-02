const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

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
