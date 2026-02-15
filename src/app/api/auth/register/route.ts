import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function POST(req: Request) {
    try {
        console.log('🟢 [Register API] Route hit');
        console.log('🟢 [Register API] DATABASE_URL Check:', process.env.DATABASE_URL ? `Defined (${process.env.DATABASE_URL.length} chars)` : 'MISSING');

        const body = await req.json();
        console.log('🟢 [Register API] Body received:', JSON.stringify({ ...body, password: '[REDACTED]' }));

        const { email, password, firstName, lastName, phone, address, city, dateOfBirth, governmentIdType, governmentIdNumber, interests } = body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
                address: address || null,
                city: city || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                governmentIdType: governmentIdType || null,
                governmentIdNumber: governmentIdNumber || null,
                interests: interests || [],
            } as any,
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({
            message: 'User registered successfully!',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                verified: user.verified
            },
            token
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
