import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive data seeding...');

    // 1. CLEAR EXISTING DATA (Optional, but ensures clean state)
    console.log('🧹 Cleaning old data...');
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();

    // 1.5 CREATE ADMINS
    console.log('👤 Creating admins...');
    const adminAccounts = [
        { email: 'prasanna@gmail.com', password: 'prasanna', role: 'SUPER_ADMIN', firstName: 'Prasanna' },
        { email: 'neupane@gmail.com', password: 'neupane', role: 'ADMIN', firstName: 'Neupane' },
        { email: 'ashutosh@gmail.com', password: 'ashutosh', role: 'MODERATOR', firstName: 'Ashutosh' },
        { email: 'manish@gmail.com', password: 'manish', role: 'FINANCE', firstName: 'Manish' },
    ];

    for (const admin of adminAccounts) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await prisma.user.create({
            data: {
                email: admin.email,
                password: hashedPassword,
                firstName: admin.firstName,
                lastName: 'Admin',
                role: admin.role as any,
                verified: true,
            }
        });
    }

    // 2. CREATE 4 PREMIUM USERS
    console.log('💎 Creating 4 premium users and listings...');
    const premiumUsers = [
        { email: 'james@rentverse.com', firstName: 'James', lastName: 'TechMaster', verified: true },
        { email: 'sarah@rentverse.com', firstName: 'Sarah', lastName: 'StudioPro', verified: true },
        { email: 'elena@rentverse.com', firstName: 'Elena', lastName: 'LuxuryDrive', verified: true },
        { email: 'alex@rentverse.com', firstName: 'Alex', lastName: 'DigitalGuru', verified: true },
    ];

    const premiumListings = [
        {
            title: 'Sony A7IV Professional Camera Kit',
            description: 'Industry-leading mirrorless camera with 24-70mm f2.8 lens. Perfect for high-end weddings and commercials.',
            price: 120,
            category: 'tech',
            images: ['/assets/items/tech/sony-a7iv.png'],
            location: 'Downtown, San Francisco',
            rating: 5.0,
            reviewCount: 245,
            featured: true,
        },
        {
            title: 'Professional Recording Studio',
            description: 'Acoustically treated studio room with SSL board and vintage Neumann mics. Includes assistant engineer.',
            price: 85,
            category: 'studios',
            images: ['/assets/items/studios/recording-studio.png'],
            location: 'Manhattan, New York',
            rating: 4.9,
            reviewCount: 188,
            featured: true,
        },
        {
            title: 'Tesla Model 3 Performance 2024',
            description: 'Zero emissions, maximum thrills. 0-60 in 3.1s. Full Self-Driving enabled for the ultimate experience.',
            price: 199,
            category: 'vehicles',
            images: ['/assets/items/vehicles/tesla-model-3.png'],
            location: 'Beverly Hills, CA',
            rating: 4.8,
            reviewCount: 312,
            featured: true,
        },
        {
            title: 'Ultimate MacBook Pro Setup (M3 Max)',
            description: 'Highest specs available. 128GB RAM, 8TB SSD. Ideal for 8K video editing and 3D rendering projects.',
            price: 75,
            category: 'digital',
            images: ['/assets/items/digital/macbook-pro.png'],
            location: 'Tech Hub, Seattle',
            rating: 5.0,
            reviewCount: 156,
            featured: true,
        },
    ];

    for (let i = 0; i < premiumUsers.length; i++) {
        const user = await prisma.user.create({
            data: {
                ...premiumUsers[i],
                password: 'password123',
                role: 'USER',
            }
        });

        await prisma.listing.create({
            data: {
                ...premiumListings[i],
                ownerId: user.id
            }
        });
    }

    // 3. CREATE 10 BASIC USERS AND LISTINGS
    console.log('📁 Creating 10 basic users and listings...');
    const basicFirstNames = ['John', 'Jane', 'Mike', 'Emily', 'David', 'Chris', 'Anna', 'Lucas', 'Mia', 'Noah'];
    const basicLastNames = ['Smith', 'Doe', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'White', 'Harris'];
    const categories = ['tools', 'equipment', 'fashion', 'rooms', 'tech', 'vehicles'];

    for (let i = 0; i < 10; i++) {
        const firstName = basicFirstNames[i];
        const lastName = basicLastNames[i];
        const email = `${firstName.toLowerCase()}${i}@example.com`;

        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: 'password123',
                verified: false,
            }
        });

        // Create a standard listing without photos
        await prisma.listing.create({
            data: {
                title: `Vintage ${firstName}'s ${categories[i % categories.length]}`,
                description: 'A simple rental item in good condition. Minimal usage, works as expected.',
                price: Math.floor(Math.random() * 40) + 10,
                category: categories[i % categories.length],
                images: [], // No photos as requested
                location: 'Suburban Area',
                rating: parseFloat((Math.random() * 1.5 + 2.0).toFixed(1)), // 2.0 - 3.5
                reviewCount: Math.floor(Math.random() * 15) + 2, // Less reviews
                featured: false,
                ownerId: user.id
            }
        });
    }

    console.log('✅ Seeding complete!');
    console.log('📊 Summary:');
    console.log('- 1 Super Admin (prasanna@gmail.com)');
    console.log('- 4 Premium users with featured listings and assets');
    console.log('- 10 Basic users with simple listings (placeholders only)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
