import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import next from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

console.log("Server script starting...");

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const PORT = process.env.PORT || 5000;

nextApp.prepare().then(() => {
    const app = express();
    const server = createServer(app);
    const io = new SocketIO(server, {
        cors: { origin: process.env.CLIENT_URL || `http://localhost:${PORT}`, methods: ['GET', 'POST'] },
    });

    // Middleware
    app.use(cors({
        origin: '*', // For development, allow everything
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());

    // Request Logger
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });

    // ─── Auth Middleware ───
    const authenticateToken = (req: any, res: any, next: any) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'Access denied' });

        jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });
    };

    // ─── Health check ───
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ─── Auth Routes ───
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                },
            });

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
                message: 'User registered successfully!',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    verified: user.verified
                },
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    });

    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                message: 'Login successful!',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    verified: user.verified
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    });

    app.get('/api/listings', async (req, res) => {
        try {
            const { category, search, userId, popular } = req.query;
            const where: any = {};
            if (category) where.category = category as string;
            if (userId) where.ownerId = userId as string;
            if (search) {
                where.OR = [
                    { title: { contains: search as string, mode: 'insensitive' } },
                    { description: { contains: search as string, mode: 'insensitive' } },
                ];
            }

            let orderBy: any = { createdAt: 'desc' };
            if (popular === 'true') {
                orderBy = [
                    { rating: 'desc' },
                    { reviewCount: 'desc' },
                    { loveCount: 'desc' }
                ];
            }

            const listings = await prisma.listing.findMany({
                where,
                orderBy,
                include: { owner: { select: { firstName: true, verified: true } } }
            });

            res.json({ listings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch listings' });
        }
    });

    app.post('/api/listings', authenticateToken, async (req: any, res) => {
        console.log(`[API] Listing creation attempt by user: ${req.user.userId}`);
        try {
            const { title, description, price, category, tags, images, location, priceUnit } = req.body;

            if (!title || !description || !price || !category || !location) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const listing = await prisma.listing.create({
                data: {
                    title,
                    description,
                    price: parseFloat(price),
                    category,
                    tags: tags || [],
                    images: images || [],
                    location,
                    priceUnit: (priceUnit?.toUpperCase() as any) || 'DAY',
                    ownerId: req.user.userId,
                },
            });

            res.status(201).json({ message: 'Listing created successfully', listing });
        } catch (error) {
            console.error('Create listing error:', error);
            res.status(500).json({ error: 'Failed to create listing' });
        }
    });

    app.get('/api/listings/me', authenticateToken, async (req: any, res) => {
        try {
            const listings = await prisma.listing.findMany({
                where: { ownerId: req.user.userId },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ listings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch your listings' });
        }
    });

    app.get('/api/listings/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const listing = await prisma.listing.findUnique({
                where: { id },
                include: { owner: { select: { firstName: true, verified: true, avatar: true, bio: true } } }
            });
            res.json({ listing });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch listing' });
        }
    });

    app.post('/api/listings/:id/love', async (req, res) => {
        try {
            const { id } = req.params;
            const listing = await prisma.listing.update({
                where: { id },
                data: {
                    loveCount: { increment: 1 }
                }
            });
            res.json({ success: true, loveCount: listing.loveCount });
        } catch (error) {
            res.status(500).json({ error: 'Failed to register love' });
        }
    });

    // ─── Bookings Routes ───
    app.get('/api/bookings/me', authenticateToken, async (req: any, res) => {
        try {
            const bookings = await prisma.booking.findMany({
                where: { renterId: req.user.userId },
                include: { listing: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ bookings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch your bookings' });
        }
    });

    app.post('/api/bookings', authenticateToken, async (req: any, res) => {
        console.log(`[API] Booking attempt:`, req.body, `by user:`, req.user.userId);
        try {
            const { listingId, startDate, endDate, totalPrice } = req.body;

            if (!listingId || !startDate || !endDate || !totalPrice) {
                return res.status(400).json({ error: 'Missing booking details' });
            }

            // Check if listing exists and is available
            const listing = await prisma.listing.findUnique({ where: { id: listingId } });
            if (!listing) return res.status(404).json({ error: 'Listing not found' });
            if (!listing.available) return res.status(400).json({ error: 'Listing is not available' });

            const booking = await prisma.booking.create({
                data: {
                    listingId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    totalPrice: parseFloat(totalPrice),
                    renterId: req.user.userId,
                    status: 'PENDING'
                },
            });

            res.status(201).json({ message: 'Booking created successfully', booking });
        } catch (error) {
            console.error('Create booking error:', error);
            res.status(500).json({ error: 'Failed to create booking' });
        }
    });

    app.patch('/api/bookings/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            // TODO: Update booking status
            res.json({ message: 'Booking status updated', id, status });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update booking' });
        }
    });

    // ─── Search Routes ───
    app.get('/api/search', async (req, res) => {
        try {
            const { q, category, lat, lng, radius } = req.query;
            // TODO: Full-text search with filters, optional AI-powered
            res.json({ results: [], query: q });
        } catch (error) {
            res.status(500).json({ error: 'Search failed' });
        }
    });

    // ─── Reviews Routes ───
    app.post('/api/reviews', authenticateToken, async (req: any, res) => {
        try {
            const { listingId, rating, text } = req.body;
            const userId = req.user.userId;

            if (!listingId || !rating || !text) {
                return res.status(400).json({ error: 'Missing review details' });
            }

            // Create review and update listing stats in a transaction
            const result = await prisma.$transaction(async (tx) => {
                const review = await tx.review.create({
                    data: {
                        listingId,
                        userId,
                        rating: parseInt(rating),
                        text,
                    }
                });

                // Get all reviews for this listing to calculate new average
                const reviews = await tx.review.findMany({
                    where: { listingId }
                });

                const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0);
                const averageRating = totalRating / reviews.length;

                await tx.listing.update({
                    where: { id: listingId },
                    data: {
                        rating: averageRating,
                        reviewCount: reviews.length
                    }
                });

                return review;
            });

            res.status(201).json({ message: 'Review created successfully', review: result });
        } catch (error) {
            console.error('Create review error:', error);
            res.status(500).json({ error: 'Failed to create review' });
        }
    });

    app.get('/api/reviews/:listingId', async (req, res) => {
        try {
            const { listingId } = req.params;
            const reviews = await prisma.review.findMany({
                where: { listingId },
                include: { user: { select: { firstName: true, avatar: true } } },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ reviews });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    });

    // ─── Users Routes ───
    app.get('/api/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // TODO: Get user profile
            res.json({ user: null });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    });

    // ─── WebSocket (Real-time) ───
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        socket.on('send-message', (data: { roomId: string; message: string; senderId: string }) => {
            io.to(data.roomId).emit('new-message', {
                message: data.message,
                senderId: data.senderId,
                timestamp: new Date().toISOString(),
            });
        });

        socket.on('booking-update', (data: { bookingId: string; status: string }) => {
            io.emit('booking-status-change', data);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    // ─── Next.js Handler ───
    app.use((req, res) => {
        return handle(req, res);
    });

    // ─── Start Server ───
    server.listen(PORT, () => {
        console.log(`🚀 RentVerse Unified Server running on port ${PORT}`);
        console.log(`📡 WebSocket server ready`);
    });
}).catch((err) => {
    console.error('Next.js server failed to start:', err);
    process.exit(1);
});

