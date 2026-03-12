import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const listings = await prisma.listing.findMany({
            where: { ownerId: user.userId },
            orderBy: { createdAt: 'desc' },
            include: {
                media: { orderBy: { order: 'asc' } },
                pricing: true,
            }
        });

        return NextResponse.json({ listings });
    } catch (error) {
        console.error('Fetch user listings error:', error);
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }
}
