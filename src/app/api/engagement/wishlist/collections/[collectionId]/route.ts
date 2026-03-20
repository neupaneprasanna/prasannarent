import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ collectionId: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { collectionId } = await params;

        const collection = await prisma.wishlistCollection.findUnique({
            where: { id: collectionId }
        });

        if (!collection || collection.userId !== user.userId) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        if (collection.isDefault) {
            return NextResponse.json({ error: 'Cannot delete default collection' }, { status: 400 });
        }

        await prisma.wishlistCollection.delete({
            where: { id: collectionId }
        });

        return NextResponse.json({ message: 'Collection deleted' });
    } catch (error) {
        console.error('Delete collection error:', error);
        return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ collectionId: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { collectionId } = await params;
        const body = await req.json();

        // Check ownership
        const existing = await prisma.wishlistCollection.findUnique({ where: { id: collectionId }});
        if (!existing || existing.userId !== user.userId) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const updated = await prisma.wishlistCollection.update({
            where: { id: collectionId },
            data: {
                name: body.name !== undefined ? body.name : undefined,
                emoji: body.emoji !== undefined ? body.emoji : undefined,
                isPublic: body.isPublic !== undefined ? body.isPublic : undefined,
            }
        });

        return NextResponse.json({ collection: updated });
    } catch (error) {
        console.error('Update collection error:', error);
        return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
    }
}
