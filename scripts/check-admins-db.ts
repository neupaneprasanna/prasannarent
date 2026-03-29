import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { email: true, firstName: true, role: true }
    });
    console.log(JSON.stringify(admins, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
