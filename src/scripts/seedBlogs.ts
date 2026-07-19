/**
 * Blog Seed Script
 * Run this to create 5 demo blog posts
 * 
 * Usage: npx ts-node src/scripts/seedBlogs.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';

const MONGO_URI = process.env.DATABASE_URL!;

const seedBlogs = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const blogsCollection = db.collection('blogs');
        const usersCollection = db.collection('users');
        const categoriesCollection = db.collection('categories');

        // Get admin user
        const adminUser = await usersCollection.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('❌ Admin user not found! Please run seedAdmin first.');
            process.exit(1);
        }
        console.log(`📧 Found admin: ${adminUser.email}`);

        // Get or create a category for blogs
        let blogCategory = await categoriesCollection.findOne({ slug: 'technology' });
        if (!blogCategory) {
            // Create technology category
            const result = await categoriesCollection.insertOne({
                name: 'Technology',
                nameBn: 'টেকনোলজি',
                slug: 'technology',
                description: 'Technology related articles',
                descriptionBn: 'প্রযুক্তি সম্পর্কিত আর্টিকেল',
                type: 'website',
                isActive: true,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            blogCategory = { _id: result.insertedId };
            console.log('📂 Created Technology category');
        }

        // Delete existing demo blogs (optional - to avoid duplicates)
        await blogsCollection.deleteMany({
            slug: { $regex: /^demo-blog-/ }
        });
        console.log('🗑️ Removed existing demo blogs');

        // 5 Demo Blog Posts
        const demoBlogs = [
            {
                title: 'Getting Started with Web Development in 2024',
                titleBn: '২০২৪ সালে ওয়েব ডেভেলপমেন্ট শুরু করার গাইড',
                slug: 'demo-blog-getting-started-web-development-2024',
                excerpt: 'A comprehensive guide to starting your web development journey in 2024. Learn about the latest technologies, frameworks, and best practices.',
                excerptBn: '২০২৪ সালে ওয়েব ডেভেলপমেন্ট শুরু করার জন্য একটি সম্পূর্ণ গাইড। সর্বশেষ প্রযুক্তি, ফ্রেমওয়ার্ক এবং সেরা অনুশীলন সম্পর্কে জানুন।',
                content: `
                    <h2>Introduction to Web Development</h2>
                    <p>Web development is one of the most in-demand skills in the tech industry. Whether you're looking to start a new career or enhance your existing skills, learning web development opens up endless opportunities.</p>
                    
                    <h2>Essential Technologies to Learn</h2>
                    <p>Start with the fundamentals: HTML, CSS, and JavaScript. These three technologies form the backbone of every website you see on the internet.</p>
                    
                    <h3>HTML (HyperText Markup Language)</h3>
                    <p>HTML provides the structure of web pages. It's the skeleton that holds everything together.</p>
                    
                    <h3>CSS (Cascading Style Sheets)</h3>
                    <p>CSS makes your websites beautiful. It handles colors, layouts, fonts, and animations.</p>
                    
                    <h3>JavaScript</h3>
                    <p>JavaScript brings interactivity to your websites. From form validation to complex web applications, JavaScript is essential.</p>
                    
                    <h2>Popular Frameworks in 2024</h2>
                    <p>Once you master the basics, explore popular frameworks like React, Next.js, Vue.js, or Angular to build modern web applications efficiently.</p>
                    
                    <h2>Conclusion</h2>
                    <p>Start your journey today! The web development community is welcoming and there are countless free resources available to help you learn.</p>
                `,
                contentBn: `
                    <h2>ওয়েব ডেভেলপমেন্ট পরিচিতি</h2>
                    <p>ওয়েব ডেভেলপমেন্ট হল প্রযুক্তি শিল্পের সবচেয়ে চাহিদাসম্পন্ন দক্ষতাগুলির মধ্যে একটি। আপনি একটি নতুন ক্যারিয়ার শুরু করতে চান বা আপনার বিদ্যমান দক্ষতা বাড়াতে চান, ওয়েব ডেভেলপমেন্ট শেখা অফুরন্ত সুযোগ খুলে দেয়।</p>
                    
                    <h2>শেখার জন্য প্রয়োজনীয় প্রযুক্তি</h2>
                    <p>মৌলিক বিষয়গুলি দিয়ে শুরু করুন: HTML, CSS, এবং JavaScript। এই তিনটি প্রযুক্তি ইন্টারনেটে আপনি যে প্রতিটি ওয়েবসাইট দেখেন তার মেরুদণ্ড।</p>
                    
                    <h2>উপসংহার</h2>
                    <p>আজই আপনার যাত্রা শুরু করুন! ওয়েব ডেভেলপমেন্ট কমিউনিটি স্বাগত জানায় এবং আপনাকে শিখতে সাহায্য করার জন্য অসংখ্য বিনামূল্যের রিসোর্স উপলব্ধ।</p>
                `,
                thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
                category: blogCategory._id,
                tags: ['web development', 'javascript', 'html', 'css', 'programming'],
                author: adminUser._id,
                authorRole: 'admin',
                status: 'published',
                isFeatured: true,
                isPopular: true,
                allowComments: true,
                totalViews: 1250,
                likeCount: 89,
                likedBy: [],
                commentCount: 12,
                shareCount: 45,
                readingTime: 5,
                wordCount: 450,
                metaTitle: 'Getting Started with Web Development in 2024',
                metaDescription: 'Learn how to start your web development journey in 2024 with this comprehensive guide.',
                metaKeywords: ['web development', 'programming', 'javascript'],
                publishedAt: new Date('2024-01-10'),
                createdAt: new Date('2024-01-10'),
                updatedAt: new Date('2024-01-10'),
            },
            {
                title: 'Mastering React.js: From Beginner to Pro',
                titleBn: 'React.js আয়ত্ত করা: বিগিনার থেকে প্রো',
                slug: 'demo-blog-mastering-reactjs-beginner-to-pro',
                excerpt: 'Learn React.js from scratch and become a professional React developer. This guide covers components, hooks, state management, and more.',
                excerptBn: 'শুরু থেকে React.js শিখুন এবং একজন পেশাদার React ডেভেলপার হয়ে উঠুন। এই গাইডে কম্পোনেন্ট, হুকস, স্টেট ম্যানেজমেন্ট এবং আরও অনেক কিছু রয়েছে।',
                content: `
                    <h2>Why Learn React?</h2>
                    <p>React.js is the most popular JavaScript library for building user interfaces. It's used by companies like Facebook, Netflix, Instagram, and many more.</p>
                    
                    <h2>Understanding Components</h2>
                    <p>Components are the building blocks of React applications. They allow you to split the UI into independent, reusable pieces.</p>
                    
                    <h2>React Hooks Explained</h2>
                    <p>Hooks let you use state and other React features without writing a class. The most common hooks are useState and useEffect.</p>
                    
                    <h2>State Management</h2>
                    <p>For larger applications, you'll need proper state management. Explore options like Redux, Zustand, or React Context.</p>
                    
                    <h2>Best Practices</h2>
                    <p>Follow React best practices to write clean, maintainable code. Use proper folder structures, write reusable components, and optimize performance.</p>
                `,
                contentBn: `
                    <h2>কেন React শিখবেন?</h2>
                    <p>React.js হল ইউজার ইন্টারফেস তৈরির জন্য সবচেয়ে জনপ্রিয় JavaScript লাইব্রেরি। এটি Facebook, Netflix, Instagram এবং আরও অনেক কোম্পানি ব্যবহার করে।</p>
                    
                    <h2>কম্পোনেন্ট বোঝা</h2>
                    <p>কম্পোনেন্ট হল React অ্যাপ্লিকেশনের বিল্ডিং ব্লক। এগুলি আপনাকে UI কে স্বাধীন, পুনরায় ব্যবহারযোগ্য টুকরোগুলিতে বিভক্ত করতে দেয়।</p>
                    
                    <h2>সেরা অনুশীলন</h2>
                    <p>পরিষ্কার, রক্ষণাবেক্ষণযোগ্য কোড লিখতে React সেরা অনুশীলনগুলি অনুসরণ করুন।</p>
                `,
                thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
                category: blogCategory._id,
                tags: ['react', 'javascript', 'frontend', 'web development'],
                author: adminUser._id,
                authorRole: 'admin',
                status: 'published',
                isFeatured: true,
                isPopular: true,
                allowComments: true,
                totalViews: 980,
                likeCount: 76,
                likedBy: [],
                commentCount: 8,
                shareCount: 32,
                readingTime: 7,
                wordCount: 520,
                metaTitle: 'Mastering React.js: Complete Guide',
                metaDescription: 'Learn React.js from beginner to professional level with this comprehensive guide.',
                metaKeywords: ['react', 'javascript', 'frontend'],
                publishedAt: new Date('2024-01-08'),
                createdAt: new Date('2024-01-08'),
                updatedAt: new Date('2024-01-08'),
            },
            {
                title: 'UI/UX Design Principles Every Developer Should Know',
                titleBn: 'প্রতিটি ডেভেলপারের জানা উচিত এমন UI/UX ডিজাইন নীতিমালা',
                slug: 'demo-blog-ui-ux-design-principles',
                excerpt: 'Understanding UI/UX design principles is essential for developers. Learn how to create user-friendly and visually appealing interfaces.',
                excerptBn: 'ডেভেলপারদের জন্য UI/UX ডিজাইন নীতিমালা বোঝা অপরিহার্য। ব্যবহারকারী-বান্ধব এবং দৃষ্টিনন্দন ইন্টারফেস তৈরি করতে শিখুন।',
                content: `
                    <h2>What is UI/UX Design?</h2>
                    <p>UI (User Interface) design focuses on the visual elements of a product, while UX (User Experience) design focuses on the overall feel and usability.</p>
                    
                    <h2>Key Design Principles</h2>
                    <h3>1. Consistency</h3>
                    <p>Maintain consistent design patterns throughout your application. This helps users learn and navigate your interface quickly.</p>
                    
                    <h3>2. Visual Hierarchy</h3>
                    <p>Use size, color, and spacing to guide users' attention to the most important elements first.</p>
                    
                    <h3>3. Accessibility</h3>
                    <p>Design for everyone. Ensure your interface is usable by people with disabilities.</p>
                    
                    <h2>Tools to Use</h2>
                    <p>Popular design tools include Figma, Adobe XD, and Sketch. Learn at least one of these to collaborate effectively with designers.</p>
                `,
                contentBn: `
                    <h2>UI/UX ডিজাইন কী?</h2>
                    <p>UI (User Interface) ডিজাইন একটি প্রোডাক্টের ভিজ্যুয়াল উপাদানগুলিতে ফোকাস করে, যখন UX (User Experience) ডিজাইন সামগ্রিক অনুভূতি এবং ব্যবহারযোগ্যতায় ফোকাস করে।</p>
                    
                    <h2>মূল ডিজাইন নীতিমালা</h2>
                    <h3>১. সামঞ্জস্য</h3>
                    <p>আপনার অ্যাপ্লিকেশন জুড়ে সামঞ্জস্যপূর্ণ ডিজাইন প্যাটার্ন বজায় রাখুন।</p>
                    
                    <h3>২. ভিজ্যুয়াল হায়ারার্কি</h3>
                    <p>ব্যবহারকারীদের মনোযোগ প্রথমে সবচেয়ে গুরুত্বপূর্ণ উপাদানগুলিতে নির্দেশ করতে আকার, রঙ এবং স্পেসিং ব্যবহার করুন।</p>
                `,
                thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
                category: blogCategory._id,
                tags: ['design', 'ui', 'ux', 'frontend'],
                author: adminUser._id,
                authorRole: 'admin',
                status: 'published',
                isFeatured: false,
                isPopular: true,
                allowComments: true,
                totalViews: 750,
                likeCount: 52,
                likedBy: [],
                commentCount: 5,
                shareCount: 28,
                readingTime: 6,
                wordCount: 480,
                metaTitle: 'UI/UX Design Principles for Developers',
                metaDescription: 'Essential UI/UX design principles every developer should know.',
                metaKeywords: ['design', 'ui', 'ux'],
                publishedAt: new Date('2024-01-05'),
                createdAt: new Date('2024-01-05'),
                updatedAt: new Date('2024-01-05'),
            },
            {
                title: 'Building Your Career in IT: Tips and Strategies',
                titleBn: 'আইটি-তে আপনার ক্যারিয়ার গড়া: টিপস এবং কৌশল',
                slug: 'demo-blog-building-career-in-it',
                excerpt: 'Practical advice for building a successful career in the IT industry. From choosing the right path to networking and continuous learning.',
                excerptBn: 'আইটি ইন্ডাস্ট্রিতে সফল ক্যারিয়ার গড়ার ব্যবহারিক পরামর্শ। সঠিক পথ বেছে নেওয়া থেকে নেটওয়ার্কিং এবং ক্রমাগত শেখা পর্যন্ত।',
                content: `
                    <h2>Choosing Your Path</h2>
                    <p>The IT industry offers many career paths: web development, mobile development, data science, cybersecurity, cloud computing, and more. Research each field to find what excites you most.</p>
                    
                    <h2>Essential Skills</h2>
                    <p>Beyond technical skills, develop soft skills like communication, problem-solving, and teamwork. These are equally important for career growth.</p>
                    
                    <h2>Building a Portfolio</h2>
                    <p>Create projects that showcase your skills. A strong portfolio is often more valuable than certifications alone.</p>
                    
                    <h2>Networking</h2>
                    <p>Connect with professionals in your field. Attend meetups, join online communities, and don't be afraid to reach out to people on LinkedIn.</p>
                    
                    <h2>Never Stop Learning</h2>
                    <p>Technology evolves rapidly. Stay updated with industry trends and continuously improve your skills.</p>
                `,
                contentBn: `
                    <h2>আপনার পথ বেছে নেওয়া</h2>
                    <p>আইটি ইন্ডাস্ট্রি অনেক ক্যারিয়ার পথ অফার করে: ওয়েব ডেভেলপমেন্ট, মোবাইল ডেভেলপমেন্ট, ডেটা সায়েন্স, সাইবার সিকিউরিটি, ক্লাউড কম্পিউটিং এবং আরও অনেক কিছু।</p>
                    
                    <h2>প্রয়োজনীয় দক্ষতা</h2>
                    <p>প্রযুক্তিগত দক্ষতার বাইরে, যোগাযোগ, সমস্যা সমাধান এবং টিমওয়ার্কের মতো সফট স্কিল তৈরি করুন।</p>
                    
                    <h2>শেখা কখনও বন্ধ করবেন না</h2>
                    <p>প্রযুক্তি দ্রুত বিকশিত হয়। ইন্ডাস্ট্রি ট্রেন্ডের সাথে আপডেট থাকুন এবং ক্রমাগত আপনার দক্ষতা উন্নত করুন।</p>
                `,
                thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop',
                category: blogCategory._id,
                tags: ['career', 'it', 'jobs', 'tips'],
                author: adminUser._id,
                authorRole: 'admin',
                status: 'published',
                isFeatured: true,
                isPopular: false,
                allowComments: true,
                totalViews: 620,
                likeCount: 45,
                likedBy: [],
                commentCount: 7,
                shareCount: 21,
                readingTime: 5,
                wordCount: 410,
                metaTitle: 'Building Your IT Career',
                metaDescription: 'Tips and strategies for building a successful career in IT.',
                metaKeywords: ['career', 'it', 'jobs'],
                publishedAt: new Date('2024-01-03'),
                createdAt: new Date('2024-01-03'),
                updatedAt: new Date('2024-01-03'),
            },
            {
                title: 'Introduction to Next.js 14: The React Framework',
                titleBn: 'Next.js 14 পরিচিতি: দ্য React ফ্রেমওয়ার্ক',
                slug: 'demo-blog-introduction-nextjs-14',
                excerpt: 'Next.js 14 brings powerful new features for building modern web applications. Learn about server components, app router, and more.',
                excerptBn: 'Next.js 14 আধুনিক ওয়েব অ্যাপ্লিকেশন তৈরির জন্য শক্তিশালী নতুন ফিচার নিয়ে এসেছে। সার্ভার কম্পোনেন্ট, অ্যাপ রাউটার এবং আরও অনেক কিছু সম্পর্কে জানুন।',
                content: `
                    <h2>What is Next.js?</h2>
                    <p>Next.js is a React framework that enables features like server-side rendering, static site generation, and API routes out of the box.</p>
                    
                    <h2>New Features in Next.js 14</h2>
                    <h3>Turbopack</h3>
                    <p>A new bundler that's significantly faster than Webpack, improving development experience.</p>
                    
                    <h3>Server Components</h3>
                    <p>React Server Components allow you to render components on the server, reducing JavaScript sent to the client.</p>
                    
                    <h3>App Router</h3>
                    <p>The new app router provides a more intuitive way to organize your application with layouts, loading states, and error handling.</p>
                    
                    <h2>Getting Started</h2>
                    <p>Create a new Next.js project with: npx create-next-app@latest my-app</p>
                    
                    <h2>Conclusion</h2>
                    <p>Next.js 14 makes building fast, scalable web applications easier than ever. Start exploring today!</p>
                `,
                contentBn: `
                    <h2>Next.js কী?</h2>
                    <p>Next.js হল একটি React ফ্রেমওয়ার্ক যা সার্ভার-সাইড রেন্ডারিং, স্ট্যাটিক সাইট জেনারেশন এবং API রাউটের মতো ফিচারগুলি বক্স থেকে সক্ষম করে।</p>
                    
                    <h2>Next.js ১৪-এ নতুন ফিচার</h2>
                    <h3>Turbopack</h3>
                    <p>একটি নতুন বান্ডলার যা Webpack এর চেয়ে উল্লেখযোগ্যভাবে দ্রুত, ডেভেলপমেন্ট অভিজ্ঞতা উন্নত করে।</p>
                    
                    <h2>উপসংহার</h2>
                    <p>Next.js 14 দ্রুত, স্কেলেবল ওয়েব অ্যাপ্লিকেশন তৈরি করা আগের চেয়ে সহজ করে তোলে।</p>
                `,
                thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
                category: blogCategory._id,
                tags: ['nextjs', 'react', 'javascript', 'framework'],
                author: adminUser._id,
                authorRole: 'admin',
                status: 'published',
                isFeatured: false,
                isPopular: true,
                allowComments: true,
                totalViews: 890,
                likeCount: 67,
                likedBy: [],
                commentCount: 9,
                shareCount: 38,
                readingTime: 6,
                wordCount: 490,
                metaTitle: 'Introduction to Next.js 14',
                metaDescription: 'Learn about the new features in Next.js 14 and how to get started.',
                metaKeywords: ['nextjs', 'react', 'framework'],
                publishedAt: new Date('2024-01-01'),
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
        ];

        // Insert blogs
        const result = await blogsCollection.insertMany(demoBlogs);

        console.log('');
        console.log('✅ Demo blogs created successfully!');
        console.log(`📝 Created ${result.insertedCount} blog posts`);
        console.log('');
        console.log('Blog slugs created:');
        demoBlogs.forEach((blog, i) => {
            console.log(`  ${i + 1}. ${blog.slug}`);
        });
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedBlogs();
