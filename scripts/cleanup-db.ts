import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up duplicate listings...');

    const listings = await prisma.listing.findMany({
        orderBy: { createdAt: 'asc' }
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const l of listings) {
        const key = `${l.title}|${l.ownerId}`;
        if (seen.has(key)) {
            toDelete.push(l.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length === 0) {
        console.log('No duplicates found.');
        return;
    }

    console.log(`Deleting ${toDelete.length} duplicate(s)...`);

    // Delete in chunks if necessary, but 12 is small
    await prisma.listing.deleteMany({
        where: {
            id: { in: toDelete }
        }
    });

    console.log('✅ Cleanup complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
