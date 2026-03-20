import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId } = await params;

        const member = await prisma.chatMember.findUnique({
            where: {
                userId_chatRoomId: {
                    userId: currentUserId,
                    chatRoomId: roomId
                }
            }
        });

        if (!member) {
            return NextResponse.json({ error: 'User is not a member of this chat room' }, { status: 403 });
        }

        await prisma.chatMember.update({
            where: { id: member.id },
            data: { lastReadAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking room as read:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
