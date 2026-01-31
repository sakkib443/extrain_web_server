// Keep-warm endpoint for Vercel
// This can be pinged by external cron services to prevent cold starts
// এই endpoint প্রতি কয়েক মিনিটে ping করলে function warm থাকবে

export default async function handler(req: any, res: any) {
    // Simple response to keep the function warm
    res.status(200).json({
        success: true,
        message: 'Function is warm',
        timestamp: new Date().toISOString()
    });
}
