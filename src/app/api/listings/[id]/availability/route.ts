import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET /api/listings/[id]/availability - Get bookings and blocked dates for calendar
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const [bookings, blockedDates] = await Promise.all([
            prisma.booking.findMany({
                where: {
                    listingId: id,
                    status: { in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
                },
                select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    renter: { select: { firstName: true, lastName: true } },
                },
                orderBy: { startDate: 'asc' },
            }),
            prisma.calendarBlock.findMany({
                where: { listingId: id },
                select: { id: true, startDate: true, endDate: true, reason: true },
                orderBy: { startDate: 'asc' },
            }),
        ]);

        return NextResponse.json({ bookings, blockedDates });
    } catch (error) {
        console.error('Availability fetch error:', error);
        return NextResponse.json({ bookings: [], blockedDates: [] });
    }
}

// POST /api/listings/[id]/availability - Block dates (owner only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { startDate, endDate, reason } = await req.json();

        // Verify ownership
        const listing = await prisma.listing.findUnique({
            where: { id },
            select: { ownerId: true }
        });

        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        if (listing.ownerId !== user.userId) {
            return NextResponse.json({ error: 'Only the owner can block dates' }, { status: 403 });
        }

        // Check for conflicting bookings
        const conflicting = await prisma.booking.findFirst({
            where: {
                listingId: id,
                status: { in: ['CONFIRMED', 'ACTIVE'] },
                startDate: { lte: new Date(endDate) },
                endDate: { gte: new Date(startDate) },
            }
        });

        if (conflicting) {
            return NextResponse.json({ error: 'Cannot block dates with existing confirmed bookings' }, { status: 400 });
        }

        const block = await prisma.calendarBlock.create({
            data: {
                listingId: id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason || null,
            }
        });

        return NextResponse.json({ block }, { status: 201 });
    } catch (error) {
        console.error('Block dates error:', error);
        return NextResponse.json({ error: 'Failed to block dates' }, { status: 500 });
    }
}

// DELETE /api/listings/[id]/availability - Remove date block
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { blockId } = await req.json();

        const block = await prisma.calendarBlock.findUnique({ where: { id: blockId } });
        if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 });

        const listing = await prisma.listing.findUnique({
            where: { id },
            select: { ownerId: true }
        });
        if (listing?.ownerId !== user.userId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        await prisma.calendarBlock.delete({ where: { id: blockId } });
        return NextResponse.json({ message: 'Block removed' });
    } catch (error) {
        console.error('Remove block error:', error);
        return NextResponse.json({ error: 'Failed to remove block' }, { status: 500 });
    }
}
