import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Find existing collections
        let collections = await prisma.wishlistCollection.findMany({
            where: { userId: user.userId },
            include: {
                items: {
                    include: {
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                priceUnit: true,
                                images: true,
                                rating: true,
                                location: true,
                                available: true,
                                media: true,
                                category: true,
                            }
                        }
                    },
                    orderBy: { addedAt: 'desc' }
                },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Ensure default collection exists
        if (collections.length === 0) {
            const defaultCollection = await prisma.wishlistCollection.create({
                data: {
                    userId: user.userId,
                    name: 'Saved Items',
                    emoji: '❤️',
                    isDefault: true,
                },
                include: {
                    items: { include: { listing: true } },
                    _count: { select: { items: true } }
                }
            });
            collections = [defaultCollection as any];
        }

        return NextResponse.json({ collections });
    } catch (error) {
        console.error('Fetch wishlist error:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}
