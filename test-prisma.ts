import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Keys:", Object.keys(prisma).filter(k => 
        k.toLowerCase().includes('follow') || 
        k.toLowerCase().includes('reputation') ||
        k.toLowerCase().includes('connection') ||
        k.toLowerCase().includes('achievement')
    ));
}
main().catch(console.error);
