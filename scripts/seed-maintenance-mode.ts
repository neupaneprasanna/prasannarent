import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding maintenance mode setting...');

    await prisma.platformSetting.upsert({
        where: { key: 'maintenance_mode' },
        update: {},
        create: {
            key: 'maintenance_mode',
            value: 'false',
            type: 'boolean',
            group: 'general',
            description: 'When enabled, only administrators can access the website.'
        }
    });

    console.log('✅ Maintenance mode setting initialized.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
