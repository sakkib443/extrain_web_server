// ===================================================================
// MotionBoss - Page Content Interface
// Dynamic content management for all website pages
// ===================================================================

import { Model, Types } from 'mongoose';

/**
 * Content Field Type - for flexible field definitions
 */
export type TFieldType = 'text' | 'textarea' | 'image' | 'link' | 'number' | 'boolean' | 'array' | 'richtext';

/**
 * Field Definition - structure for each editable field
 */
export interface IFieldDefinition {
    key: string;
    label: string;
    labelBn?: string;
    type: TFieldType;
    placeholder?: string;
    placeholderBn?: string;
    required?: boolean;
    defaultValue?: string | number | boolean | string[];
}

/**
 * Section Definition - defines a page section
 */
export interface ISectionDefinition {
    sectionKey: string;
    sectionName: string;
    sectionNameBn?: string;
    icon?: string;
    description?: string;
    fields: IFieldDefinition[];
}

/**
 * Page Definition - defines a complete page structure
 */
export interface IPageDefinition {
    pageKey: string;
    pageName: string;
    pageNameBn?: string;
    icon?: string;
    route?: string;
    sections: ISectionDefinition[];
}

/**
 * IPageContent - Stored content for each page/section
 */
export interface IPageContent {
    _id?: Types.ObjectId;

    // Unique identifiers
    pageKey: string;                // e.g., "home", "about", "contact"
    sectionKey: string;             // e.g., "hero", "features", "cta"

    // Content object - stores all field values
    content: Record<string, unknown>;

