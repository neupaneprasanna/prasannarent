import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Booking Fetch ---');
    try {
        const bookings = await (prisma.booking as any).findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                listing: { select: { id: true, title: true, price: true, images: true } },
                renter: { select: { id: true, firstName: true, lastName: true, email: true } },
            }
        });
        console.log('Success! Found bookings:', bookings.length);
        if (bookings.length > 0) {
            console.log('First booking sample:', JSON.stringify(bookings[0], null, 2));
        }
    } catch (error) {
        console.error('FAILED to fetch bookings:', error);
    }

    console.log('\n--- Checking Booking Model ---');
    try {
        const count = await prisma.booking.count();
        console.log('Total bookings count:', count);
    } catch (error) {
        console.error('FAILED to count bookings:', error);
    }

    await prisma.$disconnect();
}

main();
