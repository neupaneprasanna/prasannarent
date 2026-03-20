import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        // If q is provided, search by firstName/lastName, otherwise get recent users
        const whereClause = {
            banned: false,
            ...(q ? {
                OR: [
                    { firstName: { contains: q, mode: 'insensitive' as const } },
                    { lastName: { contains: q, mode: 'insensitive' as const } },
                    { email: { contains: q, mode: 'insensitive' as const } }
                ]
            } : {})
        };

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                verified: true,
                city: true,
                lastSeenAt: true
            },
            take: 30,
            orderBy: q ? { firstName: 'asc' } : { createdAt: 'desc' }
        });

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
