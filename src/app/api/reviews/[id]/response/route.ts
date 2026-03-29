import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// POST /api/reviews/[id]/response - Owner responds to a review
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id: reviewId } = await params;
        const { text } = await req.json();

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: 'Response text is required' }, { status: 400 });
        }

        // Verify the user is the listing owner
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: { listing: { select: { ownerId: true } } }
        });

        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        if (review.listing.ownerId !== user.userId) {
            return NextResponse.json({ error: 'Only the listing owner can respond' }, { status: 403 });
        }

        // Check if already responded
        const existing = await (prisma as any).reviewResponse.findUnique({ where: { reviewId } });
        if (existing) {
            // Update existing response
            const updated = await (prisma as any).reviewResponse.update({
                where: { reviewId },
                data: { text },
                include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
            });
            return NextResponse.json({ response: updated });
        }

        const response = await (prisma as any).reviewResponse.create({
            data: {
                reviewId,
                userId: user.userId,
                text,
            },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
        });

        return NextResponse.json({ response }, { status: 201 });
    } catch (error) {
        console.error('Review response error:', error);
        return NextResponse.json({ error: 'Failed to respond to review' }, { status: 500 });
    }
}
