import mongoose from 'mongoose';
import { Website } from '../modules/website/website.model';
import { Software } from '../modules/software/software.model';

/**
 * resetProductMetrics - সব ওয়েবসাইট এবং সফটওয়্যারের ভিউ, লাইক, সেলস ০ করে দিবে
 */
export const resetProductMetrics = async () => {
    try {
        console.log('🔄 Starting product metrics reset...');

        // ১. সব ওয়েবসাইট আপডেট করা
        const websiteResult = await Website.updateMany(
            {}, // সব ওয়েবসাইট সিলেক্ট করবে
            {
                $set: {
                    rating: 0,
                    reviewCount: 0,
                    salesCount: 0,
                    viewCount: 0,
                    likeCount: 0,
                    likedBy: [] // লাইক করা ইউজারদের লিস্টও খালি করে দিবে
                }
            }
        );
        console.log(`✅ Updated ${websiteResult.modifiedCount} Websites.`);

        // ২. সব সফটওয়্যার আপডেট করা
        const softwareResult = await Software.updateMany(
            {}, // সব সফটওয়্যার সিলেক্ট করবে
            {
                $set: {
                    rating: 0,
                    reviewCount: 0,
                    salesCount: 0,
                    viewCount: 0,
                    likeCount: 0,
                    likedBy: [] // লাইক করা ইউজারদের লিস্টও খালি করে দিবে
                }
            }
        );
        console.log(`✅ Updated ${softwareResult.modifiedCount} Software.`);

        console.log('🎉 Reset Complete!');
    } catch (error) {
        console.error('❌ Error resetting metrics:', error);
    }
};
