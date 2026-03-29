import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const chatRoutes = Router();

interface AuthRequest extends Request {
    user?: any;
}

// 1. Get all chat rooms for a user (with unread counts)
chatRoutes.get('/rooms', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const rooms = await prisma.chatRoom.findMany({
            where: {
                members: {
                    some: { userId: userId }
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
            const member = room.members.find(m => m.userId === userId);
            const lastRead = member?.lastReadAt || new Date(0);

            const unreadCount = await prisma.message.count({
                where: {
                    chatRoomId: room.id,
                    createdAt: { gt: lastRead },
                    senderId: { not: userId },
                    isDeleted: false
                }
            });

            return { ...room, unreadCount };
        }));

        res.json(roomsWithUnread);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

// 2. Get messages for a specific room (with pagination)
chatRoutes.get('/rooms/:roomId/messages', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId } = req.params;
        const cursor = req.query.cursor as string | undefined;
        const limit = (req.query.limit as string) || '50';
        const take = Math.min(parseInt(limit) || 50, 100);

        // Verify user is a member
        const member = await prisma.chatMember.findUnique({
            where: {
                userId_chatRoomId: {
                    userId,
                    chatRoomId: roomId
                }
            }
        });

        if (!member) {
            return res.status(403).json({ error: 'Not a member of this chat room' });
        }

        const messages = await prisma.message.findMany({
            where: {
                chatRoomId: roomId,
                ...(cursor ? { createdAt: { lt: new Date(cursor as string) } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: take,
            include: {
                attachments: true,
                reactions: true,
                sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        // Reverse to get chronological order
        messages.reverse();

        // Update lastReadAt
        await prisma.chatMember.update({
            where: { id: member.id },
            data: { lastReadAt: new Date() }
        });

        res.json({
            messages,
            hasMore: messages.length === take,
            nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 3. Send a message
chatRoutes.post('/rooms/:roomId/messages', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId } = req.params;
        const { content, attachments } = req.body;

        if (!content && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ error: 'Message content or attachment is required' });
        }

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } }
        });

        if (!member) return res.status(403).json({ error: 'Not a member of this chat' });

        // Create message
        const message = await prisma.message.create({
            data: {
                content: content?.trim() || null,
                senderId: userId,
                chatRoomId: roomId,
                attachments: attachments && attachments.length > 0 ? {
                    create: attachments.map((a: any) => ({
                        url: a.url,
                        type: a.type || 'IMAGE',
                        name: a.name,
                        size: a.size
                    }))
                } : undefined
            },
            include: {
                attachments: true,
                sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        // Update room's updatedAt for sorting & update sender's lastReadAt
        await Promise.all([
            prisma.chatRoom.update({
                where: { id: roomId },
                data: { updatedAt: new Date() }
            }),
            prisma.chatMember.update({
                where: { id: member.id },
                data: { lastReadAt: new Date() }
            })
        ]);

        // Return with chatRoomId so frontend+sockets can route it
        res.status(201).json({ ...message, chatRoomId: roomId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// 4. Mark room as read
chatRoutes.post('/rooms/:roomId/read', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId } = req.params;

        await prisma.chatMember.update({
            where: {
                userId_chatRoomId: { userId, chatRoomId: roomId }
            },
            data: { lastReadAt: new Date() }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking room as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// 5. Get users to chat with (search users)
chatRoutes.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId || req.user?.id;
        if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

        const { q } = req.query;
        const searchFilter = q && typeof q === 'string' ? {
            OR: [
                { firstName: { contains: q, mode: 'insensitive' as any } },
                { lastName: { contains: q, mode: 'insensitive' as any } },
                { email: { contains: q, mode: 'insensitive' as any } }
            ]
        } : {};

        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                banned: false,
                ...searchFilter
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                lastSeenAt: true
            },
            take: 30,
            orderBy: { firstName: 'asc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 6. Create or Get Direct Message Room
chatRoutes.post('/direct', async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId || req.user?.id;
        const { targetUserId } = req.body;

        if (!currentUserId || !targetUserId) {
            return res.status(400).json({ error: 'Current user and target user required' });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: 'Cannot create a chat with yourself' });
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
            return res.json({ ...existingRooms[0], unreadCount: 0 });
        }

        // Verify target exists
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

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

        res.status(201).json({ ...newRoom, unreadCount: 0 });
    } catch (error) {
        console.error('Error creating direct chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// 7. Delete a message (soft delete)
chatRoutes.delete('/rooms/:roomId/messages/:messageId', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId, messageId } = req.params;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) return res.status(404).json({ error: 'Message not found' });
        if (message.senderId !== userId) return res.status(403).json({ error: 'Can only delete your own messages' });
        if (message.chatRoomId !== roomId) return res.status(400).json({ error: 'Message does not belong to this room' });

        await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: null }
        });

        res.json({ success: true, messageId });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// 7b. Edit a message
chatRoutes.patch('/rooms/:roomId/messages/:messageId', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId, messageId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return res.status(404).json({ error: 'Message not found' });
        if (message.senderId !== userId) return res.status(403).json({ error: 'Can only edit your own messages' });
        if (message.chatRoomId !== roomId) return res.status(400).json({ error: 'Message does not belong to this room' });

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: { content: content.trim(), isEdited: true },
            include: {
                attachments: true,
                reactions: true,
                sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }
            }
        });

        res.json({ ...updated, chatRoomId: roomId });
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ error: 'Failed to edit message' });
    }
});

// 8. Update Chat Member Settings (Mute/Pin)
chatRoutes.patch('/rooms/:roomId/settings', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { roomId } = req.params;
        const { isMuted, isPinned, nickname } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const updated = await prisma.chatMember.update({
            where: {
                userId_chatRoomId: { userId, chatRoomId: roomId }
            },
            data: {
                ...(isMuted !== undefined && { isMuted }),
                ...(isPinned !== undefined && { isPinned }),
                ...(nickname !== undefined && { nickname })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating chat settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// 9. Toggle reaction on a message
chatRoutes.post('/rooms/:roomId/messages/:messageId/reactions', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId, messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this chat' });

        // Verify message exists in this room
        const message = await prisma.message.findFirst({
            where: { id: messageId, chatRoomId: roomId }
        });
        if (!message) return res.status(404).json({ error: 'Message not found' });

        // Check if user already reacted with this emoji (toggle behavior)
        const existing = await prisma.messageReaction.findUnique({
            where: {
                messageId_userId_emoji: { messageId, userId, emoji }
            }
        });

        if (existing) {
            // Remove the reaction (toggle off)
            await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
            // Add the reaction
            await prisma.messageReaction.create({
                data: { messageId, userId, emoji }
            });
        }

        // Return all reactions for this message
        const reactions = await prisma.messageReaction.findMany({
            where: { messageId },
            orderBy: { createdAt: 'asc' }
        });

        res.json({ messageId, reactions });
    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Failed to toggle reaction' });
    }
});

// 10. Search messages in a room
chatRoutes.get('/rooms/:roomId/messages/search', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { roomId } = req.params;
        const q = req.query.q as string;

        if (!q || q.trim().length < 2) return res.json({ results: [] });

        // Verify membership
        const member = await prisma.chatMember.findUnique({
            where: { userId_chatRoomId: { userId, chatRoomId: roomId } }
        });
        if (!member) return res.status(403).json({ error: 'Not a member of this chat' });

        const results = await prisma.message.findMany({
            where: {
                chatRoomId: roomId,
                isDeleted: false,
                content: { contains: q, mode: 'insensitive' }
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                sender: { select: { id: true, firstName: true, avatar: true } }
            }
        });

        res.json({ results });
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
});

export { chatRoutes };
