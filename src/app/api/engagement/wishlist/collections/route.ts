import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';

export async function POST(req: Request) {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, emoji, isPublic } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const collection = await prisma.wishlistCollection.create({
            data: {
                userId: user.userId,
                name: name.trim(),
                emoji: emoji || '📁',
                isPublic: isPublic || false,
            }
        });

        return NextResponse.json({ collection });
    } catch (error) {
        console.error('Create collection error:', error);
        return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
    }
}
