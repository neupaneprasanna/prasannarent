import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { email, password, firstName, lastName, phone, address, city, dateOfBirth, governmentIdType, governmentIdNumber, interests, avatar } = body;
        console.log('🟢 [Register API] Destructured avatar:', avatar);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('-------------------------------------------');
        console.log('🟢 [REGISTER API DEBUG]');
        console.log('Body Avatar Type:', typeof body.avatar);
        console.log('Body Avatar Value:', body.avatar);
        console.log('-------------------------------------------');

        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: hashedPassword,
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone || null,
                avatar: body.avatar || null,
                address: body.address || null,
                city: body.city || null,
                dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
                governmentIdType: body.governmentIdType || null,
                governmentIdNumber: body.governmentIdNumber || null,
                interests: body.interests || [],
            } as any,
        });

        console.log('🟢 [REGISTER API] Created User Avatar in JSON:', user.avatar);
        console.log('-------------------------------------------');

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({
            message: 'User registered successfully!',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                verified: user.verified,
                avatar: user.avatar
            },
            token
        }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
