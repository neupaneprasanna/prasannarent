import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;
        const { id } = await params;
        const { action, ownerNote } = await req.json(); // action: 'approve' | 'reject'

        const booking = await (prisma.booking as any).findUnique({
            where: { id },
            include: { listing: { select: { ownerId: true, title: true } }, renter: { select: { id: true, firstName: true } } }
        });

        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        if (booking.listing.ownerId !== userId) return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
        if (booking.status !== 'PENDING') return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 });

        const newStatus = action === 'approve' ? 'CONFIRMED' : 'CANCELLED';

        const updated = await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: { status: newStatus, ownerNote: ownerNote || null } as any,
            });

            const notification = await tx.notification.create({
                data: {
                    userId: booking.renterId,
                    type: action === 'approve' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
                    title: action === 'approve' ? 'Booking Approved!' : 'Booking Declined',
                    message: action === 'approve'
                        ? `Your booking for "${booking.listing.title}" has been approved! ${ownerNote ? 'Note: ' + ownerNote : ''}`
                        : `Your booking for "${booking.listing.title}" was declined. ${ownerNote ? 'Reason: ' + ownerNote : ''}`,
                }
            });

            return { updatedBooking, notification };
        });

        // Supabase Realtime Notification to Renter
        await supabase.channel(`user:${booking.renterId}`).send({
            type: 'broadcast',
            event: 'notification',
            payload: updated.notification
        });

        return NextResponse.json({ message: `Booking ${action}d`, booking: updated.updatedBooking });
    } catch (error) {
        console.error('Owner action error:', error);
        return NextResponse.json({ error: 'Failed to process booking action' }, { status: 500 });
    }
}
