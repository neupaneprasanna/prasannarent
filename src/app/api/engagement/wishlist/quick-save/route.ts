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

        // Find default collection
        let defaultCollection = await prisma.wishlistCollection.findFirst({
            where: { userId: user.userId, isDefault: true }
        });

        if (!defaultCollection) {
            // Fallback to first collection or create one
            defaultCollection = await prisma.wishlistCollection.findFirst({
                where: { userId: user.userId }
            });

            if (!defaultCollection) {
                defaultCollection = await prisma.wishlistCollection.create({
                    data: {
                        userId: user.userId,
                        name: 'Saved Items',
                        emoji: '❤️',
                        isDefault: true,
                    }
                });
            }
        }

        const item = await prisma.wishlistItem.upsert({
            where: {
                collectionId_listingId: {
                    collectionId: defaultCollection.id,
                    listingId
                }
            },
            update: {},
            create: {
                collectionId: defaultCollection.id,
                listingId
            }
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Quick save error:', error);
        return NextResponse.json({ error: 'Failed to quick save' }, { status: 500 });
    }
}
