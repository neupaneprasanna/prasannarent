import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding popular rentals...');

    // Upsert some real-looking users
    const users = [
        { email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Miller', verified: true },
        { email: 'james@example.com', firstName: 'James', lastName: 'TechRentals', verified: true },
        { email: 'elena@example.com', firstName: 'Elena', lastName: 'Studios', verified: true },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: u,
            create: { ...u, password: 'password123' },
        });
    }

    const sarah = await prisma.user.findUnique({ where: { email: 'sarah@example.com' } });
    const james = await prisma.user.findUnique({ where: { email: 'james@example.com' } });
    const elena = await prisma.user.findUnique({ where: { email: 'elena@example.com' } });

    if (!sarah || !james || !elena) throw new Error('Users not found');

    const listings = [
        {
            title: 'Sony A7IV Camera Kit',
            description: 'Full frame mirrorless camera with 24-70mm lens, perfect for professional photography and cinematography.',
            price: 89,
            category: 'tech',
            images: ['/assets/items/tech/sony-a7iv.png'],
            location: 'San Francisco, CA',
            rating: 4.9,
            reviewCount: 156,
            loveCount: 243,
            ownerId: james.id,
            featured: true,
        },
        {
            title: 'Tesla Model 3 Performance',
            description: '0-60 in 3.1 seconds. Full self-driving capability, premium interior, and ultimate performance.',
            price: 150,
            category: 'vehicles',
            images: ['/assets/items/vehicles/tesla-model-3.png'],
            location: 'Los Angeles, CA',
            rating: 4.8,
            reviewCount: 92,
            loveCount: 187,
            ownerId: james.id,
            featured: true,
        },
        {
            title: 'Downtown Recording Studio',
            description: 'Fully equipped recording studio with SSL board, Neumann microphones, and acoustic treatment.',
            price: 75,
            category: 'studios',
            images: ['/assets/items/studios/recording-studio.png'],
            location: 'New York, NY',
            rating: 4.7,
            reviewCount: 68,
            loveCount: 112,
            ownerId: elena.id,
            featured: false,
        },
        {
            title: 'MacBook Pro M3 Max',
            description: 'The most powerful laptop for creative professionals. 48GB RAM, 1TB SSD, Liquid Retina XDR display.',
            price: 65,
            category: 'digital',
            images: ['/assets/items/digital/macbook-pro.png'],
            location: 'Seattle, WA',
            rating: 5.0,
            reviewCount: 45,
            loveCount: 312,
            ownerId: sarah.id,
            featured: true,
        },
    ];

    for (const l of listings) {
        const existing = await prisma.listing.findFirst({
            where: {
                title: l.title,
                ownerId: l.ownerId
            }
        });

        if (existing) {
            console.log(`Updating existing listing: ${l.title}`);
            await prisma.listing.update({
                where: { id: existing.id },
                data: {
                    images: l.images,
                    category: l.category,
                    price: l.price,
                    location: l.location,
                    description: l.description,
                    featured: l.featured,
                    // @ts-ignore
                    loveCount: l.loveCount
                }
            });
            continue;
        }

        // @ts-ignore - loveCount might not be in the generated client yet
        await prisma.listing.create({ data: l });
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
