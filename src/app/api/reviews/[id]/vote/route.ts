import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// POST /api/reviews/[id]/vote - Toggle helpful/unhelpful vote on a review
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id: reviewId } = await params;
        const { helpful } = await req.json();

        if (typeof helpful !== 'boolean') {
            return NextResponse.json({ error: 'helpful must be a boolean' }, { status: 400 });
        }

        // Check if already voted
        const existing = await (prisma as any).reviewVote.findUnique({
            where: { reviewId_userId: { reviewId, userId: user.userId } }
        });

        if (existing) {
            if (existing.helpful === helpful) {
                // Same vote = remove it (toggle off)
                await (prisma as any).reviewVote.delete({
                    where: { reviewId_userId: { reviewId, userId: user.userId } }
                });
                return NextResponse.json({ message: 'Vote removed', voted: null });
            } else {
                // Different vote = update it
                const updated = await (prisma as any).reviewVote.update({
                    where: { reviewId_userId: { reviewId, userId: user.userId } },
                    data: { helpful }
                });
                return NextResponse.json({ message: 'Vote updated', voted: updated.helpful });
            }
        }

        const vote = await (prisma as any).reviewVote.create({
            data: { reviewId, userId: user.userId, helpful }
        });

        return NextResponse.json({ message: 'Vote recorded', voted: vote.helpful }, { status: 201 });
    } catch (error) {
        console.error('Review vote error:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
