import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdmin() {
    try {
        const admins = [
            { email: 'prasanna@gmail.com', password: 'prasanna', role: 'SUPER_ADMIN', firstName: 'Prasanna' },
            { email: 'neupane@gmail.com', password: 'neupane', role: 'ADMIN', firstName: 'Neupane' },
        ];

        for (const admin of admins) {
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            const user = await prisma.user.upsert({
                where: { email: admin.email },
                update: {
                    password: hashedPassword,
                    role: admin.role as any,
                    verified: true,
                },
                create: {
                    email: admin.email,
                    password: hashedPassword,
                    firstName: admin.firstName,
                    lastName: 'Admin',
                    role: admin.role as any,
                    verified: true,
                },
            });
            console.log(`✅ Admin user updated/created: ${user.email} (${user.role})`);
        }
    } catch (error) {
        console.error('❌ Failed to update admin credentials:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAdmin();
