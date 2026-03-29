import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/bookings/[id] - Get single booking details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                listing: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        price: true,
                        priceUnit: true,
                        location: true,
                        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                    }
                },
                renter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                },
            },
        });

        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

        // Ensure user is either renter or listing owner
        if (booking.renterId !== user.userId && booking.listing.owner.id !== user.userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ booking });
    } catch (error) {
        console.error('Fetch booking error:', error);
        return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }
}
