import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const { reason } = await req.json();

        const user = await (prisma.user as any).update({
            where: { id },
            data: { banned: true, banReason: reason || 'Violation of terms' }
        });

        // Add to audit log
        await (prisma as any).auditLog.create({
            data: {
                adminId: admin.id,
                action: 'BAN_USER',
                module: 'USERS',
                targetType: 'USER',
                targetId: id,
                details: `Banned user for: ${reason || 'Violation of terms'}`,
            }
        });

        return NextResponse.json({ message: 'User banned', user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        const user = await (prisma.user as any).update({
            where: { id },
            data: { banned: false, banReason: null }
        });

        // Add to audit log
        await (prisma as any).auditLog.create({
            data: {
                adminId: admin.id,
                action: 'UNBAN_USER',
                module: 'USERS',
                targetType: 'USER',
                targetId: id,
                details: `Unbanned user`,
            }
        });

        return NextResponse.json({ message: 'User unbanned', user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
