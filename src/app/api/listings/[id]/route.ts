import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                owner: { select: { firstName: true, verified: true, avatar: true, bio: true } },
                media: { orderBy: { order: 'asc' } },
                pricing: true,
                attributes: true
            }
        });

        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

        return NextResponse.json({ listing });
    } catch (error) {
        console.error('Fetch listing error:', error);
        return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }
}
