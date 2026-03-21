import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

const messageInclude = {
    attachments: true,
    sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    replyTo: {
        select: {
            id: true, content: true, isDeleted: true,
            sender: { select: { id: true, firstName: true } },
            attachments: { select: { type: true }, take: 1 }
        }
    },
    reactions: {
        include: { user: { select: { id: true, firstName: true } } }
    }
};

export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');
        const limitStr = searchParams.get('limit') || '50';
        const take = Math.min(parseInt(limitStr) || 50, 100);
        
        const { roomId } = await params;

        // Verify user is a member
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId: currentUserId, chatRoomId: roomId } }
        });

        if (!member) return NextResponse.json({ error: 'Not a member of this chat room' }, { status: 403 });

        const messages = await prisma.message.findMany({
            where: {
                chatRoomId: roomId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: take,
            include: messageInclude
        });

        // Reverse to get chronological order
        messages.reverse();

        // Update lastReadAt
        await prisma.chatMember.update({
            where: { id: member.id },
            data: { lastReadAt: new Date() }
        });

        return NextResponse.json({
            messages,
            hasMore: messages.length === take,
            nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId } = await params;
        const { content, attachments, replyToId, isForwarded, forwardedFromId } = await req.json();

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
        }

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId: currentUserId, chatRoomId: roomId } }
        });

        if (!member) return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 });

        // Build message data
        const messageData: any = {
            content: content?.trim() || null,
            senderId: currentUserId,
            chatRoomId: roomId,
        };

        if (replyToId) messageData.replyToId = replyToId;
        if (isForwarded) {
            messageData.isForwarded = true;
            messageData.forwardedFromId = forwardedFromId || null;
        }
        if (attachments && attachments.length > 0) {
            messageData.attachments = {
                create: attachments.map((a: any) => ({
                    url: a.url,
                    type: a.type || 'IMAGE',
                    name: a.name,
                    size: a.size
                }))
            };
        }

        const message = await prisma.message.create({
            data: messageData,
            include: messageInclude
        });

        // Update room's updatedAt + sender's lastReadAt
        await Promise.all([
            prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } }),
            prisma.chatMember.update({ where: { id: member.id }, data: { lastReadAt: new Date() } })
        ]);

        return NextResponse.json({ ...message, chatRoomId: roomId }, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
