import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// GET - Search messages within a room
export async function GET(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId } = await params;
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q || q.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId: currentUserId, chatRoomId: roomId } }
        });
        if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

        const messages = await prisma.message.findMany({
            where: {
                chatRoomId: roomId,
                isDeleted: false,
                content: { contains: q.trim(), mode: 'insensitive' }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        return NextResponse.json({ results: messages });
    } catch (error) {
        console.error('Error searching messages:', error);
        return NextResponse.json({ error: 'Failed to search messages' }, { status: 500 });
    }
}
