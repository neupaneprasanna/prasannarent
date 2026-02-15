import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'dashboard', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '20') || 20;
        const search = searchParams.get('search') || '';

        const where: any = {};
        if (search) {
            where.OR = [
                { messages: { some: { text: { contains: search, mode: 'insensitive' } } } },
                { participants: { some: { user: { firstName: { contains: search, mode: 'insensitive' } } } } },
                { participants: { some: { user: { lastName: { contains: search, mode: 'insensitive' } } } } },
            ];
        }

        const [conversations, total] = await Promise.all([
            prisma.conversation.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { updatedAt: 'desc' },
                include: {
                    participants: {
                        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } }
                    },
                    listing: { select: { id: true, title: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { sender: { select: { id: true, firstName: true } } }
                    },
                    _count: { select: { messages: true } },
                }
            }),
            prisma.conversation.count({ where }),
        ]);

        return NextResponse.json({
            items: conversations,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Failed to fetch admin messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
