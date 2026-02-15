import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'content', 'write');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        const { value, active, order } = await req.json();

        const block = await prisma.contentBlock.update({
            where: { id },
            data: { value, active, order },
        });

        return NextResponse.json({ block });
    } catch (error) {
        console.error('Failed to update content block:', error);
        return NextResponse.json({ error: 'Failed to update content block' }, { status: 500 });
    }
}
