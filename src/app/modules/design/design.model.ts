// ===================================================================
// MotionBoss LMS - Design Model
// Mongoose schema for website design/content
// ===================================================================

import { Schema, model } from 'mongoose';
import { IDesign, DesignModel } from './design.interface';

const heroContentSchema = new Schema({
    badge: {
        text: { type: String, default: 'Premium Learning Platform' },
        textBn: { type: String, default: 'প্রিমিয়াম লার্নিং প্ল্যাটফর্ম' },
        showNew: { type: Boolean, default: true }
    },
    heading: {
        line1: { type: String, default: 'THE BEST' },
        line1Bn: { type: String, default: 'সেরা' },
        line2: { type: String, default: 'BUSINESS SOLUTION &' },
        line2Bn: { type: String, default: 'বিজনেস সলিউশন' }
    },
    dynamicTexts: {
        type: [String],
        default: ['PREMIUM TEMPLATES', 'Professional Websites', 'Software Tools', 'Web Development']
    },
    dynamicTextsBn: {
        type: [String],
        default: ['প্রিমিয়াম টেমপ্লেট', 'প্রফেশনাল ওয়েবসাইট', 'সফটওয়্যার টুলস', 'ওয়েব ডেভেলপমেন্ট']
    },
    description: {
        text: {
            type: String,
            default: 'The most powerful digital products & creative platform by'
        },
        textBn: {
            type: String,
            default: 'সবচেয়ে নির্ভরযোগ্য ডিজিটাল প্রোডাক্ট প্ল্যাটফর্ম'
        },
        brandName: { type: String, default: 'Extrain Web' }
    },
    features: [{
        text: { type: String },
        textBn: { type: String }
    }],
    searchPlaceholder: {
        text: { type: String, default: 'Search websites, software, themes...' },
        textBn: { type: String, default: 'ওয়েবসাইট, সফটওয়্যার, থিম খুঁজুন...' }
    },
    stats: {
        activeUsers: { type: Number, default: 5000 },
        downloads: { type: Number, default: 12000 },
        avgRating: { type: Number, default: 4.8 },
        totalProducts: { type: Number, default: 500 }
    }
}, { _id: false });

// Digital Products Section Schema
const digitalProductsContentSchema = new Schema({
    badge: {
        text: { type: String, default: 'Digital Products' },
        textBn: { type: String, default: 'ডিজিটাল প্রোডাক্ট' }
    },
    heading: {
        text1: { type: String, default: 'Explore Our ' },
        text1Bn: { type: String, default: 'আমাদের ' },
        highlight: { type: String, default: 'Digital Products' },
        highlightBn: { type: String, default: 'ডিজিটাল প্রোডাক্ট' }
    },
    description: {
        text: { type: String, default: 'Premium software and website templates for your business.' },
        textBn: { type: String, default: 'আপনার ব্যবসার জন্য প্রিমিয়াম সফটওয়্যার এবং ওয়েবসাইট টেমপ্লেট।' }
    },
    tabs: {
        software: { type: String, default: 'Software' },
        softwareBn: { type: String, default: 'সফটওয়্যার' },
        website: { type: String, default: 'Websites' },
        websiteBn: { type: String, default: 'ওয়েবসাইট' }
    },
    cta: {
        viewAll: { type: String, default: 'View All' },
        viewAllBn: { type: String, default: 'সব দেখুন' }
    }
}, { _id: false });

// What We Provide Section Schema
const whatWeProvideContentSchema = new Schema({
    badge: {
        text: { type: String, default: 'Why Choose Us' },
        textBn: { type: String, default: 'কেন আমাদের বেছে নেবেন' }
    },
    heading: {
        text1: { type: String, default: 'What We ' },
        text1Bn: { type: String, default: 'আমরা যা ' },
        highlight: { type: String, default: 'Provide' },
        highlightBn: { type: String, default: 'প্রদান করি' }
    },
    description: {
        text: { type: String, default: 'We are committed to providing the best learning experience.' },
        textBn: { type: String, default: 'আমরা সেরা শেখার অভিজ্ঞতা প্রদান করতে প্রতিশ্রুতিবদ্ধ।' }
    },
    features: [{
        title: { type: String },
        titleBn: { type: String },
        description: { type: String },
        descriptionBn: { type: String },
        emoji: { type: String, default: '🚀' }
    }],
    cta: {
        text: { type: String, default: 'Learn More About Us' },
        textBn: { type: String, default: 'আমাদের সম্পর্কে আরও জানুন' }
    }
}, { _id: false });

