
import mongoose from 'mongoose';
import config from '../config';

// ==================== MongoDB Connection Caching ====================
// Vercel Serverless এর জন্য connection caching - গুরুত্বপূর্ণ!
interface CachedConnection {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
    // যদি আগে থেকে connected থাকে, সেটা return করো
    if (cached.conn) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚡ Using cached MongoDB connection');
        }
        return cached.conn;
    }

    // Check if already connected via mongoose state
    if (mongoose.connection.readyState === 1) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚡ MongoDB already connected (state check)');
        }
        cached.conn = mongoose;
        return mongoose;
    }

    // যদি connection promise না থাকে, নতুন তৈরি করো
    if (!cached.promise) {
        const opts: mongoose.ConnectOptions = {
            // bufferCommands: true so queries wait for connection
            bufferCommands: true,
            maxPoolSize: process.env.NODE_ENV === 'production' ? 1 : 10, // Optimize for serverless vs local
            serverSelectionTimeoutMS: 15000, // 15s timeout
            socketTimeoutMS: 30000,
            connectTimeoutMS: 15000,
        };

        if (process.env.NODE_ENV !== 'production') {
            console.log('🔌 Creating new MongoDB connection...');
        }

        cached.promise = mongoose.connect(config.database_url, opts).then((mongoose) => {
            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ MongoDB connected successfully!');
            }
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }

    return cached.conn;
}

export async function cleanupStaleIndexes() {
    try {
        const db = mongoose.connection.db;
        if (!db) return;

        const collections = await db.listCollections().toArray();
        const usersCollection = collections.find(c => c.name === 'users');

        if (usersCollection) {
            const indexes = await db.collection('users').indexes();
            const staleIndex = indexes.find((idx: any) => idx.name === 'id_1');

            if (staleIndex) {
                await db.collection('users').dropIndex('id_1');
                console.log('🧹 Dropped stale id_1 index from users collection');
            }
        }
    } catch (error) {
        // Silently ignore if index doesn't exist
    }
}
