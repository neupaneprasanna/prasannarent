import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const admins = [
        { email: 'ashutosh@gmail.com', password: 'ashutosh', role: 'MODERATOR', firstName: 'Ashutosh' },
        { email: 'manish@gmail.com', password: 'manish', role: 'FINANCE', firstName: 'Manish' },
    ];

    console.log('🚀 Creating extra admin accounts...');

    for (const admin of admins) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        try {
            await prisma.user.upsert({
                where: { email: admin.email },
                update: {
                    password: hashedPassword,
                    role: admin.role as any,
                    firstName: admin.firstName,
                    verified: true,
                },
                create: {
                    email: admin.email,
                    password: hashedPassword,
                    firstName: admin.firstName,
                    lastName: 'Admin',
                    role: admin.role as any,
                    verified: true,
                }
            });
            console.log(`✅ Created/Updated ${admin.role}: ${admin.email}`);
        } catch (error) {
            console.error(`❌ Failed to create ${admin.email}:`, error);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
