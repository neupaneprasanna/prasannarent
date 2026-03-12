import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                owner: { select: { firstName: true, verified: true, avatar: true, bio: true } },
                media: { orderBy: { order: 'asc' } },
                pricing: true,
                attributes: true
            }
        });

        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

        return NextResponse.json({ listing });
    } catch (error) {
        console.error('Fetch listing error:', error);
        return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const listing = await prisma.listing.findUnique({ where: { id } });
        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        if (listing.ownerId !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const updateData: Record<string, any> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = parseFloat(body.price);
        if (body.location !== undefined) updateData.location = body.location;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.available !== undefined) updateData.available = body.available;
        if (body.priceUnit !== undefined) updateData.priceUnit = body.priceUnit;

        const updated = await prisma.listing.update({
            where: { id },
            data: updateData,
            include: {
                media: { orderBy: { order: 'asc' } },
                pricing: true,
            }
        });

        return NextResponse.json({ listing: updated });
    } catch (error) {
        console.error('Update listing error:', error);
        return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const listing = await prisma.listing.findUnique({ where: { id } });
        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        if (listing.ownerId !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Delete related records first
        await prisma.$transaction([
            prisma.listingMedia.deleteMany({ where: { listingId: id } }),
            prisma.listingPricing.deleteMany({ where: { listingId: id } }),
            prisma.listingAttribute.deleteMany({ where: { listingId: id } }),
            prisma.calendarBlock.deleteMany({ where: { listingId: id } }),
            prisma.wishlistItem.deleteMany({ where: { listingId: id } }),
            prisma.recentlyViewed.deleteMany({ where: { listingId: id } }),
            prisma.datePriceOverride.deleteMany({ where: { listingId: id } }),
            prisma.listing.delete({ where: { id } }),
        ]);

        return NextResponse.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Delete listing error:', error);
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }
}

