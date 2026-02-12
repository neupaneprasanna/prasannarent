import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const listings = await prisma.listing.findMany({
        select: {
            title: true,
            images: true,
            owner: { select: { firstName: true } }
        }
    });

    console.log('--- Listing Image Verification ---');
    listings.forEach(l => {
        console.log(`Listing: "${l.title}" | Owner: ${l.owner.firstName} | Images: ${JSON.stringify(l.images)}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
