// ===================================================================
// Seed Script - Reset Categories and Add New Ones
// Run: node scripts/seedCategories.js
// ===================================================================

const mongoose = require('mongoose');

const DATABASE_URL = 'mongodb+srv://extraweb:extraweb@cluster0.b5kfivm.mongodb.net/extraweb?appName=Cluster0';

// Category Schema (simplified for seeding)
const categorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    icon: String,
    image: String,
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    status: { type: String, default: 'active' },
    type: { type: String, default: 'website' },
    productCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isParent: { type: Boolean, default: false },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

async function seedCategories() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(DATABASE_URL);
        console.log('✅ Connected to MongoDB');

        // Step 1: Delete all existing categories
        console.log('🗑️  Deleting all existing categories...');
        const deleteResult = await Category.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} categories`);

        // Step 2: Create Parent Categories
        console.log('📁 Creating parent categories...');

        const websiteParent = await Category.create({
            name: 'Website',
            slug: 'website',
            description: 'Premium website templates and themes',
            icon: 'LuGlobe',
            type: 'website',
            isParent: true,
            order: 1,
            status: 'active'
        });
        console.log(`✅ Created: Website (ID: ${websiteParent._id})`);

        const softwareParent = await Category.create({
            name: 'Software',
            slug: 'software',
            description: 'Ready-made software and scripts',
            icon: 'LuCode',
            type: 'software',
            isParent: true,
            order: 2,
            status: 'active'
        });
        console.log(`✅ Created: Software (ID: ${softwareParent._id})`);

        // Step 3: Create Child Categories under Website
        console.log('📂 Creating child categories under Website...');

        const childCategories = [
            { name: 'E-commerce', slug: 'ecommerce', description: 'Online store templates', icon: 'LuShoppingCart', order: 1 },
            { name: 'LMS', slug: 'lms', description: 'Learning Management System templates', icon: 'LuGraduationCap', order: 2 },
            { name: 'Marketplace', slug: 'marketplace', description: 'Multi-vendor marketplace templates', icon: 'LuStore', order: 3 },
            { name: 'Blog', slug: 'blog', description: 'Blog and news templates', icon: 'LuFileText', order: 4 },
            { name: 'Portfolio', slug: 'portfolio', description: 'Personal portfolio templates', icon: 'LuBriefcase', order: 5 },
        ];

        for (const child of childCategories) {
            const created = await Category.create({
                ...child,
                parentCategory: websiteParent._id,
                type: 'website',
                isParent: false,
                status: 'active'
            });
            console.log(`✅ Created: ${child.name} (Child of Website)`);
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log('📊 Summary:');
        console.log('   - 2 Parent Categories: Website, Software');
        console.log('   - 5 Child Categories under Website: E-commerce, LMS, Marketplace, Blog, Portfolio');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

seedCategories();
