import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const user = await authenticate(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const currentUserId = user.userId;
        const { targetUserId } = await req.json();

        if (!currentUserId || !targetUserId) {
            return NextResponse.json({ error: 'Current user and target user required' }, { status: 400 });
        }

        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Cannot create a chat with yourself' }, { status: 400 });
        }

        // Find existing direct chat between these two
        const existingRooms = await prisma.chatRoom.findMany({
            where: {
                isGroup: false,
                AND: [
                    { members: { some: { userId: currentUserId } } },
                    { members: { some: { userId: targetUserId } } }
                ]
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
                        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
                    }
                }
            }
        });

        if (existingRooms.length > 0) {
            return NextResponse.json({ ...existingRooms[0], unreadCount: 0 });
        }

        // Verify target exists
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

        // Create new room
        const newRoom = await prisma.chatRoom.create({
            data: {
                isGroup: false,
                members: {
                    create: [
                        { userId: currentUserId },
                        { userId: targetUserId }
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastSeenAt: true } }
                    }
                },
                messages: true
            }
        });

        return NextResponse.json({ ...newRoom, unreadCount: 0 }, { status: 201 });
    } catch (error) {
        console.error('Error creating direct chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
