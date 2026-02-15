import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;
        const { id } = await params;

        const participant = await (prisma as any).conversationParticipant.findUnique({
            where: { userId_conversationId: { userId, conversationId: id } }
        });
        if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        const messages = await (prisma as any).conversationMessage.findMany({
            where: { conversationId: id },
            include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
        });

        await (prisma as any).conversationMessage.updateMany({
            where: { conversationId: id, senderId: { not: userId }, read: false },
            data: { read: true },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Messages fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;
        const { id } = await params;
        const { text } = await req.json();

        if (!text) return NextResponse.json({ error: 'Message text is required' }, { status: 400 });

        const participant = await (prisma as any).conversationParticipant.findUnique({
            where: { userId_conversationId: { userId, conversationId: id } }
        });
        if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

        const message = await (prisma as any).conversationMessage.create({
            data: { conversationId: id, senderId: userId, text },
            include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
        });

        await (prisma as any).conversation.update({ where: { id }, data: { updatedAt: new Date() } });

        const otherParticipants = await (prisma as any).conversationParticipant.findMany({
            where: { conversationId: id, userId: { not: userId } }
        });

        for (const p of otherParticipants) {
            const dbNotif = await prisma.notification.create({
                data: {
                    userId: p.userId,
                    type: 'NEW_MESSAGE',
                    title: `New Message from ${message.sender.firstName}`,
                    message: message.text.length > 50 ? message.text.substring(0, 47) + '...' : message.text,
                }
            });

            // Supabase Realtime Broadcast replacement for io.emit
            await supabase.channel(`user:${p.userId}`).send({
                type: 'broadcast',
                event: 'message',
                payload: { conversationId: id, message }
            });
            await supabase.channel(`user:${p.userId}`).send({
                type: 'broadcast',
                event: 'notification',
                payload: dbNotif
            });
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
