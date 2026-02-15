import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'audit', 'read');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1') || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '50') || 50;
        const module = searchParams.get('module');
        const action = searchParams.get('action');
        const adminId = searchParams.get('adminId');

        const where: any = {};
        if (module) where.module = module;
        if (action) where.action = { contains: action, mode: 'insensitive' };
        if (adminId) where.adminId = adminId;

        if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN') {
            where.adminId = admin.userId;
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: { select: { firstName: true, lastName: true, email: true, avatar: true } }
                }
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            items: logs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
