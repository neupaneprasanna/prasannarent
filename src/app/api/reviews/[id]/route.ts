import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/reviews/[id] - Get reviews for a listing
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const reviews = await prisma.review.findMany({
            where: { listingId: id },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                response: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                },
                votes: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute helpful counts
        const enrichedReviews = reviews.map(r => ({
            ...r,
            helpfulCount: r.votes.filter(v => v.helpful).length,
            unhelpfulCount: r.votes.filter(v => !v.helpful).length,
        }));

        return NextResponse.json({ reviews: enrichedReviews });
    } catch (error) {
        console.error('Fetch reviews error:', error);
        return NextResponse.json({ reviews: [] });
    }
}

// POST /api/reviews/[id] - Create a review for a listing
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { rating, text, images } = await req.json();

        if (!rating || !text) {
            return NextResponse.json({ error: 'Rating and text are required' }, { status: 400 });
        }

        // Check if user already reviewed
        const existing = await prisma.review.findFirst({
            where: { listingId: id, userId: user.userId }
        });
        if (existing) {
            return NextResponse.json({ error: 'You already reviewed this listing' }, { status: 400 });
        }

        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.review.create({
                data: {
                    listingId: id,
                    userId: user.userId,
                    rating: parseInt(rating),
                    text,
                    images: images || [],
                },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                }
            });

            // Update listing rating
            const reviews = await tx.review.findMany({
                where: { listingId: id },
                select: { rating: true }
            });
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

            await tx.listing.update({
                where: { id },
                data: { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length }
            });

            return newReview;
        });

        return NextResponse.json({ review }, { status: 201 });
    } catch (error) {
        console.error('Create review error:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
