import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin, requirePermission } from '@/lib/admin-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, action: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const hasPerm = await requirePermission(admin.role, 'moderation', 'approve');
    if (!hasPerm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id, action } = await params;
        const { note } = await req.json();

        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

        const item = await prisma.moderationItem.update({
            where: { id },
            data: {
                status,
                reviewerId: admin.userId,
                reviewNote: note,
                reviewedAt: new Date(),
            },
        });

        return NextResponse.json({ item });
    } catch (error) {
        console.error('Failed to process moderation item:', error);
        return NextResponse.json({ error: 'Failed to process moderation item' }, { status: 500 });
    }
}
