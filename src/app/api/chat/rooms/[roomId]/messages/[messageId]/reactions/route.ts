import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

// POST - Toggle a reaction on a message
export async function POST(req: Request, { params }: { params: Promise<{ roomId: string, messageId: string }> }) {
    try {
        const user = await authenticate(req);
        const currentUserId = user?.userId;
        if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { roomId, messageId } = await params;
        
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        
        const { emoji } = body;
        if (!emoji) return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId: currentUserId, chatRoomId: roomId } }
        });
        if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

        // Toggle: if exists, remove; if not, add
        const existing = await prisma.messageReaction.findUnique({
            where: { messageId_userId_emoji: { messageId, userId: currentUserId, emoji } }
        });

        if (existing) {
            await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
            await prisma.messageReaction.create({
                data: { messageId, userId: currentUserId, emoji }
            });
        }

        // Return all reactions for the message
        const reactions = await prisma.messageReaction.findMany({
            where: { messageId },
            include: { user: { select: { id: true, firstName: true } } }
        });
        
        return NextResponse.json({ 
            action: existing ? 'removed' : 'added', 
            reactions, 
            messageId, 
            chatRoomId: roomId 
        });
    } catch (error: any) {
        console.error('Error toggling reaction:', error?.message || error);
        return NextResponse.json({ error: 'Failed to toggle reaction', details: error?.message }, { status: 500 });
    }
}
