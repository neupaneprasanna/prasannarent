import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const currentUserId = user.userId;

        const rooms = await prisma.chatRoom.findMany({
            where: {
                members: {
                    some: { userId: currentUserId }
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastSeenAt: true } }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: { select: { id: true, firstName: true, avatar: true } }
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Calculate unread count per room
        const roomsWithUnread = await Promise.all(rooms.map(async (room) => {
            const member = room.members.find(m => m.userId === currentUserId);
            const lastRead = member?.lastReadAt || new Date(0);

            const unreadCount = await prisma.message.count({
                where: {
                    chatRoomId: room.id,
                    createdAt: { gt: lastRead },
                    senderId: { not: currentUserId },
                    isDeleted: false
                }
            });

            return { ...room, unreadCount };
        }));

        return NextResponse.json(roomsWithUnread);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
    }
}
