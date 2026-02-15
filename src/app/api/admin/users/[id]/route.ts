import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/lib/admin-auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const user = await (prisma as any).user.findUnique({
            where: { id },
            include: {
                listings: { take: 10, orderBy: { createdAt: 'desc' } },
                bookings: { take: 10, orderBy: { createdAt: 'desc' }, include: { listing: { select: { title: true } } } },
                reviews: { take: 10, orderBy: { createdAt: 'desc' } },
                _count: { select: { listings: true, bookings: true, reviews: true } }
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { password: _, ...safeUser } = user;
        return NextResponse.json({ user: safeUser });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await authenticateAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();
        const { role, verified, firstName, lastName, phone, bio } = body;
        const updateData: any = {};

        if (role !== undefined) updateData.role = role;
        if (verified !== undefined) updateData.verified = verified;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (bio !== undefined) updateData.bio = bio;

        const updatedUser = await (prisma.user as any).update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
