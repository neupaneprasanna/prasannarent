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
                        sender: { select: { id: true, firstName: true, avatar: true } },
                        attachments: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Batch unread count query instead of N+1
        const memberRecords = await prisma.chatMember.findMany({
            where: { userId: currentUserId, chatRoomId: { in: rooms.map(r => r.id) } },
            select: { chatRoomId: true, lastReadAt: true, isMuted: true, isPinned: true }
        });
        const memberMap = new Map(memberRecords.map(m => [m.chatRoomId, m]));

        // Single aggregated unread query
        const unreadCounts = await prisma.$queryRaw<{ chatRoomId: string; count: bigint }[]>`
            SELECT "chatRoomId", COUNT(*)::bigint as count
            FROM "Message"
            WHERE "chatRoomId" IN (${rooms.map(r => r.id).join("','")})
              AND "isDeleted" = false
              AND "senderId" != ${currentUserId}
              AND "createdAt" > COALESCE(
                (SELECT "lastReadAt" FROM "ChatMember" WHERE "userId" = ${currentUserId} AND "ChatMember"."chatRoomId" = "Message"."chatRoomId"),
                '1970-01-01'::timestamp
              )
            GROUP BY "chatRoomId"
        `.catch(() => []);
        
        const unreadMap = new Map(unreadCounts.map(u => [u.chatRoomId, Number(u.count)]));

        const roomsWithMeta = rooms.map(room => {
            const member = memberMap.get(room.id);
            return {
                ...room,
                unreadCount: unreadMap.get(room.id) || 0,
                isMuted: member?.isMuted || false,
                isPinned: member?.isPinned || false,
            };
        });

        // Sort: pinned first, then by updatedAt
        roomsWithMeta.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return NextResponse.json(roomsWithMeta);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
    }
}
