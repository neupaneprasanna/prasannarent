import { Server as SocketIO } from 'socket.io';
import jwt from 'jsonwebtoken';
import { isAdminRole } from '../../src/types/admin';
import { adminEvents, ADMIN_EVENT_TYPES } from './events';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export function setupAdminWebSocket(io: SocketIO) {
    const adminNamespace = io.of('/admin');

    // ─── Authentication Middleware ────────────────────────────────────────────────
    adminNamespace.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role?: string };

            // We'll re-verify the role from DB in a production setup,
            // but for real-time performance we trust the token here
            if (decoded.role && !isAdminRole(decoded.role)) {
                return next(new Error('Admin access required'));
            }

            socket.data.user = decoded;
            next();
        } catch {
            next(new Error('Invalid or expired token'));
        }
    });

    // ─── Connection Handler ───────────────────────────────────────────────────────
    adminNamespace.on('connection', (socket) => {
        console.log(`[Admin WS] Admin connected: ${socket.data.user?.email} (${socket.id})`);

        // Join admin room
        socket.join('admin-dashboard');

        // Handle ping
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        // Handle subscription to specific modules
        socket.on('subscribe', (module: string) => {
            socket.join(`admin-${module}`);
            console.log(`[Admin WS] ${socket.data.user?.email} subscribed to ${module}`);
        });

        socket.on('unsubscribe', (module: string) => {
            socket.leave(`admin-${module}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Admin WS] Admin disconnected: ${socket.data.user?.email}`);
        });
    });

    // ─── Event Listeners ─────────────────────────────────────────────────────────
    adminEvents.on(ADMIN_EVENT_TYPES.AUDIT_LOG_CREATED, (log) => {
        adminNamespace.to('admin-dashboard').emit('admin:activity', log);
    });

    // ─── Emitter Functions ────────────────────────────────────────────────────────

    return {
        namespace: adminNamespace,

        // Broadcast stats update to all connected admins
        emitStatsUpdate(stats: Record<string, unknown>) {
            adminNamespace.to('admin-dashboard').emit('admin:stats:update', stats);
        },

        // Emit new booking notification
        emitNewBooking(booking: Record<string, unknown>) {
            adminNamespace.to('admin-dashboard').emit('admin:booking:new', booking);
            adminNamespace.to('admin-bookings').emit('admin:booking:new', booking);
        },

        // Emit booking status change
        emitBookingStatus(bookingId: string, status: string) {
            adminNamespace.to('admin-bookings').emit('admin:booking:status', { bookingId, status });
        },

        // Emit new user signup
        emitNewUser(user: Record<string, unknown>) {
            adminNamespace.to('admin-dashboard').emit('admin:user:signup', user);
            adminNamespace.to('admin-users').emit('admin:user:signup', user);
        },

        // Emit new listing
        emitNewListing(listing: Record<string, unknown>) {
            adminNamespace.to('admin-dashboard').emit('admin:listing:new', listing);
            adminNamespace.to('admin-listings').emit('admin:listing:new', listing);
        },

        // Emit moderation item
        emitModerationItem(item: Record<string, unknown>) {
            adminNamespace.to('admin-moderation').emit('admin:moderation:new', item);
        },

        // Emit system alert
        emitSystemAlert(alert: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }) {
            adminNamespace.emit('admin:alert:system', alert);
        },

        // Emit admin activity
        emitActivity(activity: { action: string; module: string; adminName: string; timestamp: Date }) {
            adminNamespace.to('admin-dashboard').emit('admin:activity', {
                ...activity,
                timestamp: activity.timestamp.toISOString(),
            });
        },
    };
}

export type AdminWebSocket = ReturnType<typeof setupAdminWebSocket>;
