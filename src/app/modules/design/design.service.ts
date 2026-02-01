// ===================================================================
// MotionBoss LMS - Design Service
// Business logic for Design module
// ===================================================================

import { IDesign } from './design.interface';
import { Design } from './design.model';

/**
 * Get design by section
 */
const getDesignBySection = async (section: string): Promise<IDesign | null> => {
    let design = await Design.findBySection(section);

    // If hero section doesn't exist, create default
    if (!design && section === 'hero') {
        design = await Design.create({
            section: 'hero',
            heroContent: {
                badge: {
                    text: 'Premium Learning Platform',
                    textBn: 'প্রিমিয়াম লার্নিং প্ল্যাটফর্ম',
                    showNew: true
                },
                heading: {
                    line1: 'Discover Premium',
                    line1Bn: 'আবিষ্কার করুন প্রিমিয়াম'
                },
                dynamicTexts: ['Professional Courses', 'Software Tools', 'Web Development'],
                dynamicTextsBn: ['প্রফেশনাল কোর্স', 'সফটওয়্যার টুলস', 'ওয়েব ডেভেলপমেন্ট'],
                description: {
                    text: 'Access thousands of premium courses, software, and digital products. Built by experts, ready for you to launch in minutes.',
                    textBn: 'হাজার হাজার প্রিমিয়াম কোর্স, সফটওয়্যার এবং ডিজিটাল প্রোডাক্ট অ্যাক্সেস করুন। বিশেষজ্ঞদের দ্বারা তৈরি।',
                    brandName: 'Extrain Web'
                },
                features: [
                    { text: 'Instant Access', textBn: 'তাৎক্ষণিক অ্যাক্সেস' },
                    { text: 'Lifetime Updates', textBn: 'আজীবন আপডেট' },
                    { text: 'Premium Support', textBn: 'প্রিমিয়াম সাপোর্ট' },
                    { text: 'Money Back Guarantee', textBn: 'মানি ব্যাক গ্যারান্টি' }
                ],
                searchPlaceholder: {
                    text: 'Search courses, software, themes...',
                    textBn: 'কোর্স, সফটওয়্যার, থিম খুঁজুন...'
                },
                stats: {
                    activeUsers: 5000,
                    downloads: 12000,
                    avgRating: 4.8,
                    totalCourses: 500
                }
            },
            isActive: true
        });
    }

    // If contact section doesn't exist, create default
    if (!design && section === 'contact') {
        design = await Design.create({
            section: 'contact',
            contactContent: {
                hero: {
                    badge: 'Get In Touch',
                    badgeBn: 'যোগাযোগ করুন',
                    title1: "Let's ",
                    title1Bn: 'আমাদের সাথে ',
                    title2: 'Connect',
                    title2Bn: 'যোগাযোগ করুন',
                    subtitle: 'Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.',
                    subtitleBn: 'কোনো প্রশ্ন আছে? আমাদের মেসেজ পাঠান, আমরা যত তাড়াতাড়ি সম্ভব উত্তর দেব।'
                },
                contactInfo: {
                    email: 'info@Extrain Web.com',
                    phone: '+88 01753924093',
                    address: 'Daisy Garden, House 14 (Level-5), Block A, Banasree, Dhaka',
                    addressBn: 'ডেইজি গার্ডেন, বাড়ি ১৪ (লেভেল-৫), ব্লক এ, বনশ্রী, ঢাকা',
                    officeHours: 'Sat - Thu: 10:00 AM - 6:00 PM',
                    officeHoursBn: 'শনি - বৃহস্পতি: সকাল ১০টা - সন্ধ্যা ৬টা'
                },
                socialLinks: {
                    facebook: 'https://www.facebook.com/Extrain Web',
                    youtube: 'https://www.youtube.com/@Extrain Web',
                    linkedin: 'https://www.linkedin.com/company/Extrain Web',
                    whatsapp: 'https://wa.me/8801753924093',
                    instagram: 'https://www.instagram.com/Extrain Web/'
                },
                whatsappSection: {
                    title: 'Need Quick Help?',
                    titleBn: 'দ্রুত সাহায্য দরকার?',
                    description: 'Chat with us on WhatsApp for instant support and answers to your questions.',
                    descriptionBn: 'তাৎক্ষণিক সাপোর্টের জন্য হোয়াটসঅ্যাপে আমাদের সাথে চ্যাট করুন।',
                    buttonText: 'Chat on WhatsApp',
                    buttonTextBn: 'হোয়াটসঅ্যাপে চ্যাট করুন'
                },
                mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.8986834879085!2d90.41723!3d23.7656976!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c754583dd209%3A0xdd0c5fcc7d2d3836!2sDaisy%20Garden!5e0!3m2!1sen!2sbd!4v1704532086149!5m2!1sen!2sbd'
            },
            isActive: true
        });
    }

    // If popularCourse section doesn't exist, create default
    if (!design && section === 'popularCourse') {
        design = await Design.create({
            section: 'popularCourse',
            popularCourseContent: {
                badge: {
                    text: 'Popular Courses',
                    textBn: 'জনপ্রিয় কোর্স'
                },
                heading: {
                    text1: 'Explore Our ',
                    text1Bn: 'আমাদের ',
                    highlight: 'Top Courses',
                    highlightBn: 'সেরা কোর্স',
                    text2: '',
                    text2Bn: ' সমূহ'
                },
                description: {
                    text: 'Premium courses crafted by industry experts.',
                    textBn: 'বিশেষজ্ঞ মেন্টরদের দ্বারা তৈরি প্রিমিয়াম কোর্স।'
                },
                cta: {
                    buttonText: 'View All Courses',
                    buttonTextBn: 'সব কোর্স দেখুন',
                    footerText: 'Thousands of learners joined',
                    footerTextBn: 'হাজার হাজার শিক্ষার্থী যোগ দিয়েছেন'
                }
            },
            isActive: true
        });
    }

    // If digitalProducts section doesn't exist, create default
    if (!design && section === 'digitalProducts') {
        design = await Design.create({
            section: 'digitalProducts',
            digitalProductsContent: {
                badge: {
                    text: 'Digital Products',
                    textBn: 'ডিজিটাল পণ্য'
                },
                heading: {
                    text1: 'Premium ',
                    text1Bn: 'আমাদের ',
                    highlight: 'Digital Products',
                    highlightBn: 'প্রিমিয়াম ডিজিটাল পণ্য'
                },
                description: {
                    text: 'Explore our collection of premium software and ready-made websites designed to scale your business.',
                    textBn: 'আমাদের প্রিমিয়াম সফটওয়্যার এবং রেডিমেড ওয়েবসাইট কালেকশন আপনার ব্যবসা বাড়াতে সাহায্য করবে।'
                },
                tabs: {
                    software: 'Software',
                    softwareBn: 'সফটওয়্যার',
                    website: 'Websites',
                    websiteBn: 'ওয়েবসাইট'
                },
                cta: {
                    viewAll: 'View All',
                    viewAllBn: 'সব দেখুন'
                }
            },
            isActive: true
        });
    }

    // If whatWeProvide section doesn't exist, create default
    if (!design && section === 'whatWeProvide') {
        design = await Design.create({
            section: 'whatWeProvide',
            whatWeProvideContent: {
                badge: {
                    text: 'Why Choose Us',
                    textBn: 'কেন আমাদের বেছে নেবেন'
                },
                heading: {
                    text1: 'What We ',
                    text1Bn: 'আমরা যা ',
                    highlight: 'Provide',
                    highlightBn: 'প্রদান করি'
                },
                description: {
                    text: 'We are committed to providing the best learning experience.',
                    textBn: 'আমরা সেরা শেখার অভিজ্ঞতা প্রদান করতে প্রতিশ্রুতিবদ্ধ।'
                },
                features: [
                    { title: 'Lifetime Support', titleBn: 'লাইফটাইম সাপোর্ট', description: 'Get lifetime support for all your purchases.', descriptionBn: 'আপনার সব ক্রয়ের জন্য লাইফটাইম সাপোর্ট পান।', emoji: '🚀' },
                    { title: 'Job Placement', titleBn: 'চাকরি নিশ্চিতকরণ', description: 'We help you get placed in top companies.', descriptionBn: 'আমরা আপনাকে শীর্ষ কোম্পানিতে চাকরি পেতে সাহায্য করি।', emoji: '🎯' },
                    { title: 'Certification', titleBn: 'সার্টিফিকেশন', description: 'Get industry recognized certification.', descriptionBn: 'ইন্ডাস্ট্রি স্বীকৃত সার্টিফিকেট পান।', emoji: '🏅' }
                ],
                cta: {
                    text: 'Learn More About Us',
                    textBn: 'আমাদের সম্পর্কে আরও জানুন'
                }
            },
            isActive: true
        });
    }

    return design;
};

/**
 * Get all designs
 */
const getAllDesigns = async (): Promise<IDesign[]> => {
    return Design.find({});
};

/**
 * Update design by section
 */
const updateDesignBySection = async (
    section: string,
    payload: Partial<IDesign>
): Promise<IDesign | null> => {
    // Use upsert to create if doesn't exist
    const result = await Design.findOneAndUpdate(
        { section },
        { $set: payload },
        { new: true, upsert: true }
    );
    return result;
};

/**
 * Create or update design
 */
const createDesign = async (payload: IDesign): Promise<IDesign> => {
    // Check if section already exists
    const existing = await Design.findOne({ section: payload.section });

    if (existing) {
        // Update existing
        const updated = await Design.findOneAndUpdate(
            { section: payload.section },
            { $set: payload },
            { new: true }
        );
        return updated!;
    }

    // Create new
    const result = await Design.create(payload);
    return result;
};

export const DesignService = {
    getDesignBySection,
    getAllDesigns,
    updateDesignBySection,
    createDesign
};
