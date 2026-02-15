import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const bookings = await prisma.booking.findMany({
            where: { renterId: user.userId },
            include: {
                listing: { select: { id: true, title: true, images: true, price: true, priceUnit: true } },
                renter: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ bookings });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { listingId, startDate, endDate, totalPrice } = body;

        if (!listingId || !startDate || !endDate || !totalPrice) {
            return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
        }

        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        if (!listing.available) return NextResponse.json({ error: 'Listing not available' }, { status: 400 });

        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (!dbUser) return NextResponse.json({ error: 'User session invalid' }, { status: 401 });

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.create({
                data: {
                    listingId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    totalPrice: parseFloat(totalPrice.toString()),
                    renterId: user.userId,
                    status: 'PENDING'
                },
            });

            const notification = await tx.notification.create({
                data: {
                    userId: listing.ownerId,
                    type: 'BOOKING_REQUEST',
                    title: 'New Booking Request',
                    message: `${dbUser.firstName} wants to rent "${listing.title}" from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
                }
            });

            return { booking, notification };
        });

        // Supabase Realtime Notification to Owner
        await supabase.channel(`user:${listing.ownerId}`).send({
            type: 'broadcast',
            event: 'notification',
            payload: result.notification
        });

        return NextResponse.json({ message: 'Booking created successfully', booking: result.booking }, { status: 201 });
    } catch (error) {
        console.error('Create booking error:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
