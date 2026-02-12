import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const listings = await prisma.listing.findMany({
        include: { owner: true }
    });

    console.log(`Total listings: ${listings.length}`);

    const seen = new Set();
    const duplicates = [];

    for (const l of listings) {
        const key = `${l.title}|${l.ownerId}`;
        if (seen.has(key)) {
            duplicates.push(l);
        } else {
            seen.add(key);
        }
    }

    console.log(`Duplicate listings found: ${duplicates.length}`);
    duplicates.forEach(d => {
        console.log(`Duplicate: "${d.title}" (ID: ${d.id}, Owner: ${d.owner.firstName})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
