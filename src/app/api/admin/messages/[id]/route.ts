import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'dashboard', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        const messages = await prisma.conversationMessage.findMany({
            where: { conversationId: id },
            include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
        });
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                listing: { select: { id: true, title: true } },
            },
        });
        return NextResponse.json({ conversation, messages });
    } catch (error) {
        console.error('Failed to fetch conversation details:', error);
        return NextResponse.json({ error: 'Failed to fetch conversation messages' }, { status: 500 });
    }
}
