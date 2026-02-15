import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;
        const userListings = await prisma.listing.findMany({
            where: { ownerId: userId },
            select: { id: true }
        });
        const listingIds = userListings.map(l => l.id);

        const bookings = await prisma.booking.findMany({
            where: { listingId: { in: listingIds } },
            include: {
                listing: { select: { id: true, title: true, images: true, price: true, priceUnit: true } },
                renter: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ bookings });
    } catch (error) {
        console.error('Owner bookings error:', error);
        return NextResponse.json({ error: 'Failed to fetch owner bookings' }, { status: 500 });
    }
}
