import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit');
        const limit = parseInt(limitParam || '20') || 20;

        const logs = await prisma.auditLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: { select: { firstName: true, lastName: true, avatar: true } }
            }
        });

        const activities = logs.map(log => ({
            id: log.id,
            action: log.action,
            module: log.module,
            adminId: log.adminId,
            adminName: `${log.admin.firstName} ${log.admin.lastName}`,
            adminAvatar: log.admin.avatar,
            targetType: log.targetType,
            targetId: log.targetId,
            details: log.details,
            timestamp: log.createdAt.toISOString(),
        }));

        return NextResponse.json({ activities });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
