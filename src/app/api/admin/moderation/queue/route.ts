import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'moderation', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '20') || 20;
        const status = searchParams.get('status') || 'PENDING';

        const where: any = { status };
        const [items, total] = await Promise.all([
            prisma.moderationItem.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
                include: {
                    reviewer: { select: { firstName: true, lastName: true } }
                }
            }),
            prisma.moderationItem.count({ where }),
        ]);

        return NextResponse.json({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Failed to fetch moderation queue:', error);
        return NextResponse.json({ error: 'Failed to fetch moderation queue' }, { status: 500 });
    }
}