    // Metadata
    isActive: boolean;
    lastUpdatedBy?: Types.ObjectId;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * IPageContentFilters - Query filters
 */
export interface IPageContentFilters {
    pageKey?: string;
    sectionKey?: string;
    isActive?: boolean;
}

/**
 * PageContentModel - Mongoose Model Type
 */
export interface PageContentModel extends Model<IPageContent> {
    findByPageAndSection(pageKey: string, sectionKey: string): Promise<IPageContent | null>;
}

// ===================================================================
// PAGE STRUCTURE DEFINITIONS
// Define all pages and their sections here
// ===================================================================

export const PAGE_DEFINITIONS: IPageDefinition[] = [
    // ========================
    // HOME PAGE
    // ========================
    {
        pageKey: 'home',
        pageName: 'Home Page',
        pageNameBn: 'হোম পেজ',
        icon: 'FiHome',
        route: '/',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                description: 'Main banner with heading, typing animation, and search',
                fields: [
                    { key: 'badge.text', label: 'Badge Text', labelBn: 'ব্যাজ টেক্সট', type: 'text', placeholder: 'Premium Learning Platform' },
                    { key: 'badge.textBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'প্রিমিয়াম লার্নিং প্ল্যাটফর্ম' },
                    { key: 'badge.showNew', label: 'Show NEW Badge', type: 'boolean', defaultValue: true },
                    { key: 'heading.line1', label: 'Main Heading', labelBn: 'প্রধান শিরোনাম', type: 'text', placeholder: 'Discover Premium' },
                    { key: 'heading.line1Bn', label: 'Main Heading (Bengali)', type: 'text', placeholder: 'আবিষ্কার করুন প্রিমিয়াম' },
                    { key: 'heading.line2', label: 'Text Before Typing', type: 'text', placeholder: 'Learn' },
                    { key: 'heading.line2Bn', label: 'Text Before Typing (Bengali)', type: 'text', placeholder: 'শিখুন' },
                    { key: 'dynamicTexts', label: 'Typing Animation Texts', type: 'array', placeholder: 'Professional Courses, Software Tools' },
                    { key: 'dynamicTextsBn', label: 'Typing Animation Texts (Bengali)', type: 'array', placeholder: 'প্রফেশনাল কোর্স, সফটওয়্যার টুলস' },
                    { key: 'description.text', label: 'Description', type: 'textarea', placeholder: 'Access thousands of premium courses...' },
                    { key: 'description.textBn', label: 'Description (Bengali)', type: 'textarea', placeholder: 'হাজার হাজার প্রিমিয়াম কোর্স...' },
                    { key: 'description.brandName', label: 'Brand Name (Highlighted)', type: 'text', placeholder: 'Extrain Web' },
                    { key: 'searchPlaceholder.text', label: 'Search Placeholder', type: 'text', placeholder: 'Search courses, software...' },
                    { key: 'searchPlaceholder.textBn', label: 'Search Placeholder (Bengali)', type: 'text', placeholder: 'কোর্স, সফটওয়্যার খুঁজুন...' },
                    { key: 'stats.activeUsers', label: 'Active Users Count', type: 'number', defaultValue: 5000 },
                    { key: 'stats.downloads', label: 'Downloads Count', type: 'number', defaultValue: 12000 },
                    { key: 'stats.avgRating', label: 'Average Rating', type: 'number', defaultValue: 4.8 },
                    { key: 'stats.totalProducts', label: 'Total Products', type: 'number', defaultValue: 500 },
                ]
            },
            {
                sectionKey: 'categories',
                sectionName: 'Categories Section',
                sectionNameBn: 'ক্যাটাগরি সেকশন',
                icon: 'FiGrid',
                description: 'Category cards display',
                fields: [
                    { key: 'heading', label: 'Section Heading', type: 'text', placeholder: 'Popular Categories' },
                    { key: 'headingBn', label: 'Section Heading (Bengali)', type: 'text', placeholder: 'জনপ্রিয় ক্যাটাগরি' },
                    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Explore our top categories' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'text', placeholder: 'আমাদের শীর্ষ ক্যাটাগরি দেখুন' },
                    { key: 'showCount', label: 'Number of Categories to Show', type: 'number', defaultValue: 8 },
                ]
            },
            {
                sectionKey: 'popularCourses',
                sectionName: 'Popular Courses',
                sectionNameBn: 'জনপ্রিয় কোর্স',
                icon: 'FiBook',
                description: 'Featured courses carousel',
                fields: [
                    { key: 'heading', label: 'Section Heading', type: 'text', placeholder: 'Popular Courses' },
                    { key: 'headingBn', label: 'Section Heading (Bengali)', type: 'text', placeholder: 'জনপ্রিয় কোর্স' },
                    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Learn from industry experts' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'text', placeholder: 'ইন্ডাস্ট্রি এক্সপার্টদের কাছ থেকে শিখুন' },
                    { key: 'showCount', label: 'Number of Courses to Show', type: 'number', defaultValue: 6 },
                    { key: 'viewAllLink', label: 'View All Link', type: 'link', placeholder: '/courses' },
                    { key: 'viewAllText', label: 'View All Button Text', type: 'text', placeholder: 'View All Courses' },
                    { key: 'viewAllTextBn', label: 'View All Button Text (Bengali)', type: 'text', placeholder: 'সব কোর্স দেখুন' },
                ]
            },
            {
                sectionKey: 'digitalProducts',
                sectionName: 'Digital Products',
                sectionNameBn: 'ডিজিটাল প্রোডাক্ট',
                icon: 'FiCode',
                description: 'Software, websites, and themes showcase',
                fields: [
                    { key: 'heading', label: 'Section Heading', type: 'text', placeholder: 'Digital Products' },
                    { key: 'headingBn', label: 'Section Heading (Bengali)', type: 'text', placeholder: 'ডিজিটাল প্রোডাক্ট' },
                    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Premium software and templates' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'text', placeholder: 'প্রিমিয়াম সফটওয়্যার ও টেমপ্লেট' },
                    { key: 'showSoftwareCount', label: 'Number of Software to Show', type: 'number', defaultValue: 4 },
                    { key: 'showWebsiteCount', label: 'Number of Websites to Show', type: 'number', defaultValue: 4 },
                ]
            },
            {
                sectionKey: 'whatWeProvide',
                sectionName: 'What We Provide',
                sectionNameBn: 'আমরা কী প্রদান করি',
                icon: 'FiCheck',
                description: 'Services and benefits section',
                fields: [
                    { key: 'heading', label: 'Section Heading', type: 'text', placeholder: 'What We Provide' },
                    { key: 'headingBn', label: 'Section Heading (Bengali)', type: 'text', placeholder: 'আমরা কী প্রদান করি' },
                    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Our exclusive offerings' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'text', placeholder: 'আমাদের এক্সক্লুসিভ অফারিংস' },
                ]
            },
            {
                sectionKey: 'features',
                sectionName: 'Feature Pills',
                sectionNameBn: 'ফিচার পিলস',
                icon: 'FiList',
                description: 'Small feature tags shown in hero',
                fields: [
                    { key: 'items', label: 'Feature Items (comma separated)', type: 'array', placeholder: 'Instant Access, Lifetime Updates, Premium Support' },
                    { key: 'itemsBn', label: 'Feature Items Bengali', type: 'array', placeholder: 'তাৎক্ষণিক অ্যাক্সেস, আজীবন আপডেট' },
                ]
            },
        ]
    },

