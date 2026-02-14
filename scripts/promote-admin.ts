import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promote(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'SUPER_ADMIN' },
        });
        console.log(`✅ User ${user.email} has been promoted to SUPER_ADMIN`);
    } catch (error) {
        console.error(`❌ Failed to promote user: ${error}`);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node --loader ts-node/esm scripts/promote-admin.ts <email>');
} else {
    promote(email);
}
