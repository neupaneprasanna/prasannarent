import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ collectionId: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { collectionId } = await params;
        const body = await req.json();
        const { listingId, note } = body;

        const collection = await prisma.wishlistCollection.findUnique({
            where: { id: collectionId }
        });

        if (!collection || collection.userId !== user.userId) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        const item = await prisma.wishlistItem.upsert({
            where: {
                collectionId_listingId: {
                    collectionId,
                    listingId
                }
            },
            update: {
                note: note !== undefined ? note : undefined
            },
            create: {
                collectionId,
                listingId,
                note
            }
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Add item error:', error);
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }
}