    // ========================
    // ABOUT PAGE
    // ========================
    {
        pageKey: 'about',
        pageName: 'About Page',
        pageNameBn: 'আমাদের সম্পর্কে',
        icon: 'FiInfo',
        route: '/about',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                fields: [
                    { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'About Us' },
                    { key: 'badgeBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'আমাদের সম্পর্কে' },
                    { key: 'title', label: 'Main Title', type: 'text', placeholder: 'We Build Digital Futures' },
                    { key: 'titleBn', label: 'Main Title (Bengali)', type: 'text', placeholder: 'আমরা ডিজিটাল ভবিষ্যৎ গড়ি' },
                    { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Empowering learners worldwide...' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'textarea', placeholder: 'বিশ্বব্যাপী শিক্ষার্থীদের ক্ষমতায়ন...' },
                ]
            },
            {
                sectionKey: 'founder',
                sectionName: 'Founder Section',
                sectionNameBn: 'প্রতিষ্ঠাতা সেকশন',
                icon: 'FiUser',
                fields: [
                    { key: 'name', label: 'Founder Name', type: 'text', placeholder: 'John Doe' },
                    { key: 'title', label: 'Founder Title', type: 'text', placeholder: 'CEO & Founder' },
                    { key: 'titleBn', label: 'Founder Title (Bengali)', type: 'text', placeholder: 'সিইও ও প্রতিষ্ঠাতা' },
                    { key: 'bio', label: 'Biography', type: 'textarea', placeholder: 'Founder bio...' },
                    { key: 'bioBn', label: 'Biography (Bengali)', type: 'textarea', placeholder: 'প্রতিষ্ঠাতার জীবনী...' },
                    { key: 'image', label: 'Founder Image URL', type: 'image', placeholder: '/images/founder.jpg' },
                ]
            },
            {
                sectionKey: 'features',
                sectionName: 'Features Section',
                sectionNameBn: 'ফিচার সেকশন',
                icon: 'FiCheck',
                fields: [
                    { key: 'heading', label: 'Section Heading', type: 'text', placeholder: 'Why Choose Us' },
                    { key: 'headingBn', label: 'Section Heading (Bengali)', type: 'text', placeholder: 'আমাদের কেন বেছে নেবেন' },
                ]
            },
            {
                sectionKey: 'stats',
                sectionName: 'Statistics',
                sectionNameBn: 'পরিসংখ্যান',
                icon: 'FiBarChart',
                fields: [
                    { key: 'students', label: 'Total Students', type: 'number', defaultValue: 10000 },
                    { key: 'studentsLabel', label: 'Students Label', type: 'text', placeholder: 'Happy Students' },
                    { key: 'studentsLabelBn', label: 'Students Label (Bengali)', type: 'text', placeholder: 'সন্তুষ্ট শিক্ষার্থী' },
                    { key: 'courses', label: 'Total Courses', type: 'number', defaultValue: 100 },
                    { key: 'coursesLabel', label: 'Courses Label', type: 'text', placeholder: 'Expert Courses' },
                    { key: 'coursesLabelBn', label: 'Courses Label (Bengali)', type: 'text', placeholder: 'এক্সপার্ট কোর্স' },
                    { key: 'instructors', label: 'Total Instructors', type: 'number', defaultValue: 50 },
                    { key: 'instructorsLabel', label: 'Instructors Label', type: 'text', placeholder: 'Expert Mentors' },
                    { key: 'instructorsLabelBn', label: 'Instructors Label (Bengali)', type: 'text', placeholder: 'এক্সপার্ট মেন্টর' },
                    { key: 'countries', label: 'Countries Served', type: 'number', defaultValue: 20 },
                    { key: 'countriesLabel', label: 'Countries Label', type: 'text', placeholder: 'Countries Reached' },
                    { key: 'countriesLabelBn', label: 'Countries Label (Bengali)', type: 'text', placeholder: 'দেশে পৌঁছেছি' },
                ]
            },
            {
                sectionKey: 'mission',
                sectionName: 'Mission & Vision',
                sectionNameBn: 'মিশন ও ভিশন',
                icon: 'FiTarget',
                fields: [
                    { key: 'missionTitle', label: 'Mission Title', type: 'text', placeholder: 'Our Mission' },
                    { key: 'missionTitleBn', label: 'Mission Title (Bengali)', type: 'text', placeholder: 'আমাদের মিশন' },
                    { key: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'To empower...' },
                    { key: 'missionBn', label: 'Mission Statement (Bengali)', type: 'textarea', placeholder: 'ক্ষমতায়ন করা...' },
                    { key: 'visionTitle', label: 'Vision Title', type: 'text', placeholder: 'Our Vision' },
                    { key: 'visionTitleBn', label: 'Vision Title (Bengali)', type: 'text', placeholder: 'আমাদের ভিশন' },
                    { key: 'vision', label: 'Vision Statement', type: 'textarea', placeholder: 'To become...' },
                    { key: 'visionBn', label: 'Vision Statement (Bengali)', type: 'textarea', placeholder: 'হয়ে উঠতে...' },
                ]
            },
            {
                sectionKey: 'cta',
                sectionName: 'Call to Action',
                sectionNameBn: 'কল টু অ্যাকশন',
                icon: 'FiArrowRight',
                fields: [
                    { key: 'heading', label: 'CTA Heading', type: 'text', placeholder: 'Ready to Start?' },
                    { key: 'headingBn', label: 'CTA Heading (Bengali)', type: 'text', placeholder: 'শুরু করতে প্রস্তুত?' },
                    { key: 'subtitle', label: 'CTA Subtitle', type: 'text', placeholder: 'Join thousands of successful learners' },
                    { key: 'subtitleBn', label: 'CTA Subtitle (Bengali)', type: 'text', placeholder: 'হাজার হাজার সফল শিক্ষার্থীদের সাথে যোগ দিন' },
                    { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Get Started' },
                    { key: 'buttonTextBn', label: 'Button Text (Bengali)', type: 'text', placeholder: 'শুরু করুন' },
                    { key: 'buttonLink', label: 'Button Link', type: 'link', placeholder: '/courses' },
                ]
            },
        ]
    },

    // ========================
    // TRAINING PAGE
    // ========================
    {
        pageKey: 'training',
        pageName: 'Training Page',
        pageNameBn: 'ট্রেনিং পেজ',
        icon: 'FiBook',
        route: '/courses',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                fields: [
                    { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Our Courses' },
                    { key: 'badgeBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'আমাদের কোর্স' },
                    { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Explore Our Courses' },
                    { key: 'titleBn', label: 'Page Title (Bengali)', type: 'text', placeholder: 'আমাদের কোর্স এক্সপ্লোর করুন' },
                    { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Learn skills that matter...' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'textarea', placeholder: 'গুরুত্বপূর্ণ দক্ষতা শিখুন...' },
                ]
            },
            {
                sectionKey: 'filters',
                sectionName: 'Filter Labels',
                sectionNameBn: 'ফিল্টার লেবেল',
                icon: 'FiFilter',
                fields: [
                    { key: 'allCategories', label: 'All Categories Label', type: 'text', placeholder: 'All Categories' },
                    { key: 'allCategoriesBn', label: 'All Categories Label (Bengali)', type: 'text', placeholder: 'সব ক্যাটাগরি' },
                    { key: 'searchPlaceholder', label: 'Search Placeholder', type: 'text', placeholder: 'Search courses...' },
                    { key: 'searchPlaceholderBn', label: 'Search Placeholder (Bengali)', type: 'text', placeholder: 'কোর্স খুঁজুন...' },
                ]
            },
        ]
    },

    // ========================
    // SOFTWARE PAGE
    // ========================
    {
        pageKey: 'software',
        pageName: 'Software Page',
        pageNameBn: 'সফটওয়্যার পেজ',
        icon: 'FiCode',
        route: '/software',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                fields: [
                    { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Premium Software' },
                    { key: 'badgeBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'প্রিমিয়াম সফটওয়্যার' },
                    { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Software Solutions' },
                    { key: 'titleBn', label: 'Page Title (Bengali)', type: 'text', placeholder: 'সফটওয়্যার সমাধান' },
                    { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Professional software for your needs...' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'textarea', placeholder: 'আপনার প্রয়োজনে পেশাদার সফটওয়্যার...' },
                ]
            },
        ]
    },

    // ========================
    // SUCCESS STORY PAGE
    // ========================
    {
        pageKey: 'successStory',
        pageName: 'Success Story Page',
        pageNameBn: 'সাফল্যের গল্প পেজ',
        icon: 'FiAward',
        route: '/success-story',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                fields: [
                    { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Success Stories' },
                    { key: 'badgeBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'সাফল্যের গল্প' },
                    { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Student Success Stories' },
                    { key: 'titleBn', label: 'Page Title (Bengali)', type: 'text', placeholder: 'শিক্ষার্থীদের সাফল্যের গল্প' },
                    { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Real stories from our community...' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'textarea', placeholder: 'আমাদের কমিউনিটির বাস্তব গল্প...' },
                ]
            },
        ]
    },

    // ========================
    // CONTACT PAGE (already exists, adding for completion)
    // ========================
    {
        pageKey: 'contact',
        pageName: 'Contact Page',
        pageNameBn: 'যোগাযোগ পেজ',
        icon: 'FiMail',
        route: '/contact',
        sections: [
            {
                sectionKey: 'hero',
                sectionName: 'Hero Section',
                sectionNameBn: 'হিরো সেকশন',
                icon: 'FiStar',
                fields: [
                    { key: 'badge', label: 'Badge Text', type: 'text', placeholder: 'Get In Touch' },
                    { key: 'badgeBn', label: 'Badge Text (Bengali)', type: 'text', placeholder: 'যোগাযোগ করুন' },
                    { key: 'title1', label: 'Title Part 1', type: 'text', placeholder: "Let's " },
                    { key: 'title1Bn', label: 'Title Part 1 (Bengali)', type: 'text', placeholder: 'আমাদের সাথে ' },
                    { key: 'title2', label: 'Title Part 2 (Colored)', type: 'text', placeholder: 'Connect' },
                    { key: 'title2Bn', label: 'Title Part 2 (Bengali)', type: 'text', placeholder: 'যোগাযোগ করুন' },
                    { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Have questions?' },
                    { key: 'subtitleBn', label: 'Subtitle (Bengali)', type: 'textarea', placeholder: 'কোনো প্রশ্ন আছে?' },
                ]
            },
            {
                sectionKey: 'contactInfo',
                sectionName: 'Contact Information',
                sectionNameBn: 'যোগাযোগের তথ্য',
                icon: 'FiPhone',
                fields: [
                    { key: 'email', label: 'Email Address', type: 'text', placeholder: 'info@example.com' },
                    { key: 'phone', label: 'Phone Number', type: 'text', placeholder: '+88 01XXXXXXXXX' },
                    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Your address here' },
                    { key: 'addressBn', label: 'Address (Bengali)', type: 'textarea', placeholder: 'আপনার ঠিকানা' },
                    { key: 'officeHours', label: 'Office Hours', type: 'text', placeholder: 'Sat - Thu: 10AM - 6PM' },
                    { key: 'officeHoursBn', label: 'Office Hours (Bengali)', type: 'text', placeholder: 'শনি - বৃহস্পতি: সকাল ১০টা - সন্ধ্যা ৬টা' },
                ]
            },
            {
                sectionKey: 'socialLinks',
                sectionName: 'Social Links',
                sectionNameBn: 'সোশ্যাল লিংক',
                icon: 'FiGlobe',
                fields: [
                    { key: 'facebook', label: 'Facebook URL', type: 'link', placeholder: 'https://facebook.com/...' },
                    { key: 'youtube', label: 'YouTube URL', type: 'link', placeholder: 'https://youtube.com/...' },
                    { key: 'linkedin', label: 'LinkedIn URL', type: 'link', placeholder: 'https://linkedin.com/...' },
                    { key: 'instagram', label: 'Instagram URL', type: 'link', placeholder: 'https://instagram.com/...' },
                    { key: 'whatsapp', label: 'WhatsApp URL', type: 'link', placeholder: 'https://wa.me/...' },
                ]
            },
            {
                sectionKey: 'whatsappSection',
                sectionName: 'WhatsApp Quick Help',
                sectionNameBn: 'হোয়াটসঅ্যাপ সেকশন',
                icon: 'FiMessageCircle',
                fields: [
                    { key: 'title', label: 'Title', type: 'text', placeholder: 'Need Quick Help?' },
                    { key: 'titleBn', label: 'Title (Bengali)', type: 'text', placeholder: 'দ্রুত সাহায্য দরকার?' },
                    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Chat with us...' },
                    { key: 'descriptionBn', label: 'Description (Bengali)', type: 'textarea', placeholder: 'আমাদের সাথে চ্যাট করুন...' },
                    { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Chat on WhatsApp' },
                    { key: 'buttonTextBn', label: 'Button Text (Bengali)', type: 'text', placeholder: 'হোয়াটসঅ্যাপে চ্যাট করুন' },
                ]
            },
            {
                sectionKey: 'map',
                sectionName: 'Google Map',
                sectionNameBn: 'গুগল ম্যাপ',
                icon: 'FiMapPin',
                fields: [
                    { key: 'embedUrl', label: 'Google Map Embed URL', type: 'link', placeholder: 'https://www.google.com/maps/embed?...' },
                ]
            },
        ]
    },
];
