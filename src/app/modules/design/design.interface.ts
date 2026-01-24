// ===================================================================
// MotionBoss LMS - Design Interface
// Website Design/Content management module
// ওয়েবসাইট ডিজাইন এবং কন্টেন্ট ম্যানেজমেন্ট
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * IHeroContent - Hero Section Content
 * হিরো সেকশনের কন্টেন্ট
 */
export interface IHeroContent {
    badge: {
        text: string;
        textBn: string;
        showNew: boolean;
    };
    heading: {
        line1: string;
        line1Bn: string;
        line2: string;
        line2Bn: string;
    };
    dynamicTexts: string[];       // Typing animation texts
    dynamicTextsBn: string[];     // Bengali typing texts
    description: {
        text: string;
        textBn: string;
        brandName: string;        // e.g., "Extrain Web"
    };
    features: {
        text: string;
        textBn: string;
    }[];
    searchPlaceholder: {
        text: string;
        textBn: string;
    };
    stats: {
        activeUsers: number;
        downloads: number;
        avgRating: number;
        totalProducts: number;
    };
}

/**
 * IPopularCourseContent - Popular Course Section Content
 * জনপ্রিয় কোর্স সেকশনের কন্টেন্ট
 */
export interface IPopularCourseContent {
    badge: {
        text: string;
        textBn: string;
    };
    heading: {
        text1: string;
        text1Bn: string;
        highlight: string;
        highlightBn: string;
        text2: string;
        text2Bn: string;
    };
    description: {
        text: string;
        textBn: string;
    };
    cta: {
        buttonText: string;
        buttonTextBn: string;
        footerText: string;
        footerTextBn: string;
    };
}

/**
 * IDigitalProductsContent - Digital Products Section Content
 * ডিজিটাল প্রোডাক্ট সেকশনের কন্টেন্ট
 */
export interface IDigitalProductsContent {
    badge: {
        text: string;
        textBn: string;
    };
    heading: {
        text1: string;
        text1Bn: string;
        highlight: string;
        highlightBn: string;
    };
    description: {
        text: string;
        textBn: string;
    };
    tabs: {
        software: string;
        softwareBn: string;
        website: string;
        websiteBn: string;
    };
    cta: {
        viewAll: string;
        viewAllBn: string;
    };
}

/**
 * IWhatWeProvideContent - What We Provide Section Content
 * আমরা যা প্রদান করি সেকশনের কন্টেন্ট
 */
export interface IWhatWeProvideContent {
    badge: {
        text: string;
        textBn: string;
    };
    heading: {
        text1: string;
        text1Bn: string;
        highlight: string;
        highlightBn: string;
    };
    description: {
        text: string;
        textBn: string;
    };
    features: {
        title: string;
        titleBn: string;
        description: string;
        descriptionBn: string;
        emoji: string;
    }[];
    cta: {
        text: string;
        textBn: string;
    };
}

/**
 * IContactContent - Contact Page Content
 * কন্টাক্ট পেজের কন্টেন্ট
 */
export interface IContactContent {
    hero: {
        badge: string;
        badgeBn: string;
        title1: string;
        title1Bn: string;
        title2: string;
        title2Bn: string;
        subtitle: string;
        subtitleBn: string;
    };
    contactInfo: {
        email: string;
        phone: string;
        address: string;
        addressBn: string;
        officeHours: string;
        officeHoursBn: string;
    };
    socialLinks: {
        facebook: string;
        youtube: string;
        linkedin: string;
        whatsapp: string;
        instagram: string;
    };
    whatsappSection: {
        title: string;
        titleBn: string;
        description: string;
        descriptionBn: string;
        buttonText: string;
        buttonTextBn: string;
    };
    mapEmbedUrl: string;
}

/**
 * IDesign - Main Design Interface
 * Website design settings and content
 */
export interface IDesign {
    _id?: Types.ObjectId;

    // Section identifier
    section: 'hero' | 'about' | 'footer' | 'topHeader' | 'navbar' | 'contact' | 'popularCourse' | 'digitalProducts' | 'whatWeProvide' | 'aboutHero' | 'aboutMission' | 'aboutStats' | 'aboutFeatures' | 'aboutFounder' | 'aboutGlobal' | 'aboutCTA';

    // Hero section content
    heroContent?: IHeroContent;

    // Popular Course section content
    popularCourseContent?: IPopularCourseContent;

    // Digital Products section content
    digitalProductsContent?: IDigitalProductsContent;

    // What We Provide section content
    whatWeProvideContent?: IWhatWeProvideContent;

    // Contact section content
    contactContent?: IContactContent;

    // About page sections - flexible structure
    aboutHeroContent?: Record<string, unknown>;
    aboutMissionContent?: Record<string, unknown>;
    aboutStatsContent?: Record<string, unknown>;
    aboutFeaturesContent?: Record<string, unknown>;
    aboutFounderContent?: Record<string, unknown>;
    aboutGlobalContent?: Record<string, unknown>;
    aboutCTAContent?: Record<string, unknown>;

    // General settings
    isActive: boolean;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * DesignModel - Mongoose Model Type
 */
export interface DesignModel extends Model<IDesign> {
    findBySection(section: string): Promise<IDesign | null>;
}

