import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthUser {
    userId: string;
    email: string;
}

export async function authenticate(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

        // Fetch user to check status (active/banned)
        const dbUser = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, banned: true }
        });

        if (!dbUser || (dbUser as any).banned) {
            return null;
        }

        return decoded;
    } catch (error) {
        return null;
    }
}
