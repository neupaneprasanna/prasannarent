import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// PATCH - Update chat member settings (pin/mute/nickname)
export async function PATCH(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId } = await params;
        const { isMuted, isPinned, nickname } = await req.json();

        const updated = await prisma.chatMember.update({
            where: {
                userId_chatRoomId: { userId: currentUserId, chatRoomId: roomId }
            },
            data: {
                ...(isMuted !== undefined && { isMuted }),
                ...(isPinned !== undefined && { isPinned }),
                ...(nickname !== undefined && { nickname })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating chat settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
