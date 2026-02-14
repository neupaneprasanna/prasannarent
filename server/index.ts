import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import next from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createAdminRouter } from './admin/routes';
import { setupAdminWebSocket } from './admin/websocket';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Server script starting...");

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.resolve(__dirname, '..') });
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
    const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'Access denied' });

        jwt.verify(token, JWT_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            const decoded = user as { userId: string; email: string };
            (req as AuthRequest).user = decoded;

            // Periodically update lastSeenAt (only if more than 5 minutes ago)
            try {
                const dbUser = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { lastSeenAt: true }
                });

                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

                if (!dbUser?.lastSeenAt || dbUser.lastSeenAt < fiveMinutesAgo) {
                    await prisma.user.update({
                        where: { id: decoded.userId },
                        data: { lastSeenAt: now }
                    });
                }
            } catch (error) {
                console.error('Failed to update lastSeenAt:', error);
            }

            next();
        });
    };

    // ─── Admin Routes ───
    app.use('/api/admin', createAdminRouter());

    // ─── Admin WebSocket ───
    const adminWS = setupAdminWebSocket(io);

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
            const { category, search, minPrice, maxPrice, sort, minRating, availableOnly } = req.query;
            const where: import('@prisma/client').Prisma.ListingWhereInput = {};

            if (category && category !== 'all' && category !== 'All') {
                where.category = { equals: category as string, mode: 'insensitive' };
            }

            if (search) {
                const searchStr = search as string;
                where.OR = [
                    { title: { contains: searchStr, mode: 'insensitive' } },
                    { description: { contains: searchStr, mode: 'insensitive' } },
                    { location: { contains: searchStr, mode: 'insensitive' } },
                    { tags: { hasSome: [searchStr] } }
                ];
            }

            if (minPrice || maxPrice) {
                where.price = {
                    gte: minPrice ? parseFloat(minPrice as string) : undefined,
                    lte: maxPrice ? parseFloat(maxPrice as string) : undefined,
                };
            }

            if (minRating) {
                where.rating = {
                    gte: parseFloat(minRating as string)
                };
            }

            if (availableOnly === 'true') {
                where.available = true;
            }

            let orderBy: import('@prisma/client').Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
            if (sort === 'price_asc') {
                orderBy = { price: 'asc' };
            } else if (sort === 'price_desc') {
                orderBy = { price: 'desc' };
            } else if (sort === 'rating_desc') {
                orderBy = { rating: 'desc' };
            }

            const listings = await prisma.listing.findMany({
                where,
                orderBy,
                include: { owner: { select: { firstName: true, verified: true } } }
            });

            res.json({ listings });
        } catch (error) {
            console.error('Listings fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch' });
        }
    });

    // ─── Search Routes ───
    app.get('/api/search', async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.json({ results: [], intent: null });

            const query = (q as string).toLowerCase();

            // Simple heuristic-based "AI" intent detection
            let detectedCategory = null;
            if (query.includes('car') || query.includes('vehicle') || query.includes('drive') || query.includes('tesla')) detectedCategory = 'vehicles';
            if (query.includes('camera') || query.includes('tech') || query.includes('sony') || query.includes('photo')) detectedCategory = 'tech';
            if (query.includes('room') || query.includes('stay') || query.includes('apartment')) detectedCategory = 'rooms';
            if (query.includes('tool') || query.includes('drill') || query.includes('fix')) detectedCategory = 'tools';

            const results = await prisma.listing.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { category: detectedCategory ? { equals: detectedCategory, mode: 'insensitive' } : undefined },
                        { tags: { hasSome: [query] } }
                    ].filter(Boolean) as any[]
                },
                include: { owner: { select: { firstName: true } } },
                take: 5
            });

            res.json({
                results,
                query: q,
                intent: {
                    category: detectedCategory,
                    confidence: detectedCategory ? 0.8 : 0.4,
                    message: detectedCategory ? `I found some ${detectedCategory} for you.` : "Searching across all categories."
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    });

    app.post('/api/listings', authenticateToken, async (req: AuthRequest, res) => {
        console.log(`[API] Listing creation attempt by user: ${req.user!.userId}`);
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
                    ownerId: req.user!.userId,
                },
            });

            res.status(201).json({ message: 'Listing created successfully', listing });
        } catch (error) {
            console.error('Create listing error:', error);
            res.status(500).json({ error: 'Failed to create listing' });
        }
    });

    app.get('/api/listings/me', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const listings = await prisma.listing.findMany({
                where: { ownerId: req.user!.userId },
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


    // ─── Bookings Routes ───
    app.get('/api/bookings/me', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const bookings = await prisma.booking.findMany({
                where: { renterId: req.user!.userId },
                include: { listing: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ bookings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch your bookings' });
        }
    });

    // ─── Dashboard Routes ───
    app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;

            // Get user's listings
            const userListings = await prisma.listing.findMany({
                where: { ownerId: userId },
                select: { id: true }
            });
            const listingIds = userListings.map(l => l.id);

            // Earnings from bookings on user's listings
            const earnings = await prisma.booking.aggregate({
                where: {
                    listingId: { in: listingIds },
                    status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] }
                },
                _sum: { totalPrice: true }
            });

            // Message count
            const messageCount = await prisma.message.count({
                where: {
                    OR: [{ senderId: userId }, { receiverId: userId }]
                }
            });

            // Active bookings (as host)
            const activeBookingsAsHost = await prisma.booking.count({
                where: {
                    listingId: { in: listingIds },
                    status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
                }
            });

            res.json({
                totalListings: listingIds.length,
                totalEarnings: earnings._sum.totalPrice || 0,
                messageCount,
                activeBookings: activeBookingsAsHost
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    });

    app.get('/api/dashboard/revenue', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const userListings = await prisma.listing.findMany({
                where: { ownerId: userId },
                select: { id: true }
            });
            const listingIds = userListings.map(l => l.id);

            // Get last 7 months of data
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const now = new Date();
            const chartData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

                const monthlyEarnings = await prisma.booking.aggregate({
                    where: {
                        listingId: { in: listingIds },
                        status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] },
                        createdAt: { gte: date, lt: nextDate }
                    },
                    _sum: { totalPrice: true }
                });

                chartData.push({
                    name: months[date.getMonth()],
                    value: monthlyEarnings._sum.totalPrice || 0
                });
            }

            res.json(chartData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch revenue data' });
        }
    });

    app.get('/api/dashboard/activity', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            const chartData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(date.getDate() + 1);

                // For simplified "activity", we count bookings + views (if we had view logs)
                const dailyBookings = await prisma.booking.count({
                    where: {
                        listing: { ownerId: userId },
                        createdAt: { gte: date, lt: nextDate }
                    }
                });

                chartData.push({
                    name: days[date.getDay()],
                    value: dailyBookings * 10 // scale it up for the chart visual
                });
            }

            res.json(chartData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch activity data' });
        }
    });

    app.post('/api/bookings', authenticateToken, async (req: AuthRequest, res) => {
        const userId = req.user!.userId;
        console.log(`[API] Booking attempt by user: ${userId}`, req.body);
        try {
            const { listingId, startDate, endDate, totalPrice, rating, reviewText } = req.body;

            if (!listingId || !startDate || !endDate || !totalPrice) {
                return res.status(400).json({ error: 'Missing booking details' });
            }

            // Verify listing exists
            const listing = await prisma.listing.findUnique({ where: { id: listingId } });
            if (!listing) {
                console.error(`[API] Listing not found: ${listingId}`);
                return res.status(404).json({ error: 'Listing not found' });
            }
            if (!listing.available) {
                return res.status(400).json({ error: 'Listing is not available' });
            }

            // Verify user exists (renter)
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                console.error(`[API] Renter user not found in database: ${userId}`);
                return res.status(401).json({ error: 'User session invalid. Please log in again.' });
            }

            // Create booking and review in a transaction if rating is provided
            const result = await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.create({
                    data: {
                        listingId,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        totalPrice: parseFloat(totalPrice.toString()),
                        renterId: userId,
                        status: 'PENDING'
                    },
                });

                let review = null;
                if (rating) {
                    review = await tx.review.create({
                        data: {
                            listingId,
                            userId,
                            rating: parseInt(rating.toString()),
                            text: reviewText || 'Initial booking review'
                        }
                    });

                    // Update listing average rating
                    const allReviews = await tx.review.findMany({ where: { listingId } });
                    const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

                    await tx.listing.update({
                        where: { id: listingId },
                        data: {
                            rating: parseFloat(avgRating.toFixed(1)),
                            reviewCount: allReviews.length
                        }
                    });
                }

                return { booking, review };
            });

            console.log(`[API] Booking created successfully: ${result.booking.id}`);
            res.status(201).json({
                message: 'Booking created successfully',
                booking: result.booking,
                review: result.review
            });
        } catch (error: any) {
            console.error('Create booking error detailed:', {
                message: error.message,
                code: error.code,
                meta: error.meta,
                stack: error.stack
            });
            res.status(500).json({
                error: 'Failed to create booking',
                details: error.message
            });
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
    app.post('/api/reviews', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const { listingId, rating, text } = req.body;
            const userId = req.user!.userId;

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

