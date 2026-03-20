import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ collectionId: string, listingId: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { collectionId, listingId } = await params;
        
        // Ensure user owns collection
        const collection = await prisma.wishlistCollection.findUnique({
            where: { id: collectionId }
        });

        if (!collection || collection.userId !== user.userId) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.wishlistItem.delete({
            where: {
                collectionId_listingId: {
                    collectionId,
                    listingId
                }
            }
        });

        return NextResponse.json({ message: 'Item removed' });
    } catch (error) {
        console.error('Remove item error:', error);
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
    }
}
