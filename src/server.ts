import mongoose from 'mongoose';
import app from './app';
import config from './app/config';
import { connectDB, cleanupStaleIndexes } from './app/utils/dbConnect';

// ==================== Uncaught Exception Handler ====================
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

// ==================== Local Development Server ====================
// শুধুমাত্র local development এ server চালু হবে
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      await connectDB();
      cleanupStaleIndexes();

      const server = app.listen(config.port, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║                                              ║');
        console.log('║   🎓 MotionBoss LMS Server Started!          ║');
        console.log('║                                              ║');
        console.log(`║   🌐 URL: http://localhost:${config.port}               ║`);
        console.log(`║   🔧 Environment: ${config.env.padEnd(21)}   ║`);
        console.log('║                                              ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
      });

      process.on('unhandledRejection', (error: Error) => {
        console.error('💥 UNHANDLED REJECTION! Shutting down...');
        console.error('Error:', error.message);
        server.close(() => {
          process.exit(1);
        });
      });

      process.on('SIGTERM', () => {
        console.log('👋 SIGTERM received. Shutting down gracefully...');
        server.close(() => {
          console.log('💤 Process terminated.');
        });
      });
    } catch (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  })();
}

// ==================== Export for Vercel ====================
export default app;