const contactContentSchema = new Schema({
    hero: {
        badge: { type: String, default: 'Get In Touch' },
        badgeBn: { type: String, default: 'যোগাযোগ করুন' },
        title1: { type: String, default: "Let's " },
        title1Bn: { type: String, default: 'আমাদের সাথে ' },
        title2: { type: String, default: 'Connect' },
        title2Bn: { type: String, default: 'যোগাযোগ করুন' },
        subtitle: { type: String, default: 'Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.' },
        subtitleBn: { type: String, default: 'কোনো প্রশ্ন আছে? আমাদের মেসেজ পাঠান, আমরা যত তাড়াতাড়ি সম্ভব উত্তর দেব।' }
    },
    contactInfo: {
        email: { type: String, default: 'info@Extrain Web.com' },
        phone: { type: String, default: '+88 01753924093' },
        address: { type: String, default: 'Daisy Garden, House 14 (Level-5), Block A, Banasree, Dhaka' },
        addressBn: { type: String, default: 'ডেইজি গার্ডেন, বাড়ি ১৪ (লেভেল-৫), ব্লক এ, বনশ্রী, ঢাকা' },
        officeHours: { type: String, default: 'Sat - Thu: 10:00 AM - 6:00 PM' },
        officeHoursBn: { type: String, default: 'শনি - বৃহস্পতি: সকাল ১০টা - সন্ধ্যা ৬টা' }
    },
    socialLinks: {
        facebook: { type: String, default: 'https://www.facebook.com/Extrain Web' },
        youtube: { type: String, default: 'https://www.youtube.com/@Extrain Web' },
        linkedin: { type: String, default: 'https://www.linkedin.com/company/Extrain Web' },
        whatsapp: { type: String, default: 'https://wa.me/8801753924093' },
        instagram: { type: String, default: 'https://www.instagram.com/Extrain Web/' }
    },
    whatsappSection: {
        title: { type: String, default: 'Need Quick Help?' },
        titleBn: { type: String, default: 'দ্রুত সাহায্য দরকার?' },
        description: { type: String, default: 'Chat with us on WhatsApp for instant support and answers to your questions.' },
        descriptionBn: { type: String, default: 'তাৎক্ষণিক সাপোর্টের জন্য হোয়াটসঅ্যাপে আমাদের সাথে চ্যাট করুন।' },
        buttonText: { type: String, default: 'Chat on WhatsApp' },
        buttonTextBn: { type: String, default: 'হোয়াটসঅ্যাপে চ্যাট করুন' }
    },
    mapEmbedUrl: {
        type: String,
        default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.8986834879085!2d90.41723!3d23.7656976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c754583dd209%3A0xdd0c5fcc7d2d3836!2sDaisy%20Garden!5e0!3m2!1sen!2sbd!4v1704532086149!5m2!1sen!2sbd'
    }
}, { _id: false });

const designSchema = new Schema<IDesign, DesignModel>(
    {
        section: {
            type: String,
            required: true,
            enum: ['hero', 'about', 'footer', 'topHeader', 'navbar', 'contact', 'digitalProducts', 'whatWeProvide', 'aboutHero', 'aboutMission', 'aboutStats', 'aboutFeatures', 'aboutFounder', 'aboutGlobal', 'aboutCTA'],
            unique: true
        },
        heroContent: heroContentSchema,
        digitalProductsContent: digitalProductsContentSchema,
        whatWeProvideContent: whatWeProvideContentSchema,
        contactContent: contactContentSchema,
        // About page sections - flexible Schema.Types.Mixed
        aboutHeroContent: { type: Schema.Types.Mixed },
        aboutMissionContent: { type: Schema.Types.Mixed },
        aboutStatsContent: { type: Schema.Types.Mixed },
        aboutFeaturesContent: { type: Schema.Types.Mixed },
        aboutFounderContent: { type: Schema.Types.Mixed },
        aboutGlobalContent: { type: Schema.Types.Mixed },
        aboutCTAContent: { type: Schema.Types.Mixed },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Static method to find by section
designSchema.statics.findBySection = async function (section: string) {
    return this.findOne({ section });
};

export const Design = model<IDesign, DesignModel>('Design', designSchema);

