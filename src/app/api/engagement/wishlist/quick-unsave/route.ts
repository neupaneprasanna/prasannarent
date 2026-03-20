import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { listingId } = body;

        if (!listingId) {
            return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
        }

        // Find all collections for user
        const userCollections = await prisma.wishlistCollection.findMany({
            where: { userId: user.userId },
            select: { id: true }
        });

        const collectionIds = userCollections.map(c => c.id);

        if (collectionIds.length > 0) {
            // Delete from all collections
            await prisma.wishlistItem.deleteMany({
                where: {
                    listingId,
                    collectionId: { in: collectionIds }
                }
            });
        }

        return NextResponse.json({ message: 'Item unsaved from all collections' });
    } catch (error) {
        console.error('Quick unsave error:', error);
        return NextResponse.json({ error: 'Failed to quick unsave' }, { status: 500 });
    }
}
