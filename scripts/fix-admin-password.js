import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPassword() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.update({
        where: { email: 'james@rentverse.com' },
        data: { password: hashedPassword },
    });
    console.log(`✅ Password hashed for ${user.email}`);
    await prisma.$disconnect();
}

fixPassword().catch(console.error);
