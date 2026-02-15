import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function GET(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, avatar: true, bio: true, verified: true,
                address: true, city: true, dateOfBirth: true,
                governmentIdType: true, interests: true,
                createdAt: true,
            } as any,
        });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ user: dbUser });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { firstName, lastName, phone, bio, avatar, address, city } = await req.json();
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, avatar: true, bio: true, verified: true,
                address: true, city: true,
                createdAt: true,
            } as any,
        });
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
