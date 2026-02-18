import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    authenticateAdmin,
    requirePermission,
    requireRole,
    rateLimit,
    auditLog,
} from './middleware';
import type { AdminRequest } from './middleware';
import { ROLE_PERMISSIONS, getAccessibleModules, ADMIN_SIDEBAR_ITEMS } from '../../src/types/admin';
import type { AdminRole } from '../../src/types/admin';
import { calculateHostLevels } from '../jobs/host-levels';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export function createAdminRouter(): Router {
    const router = Router();

    // Apply rate limiting to all admin routes
    router.use(rateLimit(200, 60000));

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════════════════════

    router.post('/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            if ((user as any).banned) {
                res.status(403).json({ error: 'Account is banned' });
                return;
            }

            if (user.role === 'USER') {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                // Track failed login attempts
                await (prisma.user as any).update({
                    where: { id: user.id },
                    data: { failedLoginAttempts: { increment: 1 } }
                });
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Reset failed attempts on successful login
            await (prisma.user as any).update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lastLoginAt: new Date(),
                    loginCount: { increment: 1 },
                }
            });

            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '4h' }
            );

            await auditLog(user.id, 'admin.login', 'auth', {
                ipAddress: req.ip as string,
                userAgent: req.headers['user-agent'] as string,
            });

            const role = user.role as AdminRole;
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    role: user.role,
                    verified: user.verified,
                    permissions: ROLE_PERMISSIONS[role] || [],
                },
                token,
                accessibleModules: getAccessibleModules(role),
                sidebarItems: ADMIN_SIDEBAR_ITEMS.filter(item =>
                    getAccessibleModules(role).includes(item.module)
                ),
            });
        } catch (error) {
            console.error('[Admin Auth] Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    });

    router.get('/auth/me', authenticateAdmin, async (req: AdminRequest, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.admin!.userId },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    avatar: true, role: true, verified: true, createdAt: true,
                }
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const role = user.role as AdminRole;
            res.json({
                user: {
                    ...user,
                    permissions: ROLE_PERMISSIONS[role] || [],
                },
                accessibleModules: getAccessibleModules(role),
                sidebarItems: ADMIN_SIDEBAR_ITEMS.filter(item =>
                    getAccessibleModules(role).includes(item.module)
                ),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch admin profile' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/dashboard/stats', authenticateAdmin, requirePermission('dashboard', 'read'), async (req: AdminRequest, res) => {
        try {
            const [totalUsers, totalListings, totalBookings, revenueResult, activeUsers, pendingApprovals, moderationQueue] = await Promise.all([
                prisma.user.count(),
                prisma.listing.count(),
                prisma.booking.count(),
                prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED' } }),
                (prisma.user as any).count({ where: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } }),
                (prisma.listing as any).count({ where: { status: 'PENDING_APPROVAL' } }),
                (prisma as any).moderationItem.count({ where: { status: 'PENDING' } }),
            ]);

            res.json({
                totalUsers,
                totalListings,
                totalBookings,
                totalRevenue: revenueResult._sum.totalPrice || 0,
                activeUsers,
                pendingApprovals,
                moderationQueue,
                systemHealth: 'healthy',
            });
        } catch (error) {
            console.error('[Admin Dashboard] Stats error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    });

    router.get('/dashboard/revenue', authenticateAdmin, requirePermission('dashboard', 'read'), async (req: AdminRequest, res) => {
        try {
            const daysParam = req.query.days;
            const days = parseInt(typeof daysParam === 'string' ? daysParam : '30') || 30;
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const bookings = await prisma.booking.findMany({
                where: {
                    status: { in: ['COMPLETED', 'ACTIVE'] },
                    createdAt: { gte: startDate },
                },
                select: { totalPrice: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
            });

            // Group by day
            const revenueMap = new Map<string, { revenue: number; bookings: number }>();
            bookings.forEach(b => {
                const day = b.createdAt.toISOString().split('T')[0];
                const existing = revenueMap.get(day) || { revenue: 0, bookings: 0 };
                existing.revenue += b.totalPrice;
                existing.bookings += 1;
                revenueMap.set(day, existing);
            });

            const data = Array.from(revenueMap.entries()).map(([date, stats]) => ({
                date,
                revenue: Math.round(stats.revenue * 100) / 100,
                bookings: stats.bookings,
            }));

            res.json({ data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch revenue data' });
        }
    });

    router.get('/dashboard/activity', authenticateAdmin, requirePermission('dashboard', 'read'), async (req: AdminRequest, res) => {
        try {
            const limitParam = req.query.limit;
            const limit = parseInt(typeof limitParam === 'string' ? limitParam : '20') || 20;
            const logs = await prisma.auditLog.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: { select: { firstName: true, lastName: true, avatar: true } }
                }
            });

            const activities = logs.map(log => ({
                id: log.id,
                action: log.action,
                module: log.module,
                adminId: log.adminId,
                adminName: `${log.admin.firstName} ${log.admin.lastName}`,
                adminAvatar: log.admin.avatar,
                targetType: log.targetType,
                targetId: log.targetId,
                details: log.details,
                timestamp: log.createdAt.toISOString(),
            }));

            res.json({ activities });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch activity data' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/users', authenticateAdmin, requirePermission('users', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20') || 20;
            const search = typeof req.query.search === 'string' ? req.query.search : '';
            const role = typeof req.query.role === 'string' ? req.query.role : undefined;
            const verified = typeof req.query.verified === 'string' ? req.query.verified : undefined;

            const where: any = {};
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (role) where.role = role;
            if (verified === 'true') where.verified = true;
            if (verified === 'false') where.verified = false;

            const [users, total] = await Promise.all([
                (prisma.user as any).findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, email: true, firstName: true, lastName: true,
                        avatar: true, role: true, verified: true, banned: true,
                        loginCount: true, lastLoginAt: true, createdAt: true,
                        _count: { select: { listings: true, bookings: true, reviews: true } }
                    }
                }),
                (prisma.user as any).count({ where }),
            ]);

            res.json({
                items: users,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });

    router.get('/users/:id', authenticateAdmin, requirePermission('users', 'read'), async (req: AdminRequest, res) => {
        try {
            const user = await (prisma as any).user.findUnique({
                where: { id: req.params.id as string },
                include: {
                    listings: { take: 10, orderBy: { createdAt: 'desc' } },
                    bookings: { take: 10, orderBy: { createdAt: 'desc' }, include: { listing: { select: { title: true } } } },
                    reviews: { take: 10, orderBy: { createdAt: 'desc' } },
                    _count: { select: { listings: true, bookings: true, reviews: true } }
                }
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Don't send password
            const { password: _, ...safeUser } = user;
            res.json({ user: safeUser });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    });

    router.patch('/users/:id', authenticateAdmin, requirePermission('users', 'write'), async (req: AdminRequest, res) => {
        try {
            const { role, verified, firstName, lastName, phone, bio } = req.body;
            const updateData: any = {};

            if (role !== undefined) updateData.role = role;
            if (verified !== undefined) updateData.verified = verified;
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (bio !== undefined) updateData.bio = bio;

            const user = await (prisma.user as any).update({
                where: { id: req.params.id as string },
                data: updateData,
                select: { id: true, email: true, firstName: true, lastName: true, role: true, verified: true }
            });

            await auditLog(req.admin!.userId, 'user.update', 'users', {
                targetType: 'User',
                targetId: req.params.id as string,
                details: updateData as any,
                ipAddress: req.ip as string,
            });

            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update user' });
        }
    });

    router.post('/users/:id/ban', authenticateAdmin, requirePermission('users', 'write'), async (req: AdminRequest, res) => {
        try {
            const { reason } = req.body;
            const user = await (prisma.user as any).update({
                where: { id: req.params.id as string },
                data: { banned: true, bannedAt: new Date(), bannedReason: reason || 'No reason provided' },
            });

            await auditLog(req.admin!.userId, 'user.ban', 'users', {
                targetType: 'User',
                targetId: req.params.id as string,
                details: { reason } as any,
                ipAddress: req.ip as string,
            });

            res.json({ message: 'User banned', userId: user.id });
        } catch (error) {
            res.status(500).json({ error: 'Failed to ban user' });
        }
    });

    router.post('/users/:id/unban', authenticateAdmin, requirePermission('users', 'write'), async (req: AdminRequest, res) => {
        try {
            const user = await (prisma.user as any).update({
                where: { id: req.params.id as string },
                data: { banned: false, bannedAt: null, bannedReason: null },
            });

            await auditLog(req.admin!.userId, 'user.unban', 'users', {
                targetType: 'User',
                targetId: req.params.id as string,
                ipAddress: req.ip as string,
            });

            res.json({ message: 'User unbanned', userId: user.id });
        } catch (error) {
            res.status(500).json({ error: 'Failed to unban user' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // LISTINGS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/listings', authenticateAdmin, requirePermission('listings', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20') || 20;
            const search = typeof req.query.search === 'string' ? req.query.search : '';
            const category = typeof req.query.category === 'string' ? req.query.category : undefined;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;

            const where: any = {};
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (category) where.category = category;
            if (status) where.status = status;

            const [listings, total] = await Promise.all([
                (prisma.listing as any).findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        owner: { select: { id: true, firstName: true, lastName: true, email: true, verified: true } },
                        media: true,
                        _count: { select: { bookings: true, reviews: true } },
                    }
                }),
                (prisma.listing as any).count({ where }),
            ]);

            res.json({
                items: listings,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch listings' });
        }
    });

    router.get('/listings/:id', authenticateAdmin, requirePermission('listings', 'read'), async (req: AdminRequest, res) => {
        try {
            const listing = await (prisma.listing as any).findUnique({
                where: { id: req.params.id as string },
                include: {
                    owner: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, verified: true } },
                    media: true,
                    bookings: { take: 10, orderBy: { createdAt: 'desc' } },
                    reviews: { take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
                }
            });

            if (!listing) {
                res.status(404).json({ error: 'Listing not found' });
                return;
            }

            res.json({ listing });
        } catch (error) {
            console.error('[Admin Listings] Detail error:', error);
            res.status(500).json({ error: (error as any).message || 'Failed to fetch listing' });
        }
    });

    router.patch('/listings/:id', authenticateAdmin, requirePermission('listings', 'write'), async (req: AdminRequest, res) => {
        try {
            const { title, description, price, category, available, featured, status } = req.body;
            const updateData: any = {};

            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (price !== undefined) updateData.price = price;
            if (category !== undefined) updateData.category = category;
            if (available !== undefined) updateData.available = available;
            if (featured !== undefined) updateData.featured = featured;
            if (status !== undefined) updateData.status = status;

            const listing = await (prisma.listing as any).update({
                where: { id: req.params.id as string },
                data: updateData,
            });

            await auditLog(req.admin!.userId, 'listing.update', 'listings', {
                targetType: 'Listing',
                targetId: req.params.id as string,
                details: updateData as any,
                ipAddress: req.ip as string,
            });

            res.json({ listing });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update listing' });
        }
    });

    router.delete('/listings/:id', authenticateAdmin, requirePermission('listings', 'delete'), async (req: AdminRequest, res) => {
        try {
            await (prisma as any).listing.delete({ where: { id: req.params.id as string } });

            await auditLog(req.admin!.userId, 'listing.delete', 'listings', {
                targetType: 'Listing',
                targetId: req.params.id as string,
                ipAddress: req.ip as string,
            });

            res.json({ message: 'Listing deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete listing' });
        }
    });

    router.post('/listings/:id/approve', authenticateAdmin, requirePermission('listings', 'approve'), async (req: AdminRequest, res) => {
        try {
            const listing = await (prisma.listing as any).update({
                where: { id: req.params.id as string },
                data: { status: 'ACTIVE' },
            });

            await auditLog(req.admin!.userId, 'listing.approve', 'listings', {
                targetType: 'Listing',
                targetId: req.params.id as string,
                ipAddress: req.ip as string,
            });

            res.json({ listing });
        } catch (error) {
            res.status(500).json({ error: 'Failed to approve listing' });
        }
    });

    router.post('/listings/:id/reject', authenticateAdmin, requirePermission('listings', 'approve'), async (req: AdminRequest, res) => {
        try {
            const { reason } = req.body;
            const listing = await (prisma.listing as any).update({
                where: { id: req.params.id as string },
                data: { status: 'REJECTED' },
            });

            await auditLog(req.admin!.userId, 'listing.reject', 'listings', {
                targetType: 'Listing',
                targetId: req.params.id as string,
                details: { reason } as any,
                ipAddress: req.ip as string,
            });

            res.json({ listing });
        } catch (error) {
            res.status(500).json({ error: 'Failed to reject listing' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // BOOKINGS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/bookings', authenticateAdmin, requirePermission('bookings', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20') || 20;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;

            const where: any = {};
            if (status) where.status = status;

            const [bookings, total] = await Promise.all([
                (prisma.booking as any).findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        listing: { select: { id: true, title: true, price: true, images: true, media: true } },
                        renter: { select: { id: true, firstName: true, lastName: true, email: true } },
                    }
                }),
                (prisma.booking as any).count({ where }),
            ]);

            res.json({
                items: bookings,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch bookings' });
        }
    });

    router.patch('/bookings/:id/status', authenticateAdmin, requirePermission('bookings', 'write'), async (req: AdminRequest, res) => {
        try {
            const { status } = req.body;
            const booking = await (prisma as any).booking.update({
                where: { id: req.params.id as string },
                data: { status },
            });

            await auditLog(req.admin!.userId, 'booking.status_change', 'bookings', {
                targetType: 'Booking',
                targetId: req.params.id as string,
                details: { newStatus: status } as any,
                ipAddress: req.ip as string,
            });

            res.json({ booking });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update booking status' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // MODERATION
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/moderation/queue', authenticateAdmin, requirePermission('moderation', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20') || 20;
            const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';

            const where: any = { status };
            const [items, total] = await Promise.all([
                (prisma as any).moderationItem.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } }
                    }
                }),
                (prisma as any).moderationItem.count({ where }),
            ]);

            res.json({
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch moderation queue' });
        }
    });

    router.post('/moderation/queue/:id/approve', authenticateAdmin, requirePermission('moderation', 'approve'), async (req: AdminRequest, res) => {
        try {
            const item = await (prisma as any).moderationItem.update({
                where: { id: req.params.id as string },
                data: {
                    status: 'APPROVED',
                    reviewerId: req.admin!.userId,
                    reviewNote: (req.body as any).note,
                    reviewedAt: new Date(),
                },
            });

            await auditLog(req.admin!.userId, 'moderation.approve', 'moderation', {
                targetType: item.targetType,
                targetId: item.targetId,
                ipAddress: req.ip as string,
            });

            res.json({ item });
        } catch (error) {
            res.status(500).json({ error: 'Failed to approve moderation item' });
        }
    });

    router.post('/moderation/queue/:id/reject', authenticateAdmin, requirePermission('moderation', 'approve'), async (req: AdminRequest, res) => {
        try {
            const item = await (prisma as any).moderationItem.update({
                where: { id: req.params.id as string },
                data: {
                    status: 'REJECTED',
                    reviewerId: req.admin!.userId,
                    reviewNote: (req.body as any).note,
                    reviewedAt: new Date(),
                },
            });

            await auditLog(req.admin!.userId, 'moderation.reject', 'moderation', {
                targetType: item.targetType,
                targetId: item.targetId,
                ipAddress: req.ip as string,
            });

            res.json({ item });
        } catch (error) {
            res.status(500).json({ error: 'Failed to reject moderation item' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // FEATURE FLAGS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/features/flags', authenticateAdmin, requirePermission('features', 'read'), async (req: AdminRequest, res) => {
        try {
            const flags = await (prisma as any).featureFlag.findMany({ orderBy: { key: 'asc' } });
            res.json({ flags });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch feature flags' });
        }
    });

    router.patch('/features/flags/:id', authenticateAdmin, requirePermission('features', 'write'), async (req: AdminRequest, res) => {
        try {
            const { enabled, rollout, metadata } = req.body;
            const updateData: any = {};
            if (enabled !== undefined) updateData.enabled = enabled;
            if (rollout !== undefined) updateData.rollout = rollout;
            if (metadata !== undefined) updateData.metadata = metadata;

            const flag = await (prisma as any).featureFlag.update({
                where: { id: req.params.id as string },
                data: updateData,
            });

            await auditLog(req.admin!.userId, 'feature.toggle', 'features', {
                targetType: 'FeatureFlag',
                targetId: req.params.id as string,
                details: updateData as any,
                ipAddress: req.ip as string,
            });

            res.json({ flag });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update feature flag' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/content/blocks', authenticateAdmin, requirePermission('content', 'read'), async (req: AdminRequest, res) => {
        try {
            const section = typeof req.query.section === 'string' ? req.query.section : undefined;
            const where: any = {};
            if (section) where.section = section;

            const blocks = await (prisma as any).contentBlock.findMany({
                where,
                orderBy: [{ section: 'asc' }, { order: 'asc' }],
            });
            res.json({ blocks });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch content blocks' });
        }
    });

    router.put('/content/blocks/:id', authenticateAdmin, requirePermission('content', 'write'), async (req: AdminRequest, res) => {
        try {
            const { value, active, order } = req.body;
            const block = await (prisma as any).contentBlock.update({
                where: { id: req.params.id as string },
                data: { value, active, order },
            });

            await auditLog(req.admin!.userId, 'content.update', 'content', {
                targetType: 'ContentBlock',
                targetId: req.params.id as string,
                details: { section: block.section, key: block.key } as any,
                ipAddress: req.ip as string,
            });

            res.json({ block });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update content block' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // AI CONFIG
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/ai/config', authenticateAdmin, requirePermission('ai', 'read'), async (req: AdminRequest, res) => {
        try {
            const configs = await (prisma as any).aIConfig.findMany({ orderBy: [{ system: 'asc' }, { parameter: 'asc' }] });
            // Group by system
            const grouped: Record<string, Array<{ parameter: string; value: string; description: string | null }>> = {};
            configs.forEach((c: { system: string; parameter: string; value: string; description: string | null }) => {
                if (!grouped[c.system]) grouped[c.system] = [];
                grouped[c.system].push({ parameter: c.parameter, value: c.value, description: c.description });
            });
            res.json({ configs: grouped });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch AI config' });
        }
    });

    router.patch('/ai/config', authenticateAdmin, requirePermission('ai', 'write'), async (req: AdminRequest, res) => {
        try {
            const { system, parameter, value } = req.body;
            const config = await (prisma as any).aIConfig.upsert({
                where: { system_parameter: { system, parameter } },
                update: { value },
                create: { system, parameter, value },
            });

            await auditLog(req.admin!.userId, 'ai.config_change', 'ai', {
                details: { system, parameter, value } as any,
                ipAddress: req.ip as string,
            });

            res.json({ config });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update AI config' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // MESSAGES (Admin oversight)
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/messages', authenticateAdmin, requirePermission('dashboard', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '20') || 20;
            const search = typeof req.query.search === 'string' ? req.query.search : '';

            const where: any = {};
            if (search) {
                where.OR = [
                    { messages: { some: { text: { contains: search, mode: 'insensitive' } } } },
                    { participants: { some: { user: { firstName: { contains: search, mode: 'insensitive' } } } } },
                    { participants: { some: { user: { lastName: { contains: search, mode: 'insensitive' } } } } },
                ];
            }

            const [conversations, total] = await Promise.all([
                (prisma as any).conversation.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        participants: {
                            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } }
                        },
                        listing: { select: { id: true, title: true } },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { sender: { select: { id: true, firstName: true } } }
                        },
                        _count: { select: { messages: true } },
                    }
                }),
                (prisma as any).conversation.count({ where }),
            ]);

            res.json({
                items: conversations,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            console.error('[Admin Messages] Error:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    });

    router.get('/messages/:conversationId', authenticateAdmin, requirePermission('dashboard', 'read'), async (req: AdminRequest, res) => {
        try {
            const { conversationId } = req.params;
            const messages = await (prisma as any).conversationMessage.findMany({
                where: { conversationId },
                include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
                orderBy: { createdAt: 'asc' },
            });
            const conversation = await (prisma as any).conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                    listing: { select: { id: true, title: true } },
                },
            });
            res.json({ conversation, messages });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch conversation messages' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/audit/logs', authenticateAdmin, requirePermission('audit', 'read'), async (req: AdminRequest, res) => {
        try {
            const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1') || 1;
            const pageSize = parseInt(typeof req.query.pageSize === 'string' ? req.query.pageSize : '50') || 50;
            const module = typeof req.query.module === 'string' ? req.query.module : undefined;
            const action = typeof req.query.action === 'string' ? req.query.action : undefined;
            const adminId = typeof req.query.adminId === 'string' ? req.query.adminId : undefined;

            const where: any = {};
            if (module) where.module = module;
            if (action) where.action = { contains: action };
            if (adminId) where.adminId = adminId;

            // Non-super admins can only see their own logs
            if (req.admin!.role !== 'SUPER_ADMIN' && req.admin!.role !== 'ADMIN') {
                where.adminId = req.admin!.userId;
            }

            const [logs, total] = await Promise.all([
                (prisma as any).auditLog.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        admin: { select: { firstName: true, lastName: true, email: true, avatar: true } }
                    }
                }),
                (prisma as any).auditLog.count({ where }),
            ]);

            res.json({
                items: logs,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/settings', authenticateAdmin, requirePermission('settings', 'read'), async (req: AdminRequest, res) => {
        try {
            const group = typeof req.query.group === 'string' ? req.query.group : undefined;
            const where: any = {};
            if (group) where.group = group;

            const settings = await (prisma as any).platformSetting.findMany({ where, orderBy: { key: 'asc' } });
            res.json({ settings });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch settings' });
        }
    });

    router.patch('/settings/:key', authenticateAdmin, requirePermission('settings', 'write'), async (req: AdminRequest, res) => {
        try {
            const { value } = req.body;
            const setting = await (prisma as any).platformSetting.update({
                where: { key: req.params.key as string },
                data: { value },
            });

            await auditLog(req.admin!.userId, 'settings.update', 'settings', {
                details: { key: req.params.key as string, value } as any,
                ipAddress: req.ip as string,
            });

            res.json({ setting });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update setting' });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // SYSTEM HEALTH
    // ═══════════════════════════════════════════════════════════════════════════════

    router.get('/system/health', authenticateAdmin, requirePermission('system', 'read'), async (req: AdminRequest, res) => {
        try {
            const start = Date.now();
            await (prisma as any).$queryRaw`SELECT 1`;
            const dbLatency = Date.now() - start;

            const memUsage = process.memoryUsage();

            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                database: {
                    status: 'connected',
                    latency: `${dbLatency}ms`,
                },
                memory: {
                    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                status: 'degraded',
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            });
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // SYSTEM JOBS
    // ═══════════════════════════════════════════════════════════════════════════════

    router.post('/jobs/host-levels', authenticateAdmin, requirePermission('system', 'manage'), async (req: AdminRequest, res) => {
        try {
            const result = await calculateHostLevels();

            await auditLog(req.admin!.userId, 'job.execute', 'system', {
                details: { job: 'calculateHostLevels', result } as any,
                ipAddress: req.ip as string,
            });

            res.json({ message: 'Host levels updated', stats: result });
        } catch (error) {
            res.status(500).json({ error: 'Failed to calculate host levels' });
        }
    });

    return router;
}
