import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string, messageId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId, messageId } = await params;

        // Verify message belongs to sender
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        if (message.chatRoomId !== roomId) return NextResponse.json({ error: 'Message not in this room' }, { status: 400 });
        if (message.senderId !== currentUserId) return NextResponse.json({ error: 'Only the sender can delete this message' }, { status: 403 });

        await prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                content: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
