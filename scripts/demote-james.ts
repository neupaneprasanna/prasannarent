import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function demoteJames() {
    try {
        const email = 'james@rentverse.com';
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'USER' },
        });
        console.log(`✅ User ${user.email} has been demoted to USER.`);
    } catch (error) {
        console.error(`❌ Failed to demote user: ${error}`);
    } finally {
        await prisma.$disconnect();
    }
}

demoteJames();
