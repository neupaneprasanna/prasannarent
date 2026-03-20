
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding admins...');

    // 1. Super Admin
    const superAdminPassword = await bcrypt.hash('prasanna', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'prasanna@gmail.com' },
        update: { role: 'SUPER_ADMIN', password: superAdminPassword },
        create: {
            email: 'prasanna@gmail.com',
            password: superAdminPassword,
            firstName: 'Prasanna',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            verified: true,
        },
    });
    console.log(`✅ Created Super Admin: ${superAdmin.email}`);

    // 2. Admin
    const adminPassword = await bcrypt.hash('ashustosh', 10); // User specified 'ashustosh'
    const admin = await prisma.user.upsert({
        where: { email: 'ashutosh@gmail.com' },
        update: { role: 'ADMIN', password: adminPassword },
        create: {
            email: 'ashutosh@gmail.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            verified: true,
        },
    });
    console.log(`✅ Created Admin: ${admin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
