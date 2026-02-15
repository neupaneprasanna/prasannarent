import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, firstName: true, lastName: true,
                avatar: true, bio: true, verified: true,
                city: true, interests: true,
                createdAt: true,
            } as any,
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const listings = await prisma.listing.findMany({
            where: { ownerId: id, status: 'ACTIVE' },
            take: 12,
            orderBy: { createdAt: 'desc' },
        });

        const reviews = await prisma.review.findMany({
            where: { userId: id },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { listing: { select: { title: true } } },
        });

        const listingCount = await prisma.listing.count({ where: { ownerId: id, status: 'ACTIVE' } });
        const reviewCount = await prisma.review.count({ where: { userId: id } });

        return NextResponse.json({ user, listings, reviews, stats: { listingCount, reviewCount } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
