import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;

        const allConversations = await (prisma as any).conversation.findMany({
            where: {
                participants: { some: { userId } }
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
                },
                listing: { select: { id: true, title: true, images: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { sender: { select: { id: true, firstName: true } } }
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const uniqueMap = new Map();
        for (const conv of allConversations) {
            const otherParticipant = conv.participants.find((p: any) => p.userId !== userId);
            if (otherParticipant) {
                const otherId = otherParticipant.userId;
                if (!uniqueMap.has(otherId)) {
                    uniqueMap.set(otherId, conv);
                }
            }
        }

        const uniqueConversations = Array.from(uniqueMap.values());

        const conversationsWithMetadata = await Promise.all(uniqueConversations.map(async (conv: any) => {
            const unreadCount = await (prisma as any).conversationMessage.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: userId },
                    read: false
                }
            });
            return { ...conv, unreadCount };
        }));

        return NextResponse.json({ conversations: conversationsWithMetadata });
    } catch (error) {
        console.error('Conversations fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const userId = user.userId;
        const { receiverId, listingId, message } = await req.json();

        if (!receiverId) return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
        if (receiverId === userId) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

        const existing = await (prisma as any).conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: receiverId } } }
                ]
            },
            orderBy: { updatedAt: 'desc' }
        });

        if (existing) {
            const updateData: any = { updatedAt: new Date() };
            if (listingId && existing.listingId !== listingId) {
                updateData.listingId = listingId;
            }

            await (prisma as any).conversation.update({
                where: { id: existing.id },
                data: updateData
            });

            if (message) {
                const msg = await (prisma as any).conversationMessage.create({
                    data: {
                        conversationId: existing.id,
                        senderId: userId,
                        text: message
                    },
                    include: { sender: { select: { id: true, firstName: true } } }
                });

                const dbNotif = await prisma.notification.create({
                    data: {
                        userId: receiverId,
                        type: 'NEW_MESSAGE',
                        title: `New Message from ${msg.sender.firstName}`,
                        message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                    }
                });

                // Supabase Realtime Broadcast replacement for io.emit
                await supabase.channel(`user:${receiverId}`).send({
                    type: 'broadcast',
                    event: 'message',
                    payload: { conversationId: existing.id, message: msg }
                });
                await supabase.channel(`user:${receiverId}`).send({
                    type: 'broadcast',
                    event: 'notification',
                    payload: dbNotif
                });
            }

            const returnConv = await (prisma as any).conversation.findUnique({
                where: { id: existing.id },
                include: {
                    participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
                    listing: { select: { id: true, title: true, images: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { sender: { select: { id: true, firstName: true } } }
                    },
                }
            });
            return NextResponse.json({ conversation: returnConv });
        }

        const conversation = await (prisma as any).conversation.create({
            data: {
                listingId: listingId || null,
                participants: {
                    create: [
                        { userId },
                        { userId: receiverId },
                    ]
                },
                ...(message ? {
                    messages: {
                        create: { senderId: userId, text: message }
                    }
                } : {})
            },
            include: {
                participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
                listing: { select: { id: true, title: true, images: true } },
                messages: { include: { sender: { select: { id: true, firstName: true } } } },
            }
        });

        if (message) {
            const dbNotif = await prisma.notification.create({
                data: {
                    userId: receiverId,
                    type: 'NEW_MESSAGE',
                    title: `New Message from ${conversation.participants.find((p: any) => p.userId === userId)?.user.firstName || 'User'}`,
                    message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                }
            });

            await supabase.channel(`user:${receiverId}`).send({
                type: 'broadcast',
                event: 'message',
                payload: { conversationId: conversation.id, message: conversation.messages[0] }
            });
            await supabase.channel(`user:${receiverId}`).send({
                type: 'broadcast',
                event: 'notification',
                payload: dbNotif
            });
        }

        return NextResponse.json({ conversation }, { status: 201 });
    } catch (error) {
        console.error('Create conversation error:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
