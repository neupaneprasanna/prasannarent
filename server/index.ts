import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import next from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAdminRouter } from './admin/routes';
import { setupAdminWebSocket } from './admin/websocket';
import { detectSearchIntent, rankResults } from './lib/groq';
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

            try {
                // Fetch user to check status (active/banned)
                const dbUser = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { id: true, banned: true, lastSeenAt: true } as any
                });

                if (!dbUser) {
                    return res.status(401).json({ error: 'User not found' });
                }

                if ((dbUser as any).banned) {
                    return res.status(403).json({ error: 'Account suspended. Please contact support.' });
                }

                (req as AuthRequest).user = decoded;

                // Periodically update lastSeenAt (only if more than 5 minutes ago)
                const now = new Date();
                const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

                if (!(dbUser as any).lastSeenAt || (dbUser as any).lastSeenAt < fiveMinutesAgo) {
                    await prisma.user.update({
                        where: { id: decoded.userId },
                        data: { lastSeenAt: now } as any
                    });
                }
            } catch (error) {
                console.error('Auth middleware error:', error);
                return res.status(500).json({ error: 'Authentication failed' });
            }

            next();
        });
    };

    // ─── Maintenance Middleware ───
    const checkMaintenance = async (req: Request, res: Response, next: NextFunction) => {
        const path = req.path.toLowerCase();

        // Skip for critical public routes, admin paths, and static assets
        const isPublicSetting = path === '/api/settings/public';
        const isHealth = path === '/api/health' || path === '/health';
        const isAdminPath = path.startsWith('/admin') || path.startsWith('/api/admin');
        const isAuth = path.startsWith('/api/auth');
        const isAsset = path.startsWith('/_next') ||
            path.startsWith('/static') ||
            path.startsWith('/images') ||
            path.startsWith('/assets') ||
            path === '/favicon.ico';

        if (isPublicSetting || isHealth || isAdminPath || isAuth || isAsset) {
            return next();
        }

        try {
            const maintenanceSetting = await prisma.platformSetting.findUnique({
                where: { key: 'maintenance_mode' }
            });

            if (maintenanceSetting?.value === 'true') {
                // Check if requester is an admin
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];

                if (token) {
                    try {
                        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
                        const user = await prisma.user.findUnique({
                            where: { id: decoded.userId },
                            select: { role: true }
                        });

                        // Allow Admins to bypass maintenance
                        if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
                            return next();
                        }
                    } catch (e) {
                        // Token invalid/expired - follow through to block
                    }
                }

                // If not an admin or no token, block non-GET requests or sensitive routes
                // Actually, block everything except the explicit skips above for public users
                return res.status(503).json({
                    error: 'System Maintenance',
                    message: 'RentVerse is currently undergoing scheduled maintenance. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Maintenance check error:', error);
        }

        next();
    };

    app.use(checkMaintenance);

    // ─── Admin Routes ───
    app.use('/api/admin', createAdminRouter());

    // ─── Admin WebSocket ───
    const adminWS = setupAdminWebSocket(io);

    // ─── Health check ───
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ─── Public System Settings ───
    app.get('/api/settings/public', async (_req, res) => {
        try {
            const maintenanceMode = await prisma.platformSetting.findUnique({
                where: { key: 'maintenance_mode' }
            });
            res.json({
                maintenanceMode: maintenanceMode?.value === 'true'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch public settings' });
        }
    });

    // ─── Auth Routes ───
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, firstName, lastName, phone, address, city, dateOfBirth, governmentIdType, governmentIdNumber, interests, avatar } = req.body;

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
                    phone: phone || null,
                    address: address || null,
                    city: city || null,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    governmentIdType: governmentIdType || null,
                    governmentIdNumber: governmentIdNumber || null,
                    interests: interests || [],
                    avatar: avatar || null,
                } as any,
            });

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
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
                    verified: user.verified,
                    avatar: user.avatar
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
            const { category, search, minPrice, maxPrice, sort, minRating, availableOnly, id } = req.query;
            const where: import('@prisma/client').Prisma.ListingWhereInput = {
                status: 'ACTIVE' // Only show active listings by default
            };

            const conditions: any[] = [];

            // Targeted fetch by ID (for redirects from AI search)
            if (id && typeof id === 'string') {
                where.id = id;
            } else {
                if (category && category !== 'all' && category !== 'All') {
                    conditions.push({ category: { equals: category as string, mode: 'insensitive' } });
                }

                if (search) {
                    const searchStr = search as string;
                    const searchWords = searchStr.split(' ').filter(w => w.length > 1);

                    if (searchWords.length > 0) {
                        const searchConditions = searchWords.map(word => ({
                            OR: [
                                { title: { contains: word, mode: 'insensitive' } },
                                { description: { contains: word, mode: 'insensitive' } },
                                { tags: { hasSome: [word] } }
                            ]
                        }));
                        conditions.push({ AND: searchConditions });
                    }
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
            }

            if (conditions.length > 0) {
                where.AND = conditions;
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
                include: { owner: { select: { firstName: true, verified: true, avatar: true } } }
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
            if (!q || typeof q !== 'string') {
                return res.json({ results: [], query: q, intent: null });
            }

            console.log(`[Groq Search] Processing query: "${q}"`);

            // 1. Detect Intent using Groq
            const categories = ['Tech', 'Vehicles', 'Rooms', 'Equipment', 'Fashion', 'Studios', 'Tools', 'Digital'];
            const intent = await detectSearchIntent(q, categories);

            console.log(`[Groq Search] Detected Intent:`, intent);

            // 2. Build Prisma Query
            // Collect all potential search terms
            const searchTerms = new Set<string>();
            if (intent.keywords && intent.keywords.length > 0) {
                intent.keywords.forEach(k => {
                    k.split(' ').forEach(word => {
                        if (word.length > 1) searchTerms.add(word.toLowerCase());
                    });
                    if (k.length > 1) searchTerms.add(k.toLowerCase());
                });
            }
            // Also add original query words
            q.split(' ').forEach(word => {
                if (word.length > 1) searchTerms.add(word.toLowerCase());
            });

            const termArray = Array.from(searchTerms);

            // Build a broad OR condition for these terms
            const wordConditions = termArray.map(term => ({
                OR: [
                    { title: { contains: term, mode: 'insensitive' as any } },
                    { description: { contains: term, mode: 'insensitive' as any } },
                    { tags: { hasSome: [term] } }
                ]
            }));

            const where: import('@prisma/client').Prisma.ListingWhereInput = {
                status: 'ACTIVE',
                OR: [
                    ...wordConditions,
                    ...(intent.category ? [{ category: { equals: intent.category, mode: 'insensitive' as any } }] : [])
                ]
            };

            // Price filters
            if (intent.minPrice !== null || intent.maxPrice !== null) {
                where.price = {
                    gte: intent.minPrice ?? undefined,
                    lte: intent.maxPrice ?? undefined,
                };
            }

            // 3. Fetch initial results
            let listings = await prisma.listing.findMany({
                where,
                include: { owner: { select: { firstName: true, verified: true, avatar: true } } },
                take: 30
            });

            // 4. Rank results using AI
            if (listings.length > 0) {
                listings = await rankResults(q, listings);
            }

            res.json({
                results: listings,
                query: q,
                intent: {
                    category: intent.category,
                    explanation: intent.explanation,
                    confidence: 0.95
                }
            });
        } catch (error) {
            console.error('AI Search error:', error);
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
                    tags: Array.from(new Set((tags || []).map((t: string) => t.trim()).filter(Boolean))),
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

                // Notify the listing owner about this booking request
                const notification = await tx.notification.create({
                    data: {
                        userId: listing.ownerId,
                        type: 'BOOKING_REQUEST',
                        title: 'New Booking Request',
                        message: `${user.firstName} wants to rent "${listing.title}" from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
                    }
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

                return { booking, review, notification };
            });

            // Emit real-time notification to owner via WebSocket
            io.emit(`notification:${listing.ownerId}`, result.notification);

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

    // ─── Owner Booking Approval Routes ───
    app.get('/api/bookings/owner', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const userListings = await prisma.listing.findMany({
                where: { ownerId: userId },
                select: { id: true }
            });
            const listingIds = userListings.map(l => l.id);

            const bookings = await prisma.booking.findMany({
                where: { listingId: { in: listingIds } },
                include: {
                    listing: { select: { id: true, title: true, images: true, price: true, priceUnit: true } },
                    renter: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ bookings });
        } catch (error) {
            console.error('Owner bookings error:', error);
            res.status(500).json({ error: 'Failed to fetch owner bookings' });
        }
    });

    app.patch('/api/bookings/:id/owner-action', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const id = req.params.id as string;
            const { action, ownerNote } = req.body; // action: 'approve' | 'reject'

            // Fetch booking with listing to verify ownership
            const booking = await (prisma.booking as any).findUnique({
                where: { id },
                include: { listing: { select: { ownerId: true, title: true } }, renter: { select: { id: true, firstName: true } } }
            });

            if (!booking) return res.status(404).json({ error: 'Booking not found' });
            if (booking.listing.ownerId !== userId) return res.status(403).json({ error: 'Not your listing' });
            if (booking.status !== 'PENDING') return res.status(400).json({ error: 'Booking is not pending' });

            const newStatus = action === 'approve' ? 'CONFIRMED' : 'CANCELLED';

            const updated = await prisma.$transaction(async (tx) => {
                const updatedBooking = await tx.booking.update({
                    where: { id },
                    data: { status: newStatus, ownerNote: ownerNote || null } as any,
                });

                // Notify the renter
                const notification = await tx.notification.create({
                    data: {
                        userId: booking.renterId,
                        type: action === 'approve' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
                        title: action === 'approve' ? 'Booking Approved!' : 'Booking Declined',
                        message: action === 'approve'
                            ? `Your booking for "${booking.listing.title}" has been approved! ${ownerNote ? 'Note: ' + ownerNote : ''}`
                            : `Your booking for "${booking.listing.title}" was declined. ${ownerNote ? 'Reason: ' + ownerNote : ''}`,
                    }
                });

                return { updatedBooking, notification };
            });

            // Real-time notification to renter
            io.emit(`notification:${booking.renterId}`, updated.notification);

            res.json({ message: `Booking ${action}d`, booking: updated.updatedBooking });
        } catch (error) {
            console.error('Owner action error:', error);
            res.status(500).json({ error: 'Failed to process booking action' });
        }
    });

    app.patch('/api/bookings/:id/status', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const id = req.params.id as string;
            const { status } = req.body;
            const booking = await prisma.booking.update({
                where: { id },
                data: { status },
            });
            res.json({ message: 'Booking status updated', booking });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update booking' });
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

            const result = await prisma.$transaction(async (tx) => {
                const review = await tx.review.create({
                    data: { listingId, userId, rating: parseInt(rating), text }
                });

                const reviews = await tx.review.findMany({ where: { listingId } });
                const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0);
                const averageRating = totalRating / reviews.length;

                await tx.listing.update({
                    where: { id: listingId },
                    data: { rating: averageRating, reviewCount: reviews.length }
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

    // ─── Notifications Routes ───
    app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            const unreadCount = await prisma.notification.count({
                where: { userId, read: false },
            });
            res.json({ notifications, unreadCount });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    });

    app.patch('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const notification = await prisma.notification.update({
                where: { id: req.params.id as string },
                data: { read: true },
            });
            res.json({ notification });
        } catch (error) {
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    });

    app.patch('/api/notifications/read-all', authenticateToken, async (req: AuthRequest, res) => {
        try {
            await prisma.notification.updateMany({
                where: { userId: req.user!.userId, read: false },
                data: { read: true },
            });
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to mark all as read' });
        }
    });

    // ─── Messaging / Conversations Routes ───
    app.get('/api/conversations', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;

            // Fetch all conversations involving this user
            const allConversations = await (prisma as any).conversation.findMany({
                where: {
                    participants: { some: { userId } }
                },
                include: {
                    participants: {
                        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
                    },
                    listing: { select: { id: true, title: true, images: true } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: { sender: { select: { id: true, firstName: true } } }
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });

            // Group and deduplicate by the OTHER participant's user ID
            // This ensures only one conversation per person shows up in the list
            const uniqueMap = new Map();

            for (const conv of allConversations) {
                // Find the first participant that is NOT the current requester
                const otherParticipant = conv.participants.find((p: any) => p.userId !== userId);

                if (otherParticipant) {
                    const otherId = otherParticipant.userId;
                    // Since they are ordered by updatedAt desc, the first one we see is the latest
                    if (!uniqueMap.has(otherId)) {
                        uniqueMap.set(otherId, conv);
                    }
                }
            }

            const uniqueConversations = Array.from(uniqueMap.values());

            // Supplement with unread counts
            const conversationsWithMetadata = await Promise.all(uniqueConversations.map(async (conv: any) => {
                const unreadCount = await (prisma as any).conversationMessage.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { not: userId },
                        read: false
                    }
                });
                return { ...conv, unreadCount };
            }));

            res.json({ conversations: conversationsWithMetadata });
        } catch (error) {
            console.error('Conversations fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    });

    app.get('/api/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;

            // Verify user is participant
            const participant = await (prisma as any).conversationParticipant.findUnique({
                where: { userId_conversationId: { userId, conversationId: id } }
            });
            if (!participant) return res.status(403).json({ error: 'Not a participant' });

            const messages = await (prisma as any).conversationMessage.findMany({
                where: { conversationId: id },
                include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
                orderBy: { createdAt: 'asc' },
            });

            // Mark unread messages as read
            await (prisma as any).conversationMessage.updateMany({
                where: { conversationId: id, senderId: { not: userId }, read: false },
                data: { read: true },
            });

            res.json({ messages });
        } catch (error) {
            console.error('Messages fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    });

    app.post('/api/conversations', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const { receiverId, listingId, message } = req.body;

            if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
            if (receiverId === userId) return res.status(400).json({ error: 'Cannot message yourself' });

            // Find ANY existing conversation between these exact people
            const existing = await (prisma as any).conversation.findFirst({
                where: {
                    AND: [
                        { participants: { some: { userId } } },
                        { participants: { some: { userId: receiverId } } }
                    ]
                },
                orderBy: { updatedAt: 'desc' }
            });

            if (existing) {
                // Update listing association if missing or different, and always bump updatedAt
                const updateData: any = { updatedAt: new Date() };
                if (listingId && existing.listingId !== listingId) {
                    updateData.listingId = listingId;
                }

                await (prisma as any).conversation.update({
                    where: { id: existing.id },
                    data: updateData
                });

                if (message) {
                    const msg = await (prisma as any).conversationMessage.create({
                        data: {
                            conversationId: existing.id,
                            senderId: userId,
                            text: message
                        },
                        include: { sender: { select: { firstName: true } } }
                    });

                    // Determine correct receiver
                    const otherParticipant = existing.participants?.find((p: any) => p.userId !== userId)
                        || await (prisma as any).conversationParticipant.findFirst({
                            where: { conversationId: existing.id, userId: { not: userId } }
                        });
                    const receiverIdToNotify = otherParticipant?.userId || receiverId;

                    // Create DB Notification
                    const dbNotif = await prisma.notification.create({
                        data: {
                            userId: receiverIdToNotify,
                            type: 'NEW_MESSAGE',
                            title: `New Message from ${msg.sender.firstName}`,
                            message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                        }
                    });

                    // Emit real-time stuff only to receiver
                    io.emit(`message:${receiverIdToNotify}`, { conversationId: existing.id, message: msg });
                    io.emit(`notification:${receiverIdToNotify}`, dbNotif);
                }

                const returnConv = await (prisma as any).conversation.findUnique({
                    where: { id: existing.id },
                    include: {
                        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
                        listing: { select: { id: true, title: true, images: true } },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { sender: { select: { id: true, firstName: true } } }
                        },
                    }
                });
                return res.json({ conversation: returnConv });
            }

            // Create new conversation
            const conversation = await (prisma as any).conversation.create({
                data: {
                    listingId: listingId || null,
                    participants: {
                        create: [
                            { userId },
                            { userId: receiverId },
                        ]
                    },
                    ...(message ? {
                        messages: {
                            create: { senderId: userId, text: message }
                        }
                    } : {})
                },
                include: {
                    participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
                    listing: { select: { id: true, title: true, images: true } },
                    messages: { include: { sender: { select: { id: true, firstName: true } } } },
                }
            });

            // Create DB Notification for the receiver if a message was sent
            if (message) {
                // Determine receiverId (the one who is NOT the current userId)
                const realReceiver = conversation.participants.find((p: any) => p.userId !== userId);
                const receiverIdToNotify = realReceiver?.userId || receiverId;

                const dbNotif = await prisma.notification.create({
                    data: {
                        userId: receiverIdToNotify,
                        type: 'NEW_MESSAGE',
                        title: `New Message from ${conversation.participants.find((p: any) => p.userId === userId)?.user.firstName || 'User'}`,
                        message: message.length > 50 ? message.substring(0, 47) + '...' : message,
                    }
                });

                // ONLY emit to the receiver, NEVER the sender
                io.emit(`notification:${receiverIdToNotify}`, dbNotif);
                io.emit(`message:${receiverIdToNotify}`, {
                    conversationId: conversation.id,
                    message: conversation.messages[0]
                });
            }

            res.status(201).json({ conversation });
        } catch (error) {
            console.error('Create conversation error:', error);
            res.status(500).json({ error: 'Failed to create conversation' });
        }
    });

    app.post('/api/conversations/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const userId = req.user!.userId;
            const { id } = req.params;
            const { text } = req.body;

            if (!text) return res.status(400).json({ error: 'Message text is required' });

            // Verify user is participant
            const participant = await (prisma as any).conversationParticipant.findUnique({
                where: { userId_conversationId: { userId, conversationId: id } }
            });
            if (!participant) return res.status(403).json({ error: 'Not a participant' });

            const message = await (prisma as any).conversationMessage.create({
                data: { conversationId: id, senderId: userId, text },
                include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
            });

            // Update conversation timestamp
            await (prisma as any).conversation.update({ where: { id }, data: { updatedAt: new Date() } });

            // Real-time: emit to all participants except sender
            const participants = await (prisma as any).conversationParticipant.findMany({
                where: { conversationId: id, userId: { not: userId } }
            });

            for (const p of participants) {
                // SAFETY: Skip the sender entirely for both message and notification emissions
                if (p.userId === userId) continue;

                // Create DB Notification for persistence
                const dbNotif = await prisma.notification.create({
                    data: {
                        userId: p.userId,
                        type: 'NEW_MESSAGE',
                        title: `New Message from ${message.sender.firstName}`,
                        message: message.text.length > 50 ? message.text.substring(0, 47) + '...' : message.text,
                    }
                });

                // Real-time: emit ONLY to the intended recipient
                io.emit(`message:${p.userId}`, { conversationId: id, message });
                io.emit(`notification:${p.userId}`, dbNotif);
            }

            res.status(201).json({ message });
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    // ─── Users / Profile Routes ───
    app.get('/api/users/search', async (req, res) => {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                return res.json({ users: [] });
            }

            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: q, mode: 'insensitive' as any } },
                        { lastName: { contains: q, mode: 'insensitive' as any } },
                        // Optional: search by email if desired, but maybe keep privacy in mind?
                        // { email: { contains: q, mode: 'insensitive' as any } }
                    ],
                    // Only show verified users or something? Or all users?
                    // banned: false 
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    verified: true,
                    city: true
                },
                take: 10
            });

            res.json({ users });
        } catch (error) {
            console.error('User search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    });

    app.get('/api/users/me', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.userId },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    phone: true, avatar: true, bio: true, verified: true,
                    address: true, city: true, dateOfBirth: true,
                    governmentIdType: true, interests: true,
                    createdAt: true,
                } as any,
            });
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    });

    app.patch('/api/users/me', authenticateToken, async (req: AuthRequest, res) => {
        try {
            const { firstName, lastName, phone, bio, avatar, address, city } = req.body;
            const updateData: any = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (bio !== undefined) updateData.bio = bio;
            if (avatar !== undefined) updateData.avatar = avatar;
            if (address !== undefined) updateData.address = address;
            if (city !== undefined) updateData.city = city;

            const user = await prisma.user.update({
                where: { id: req.user!.userId },
                data: updateData,
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    phone: true, avatar: true, bio: true, verified: true,
                    address: true, city: true,
                    createdAt: true,
                } as any,
            });
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    });

    app.get('/api/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true, firstName: true, lastName: true,
                    avatar: true, bio: true, verified: true,
                    city: true, interests: true,
                    createdAt: true,
                } as any,
            });
            if (!user) return res.status(404).json({ error: 'User not found' });

            const listings = await prisma.listing.findMany({
                where: { ownerId: id, status: 'ACTIVE' },
                take: 12,
                orderBy: { createdAt: 'desc' },
            });

            const reviews = await prisma.review.findMany({
                where: { userId: id },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { listing: { select: { title: true } } },
            });

            const listingCount = await prisma.listing.count({ where: { ownerId: id, status: 'ACTIVE' } });
            const reviewCount = await prisma.review.count({ where: { userId: id } });

            res.json({ user, listings, reviews, stats: { listingCount, reviewCount } });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user profile' });
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

