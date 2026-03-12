import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const chatRoutes = Router();

// Middleware to cast req object to ensure type safety
interface AuthRequest extends Request {
    user?: any;
}

// 1. Get all chat rooms for a user
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
                        attachments: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.json(rooms);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

// 2. Get messages for a specific room
chatRoutes.get('/rooms/:roomId/messages', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        
        const { roomId } = req.params;

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
            where: { chatRoomId: roomId },
            orderBy: { createdAt: 'asc' },
            include: {
                attachments: true,
                sender: { select: { id: true, firstName: true, avatar: true } }
            }
        });

        // Update lastReadAt
        await prisma.chatMember.update({
            where: { id: member.id },
            data: { lastReadAt: new Date() }
        });

        res.json(messages);
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
                content,
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
                sender: { select: { id: true, firstName: true, avatar: true } }
            }
        });

        // Update room's updatedAt for sorting
        await prisma.chatRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// 3.5 Get users to chat with (for starting new chats)
chatRoutes.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const currentUserId = req.user?.userId || req.user?.id;
        if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                lastSeenAt: true
            },
            take: 20
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 4. Create or Get Direct Message Room
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
                members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastSeenAt: true } } } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        if (existingRooms.length > 0) {
            return res.json(existingRooms[0]); // Return existing
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
                members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, lastSeenAt: true } } } },
                messages: true
            }
        });

        res.status(201).json(newRoom);
    } catch (error) {
        console.error('Error creating direct chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// 5. Update Chat Member Settings (Mute/Pin)
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

export { chatRoutes };
