import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// PATCH - Edit a message
export async function PATCH(req: Request, { params }: { params: Promise<{ roomId: string, messageId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId, messageId } = await params;
        const { content } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        if (message.chatRoomId !== roomId) return NextResponse.json({ error: 'Message not in this room' }, { status: 400 });
        if (message.senderId !== currentUserId) return NextResponse.json({ error: 'Only the sender can edit' }, { status: 403 });
        if (message.isDeleted) return NextResponse.json({ error: 'Cannot edit a deleted message' }, { status: 400 });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content: content.trim(), isEdited: true },
            include: {
                attachments: true,
                sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                replyTo: {
                    select: {
                        id: true, content: true,
                        sender: { select: { id: true, firstName: true } }
                    }
                },
                reactions: { include: { user: { select: { id: true, firstName: true } } } }
            }
        });

        return NextResponse.json({ ...updated, chatRoomId: roomId });
    } catch (error) {
        console.error('Error editing message:', error);
        return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
    }
}

// DELETE - Soft delete a message
export async function DELETE(req: Request, { params }: { params: Promise<{ roomId: string, messageId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId, messageId } = await params;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        if (message.chatRoomId !== roomId) return NextResponse.json({ error: 'Message not in this room' }, { status: 400 });
        if (message.senderId !== currentUserId) return NextResponse.json({ error: 'Only the sender can delete' }, { status: 403 });

        await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: null }
        });

        return NextResponse.json({ success: true, messageId });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
