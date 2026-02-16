import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, avatar: true } });
    console.log(users);

    console.log('--- LISTINGS ---');
    const listings = await prisma.listing.findMany({ include: { owner: { select: { firstName: true } } } });
    console.log(listings);

    console.log('--- BOOKINGS ---');
    const bookings = await prisma.booking.findMany({ include: { listing: { select: { title: true } } } });
    console.log(bookings);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
