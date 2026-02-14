import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { isAdminRole, hasPermission } from '../../src/types/admin';
import type { AdminRole, PermissionModule, PermissionAction } from '../../src/types/admin';
import { adminEvents, ADMIN_EVENT_TYPES } from './events';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// ─── Extended Request with Admin Context ────────────────────────────────────────

export interface AdminRequest extends Request {
    admin?: {
        userId: string;
        email: string;
        role: AdminRole;
        firstName: string;
        lastName: string;
    };
}

// ─── JWT Authentication for Admin Routes ────────────────────────────────────────

export function authenticateAdmin(req: AdminRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

        // Fetch user from DB to get current role
        prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, banned: true }
        } as any).then((userResult: any) => {
            if (!userResult) {
                res.status(401).json({ error: 'User not found' });
                return;
            }

            if (userResult.banned) {
                res.status(403).json({ error: 'Account is banned' });
                return;
            }

            if (!isAdminRole(userResult.role)) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }

            req.admin = {
                userId: userResult.id,
                email: userResult.email,
                role: userResult.role as AdminRole,
                firstName: userResult.firstName,
                lastName: userResult.lastName,
            };

            next();
        }).catch(() => {
            res.status(500).json({ error: 'Authentication failed' });
        });
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ─── Role Requirement Middleware ─────────────────────────────────────────────────

export function requireRole(...allowedRoles: AdminRole[]) {
    return (req: AdminRequest, res: Response, next: NextFunction) => {
        if (!req.admin) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // SUPER_ADMIN always passes
        if (req.admin.role === 'SUPER_ADMIN') {
            next();
            return;
        }

        if (!allowedRoles.includes(req.admin.role)) {
            res.status(403).json({ error: 'Insufficient role permissions' });
            return;
        }

        next();
    };
}

// ─── Permission Requirement Middleware ───────────────────────────────────────────

export function requirePermission(module: PermissionModule, action: PermissionAction) {
    return (req: AdminRequest, res: Response, next: NextFunction) => {
        if (!req.admin) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!hasPermission(req.admin.role, module, action)) {
            res.status(403).json({ error: `Permission denied: ${module}.${action}` });
            return;
        }

        next();
    };
}

// ─── Audit Logger ───────────────────────────────────────────────────────────────

export async function auditLog(
    adminId: string,
    action: string,
    module: string,
    opts?: {
        targetType?: string;
        targetId?: string;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }
) {
    try {
        const newLog = await (prisma as any).auditLog.create({
            data: {
                adminId,
                action,
                module,
                targetType: opts?.targetType,
                targetId: opts?.targetId,
                details: (opts?.details as any) || undefined,
                ipAddress: opts?.ipAddress,
                userAgent: opts?.userAgent,
            },
            include: {
                admin: { select: { firstName: true, lastName: true } }
            }
        });

        // Emit for real-time updates
        adminEvents.emit(ADMIN_EVENT_TYPES.AUDIT_LOG_CREATED, {
            id: newLog.id,
            action: newLog.action,
            module: newLog.module,
            adminId: newLog.adminId,
            adminName: `${newLog.admin.firstName} ${newLog.admin.lastName}`,
            timestamp: newLog.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('[AuditLog] Failed to write audit log:', error);
    }
}

// ─── Rate Limiter (In-Memory for now) ───────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
    return (req: AdminRequest, res: Response, next: NextFunction) => {
        const key = req.admin?.userId || req.ip || 'anonymous';
        const now = Date.now();
        const entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetAt) {
            rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }

        if (entry.count >= maxRequests) {
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

        entry.count++;
        next();
    };
}

// Clean up rate limit store every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 300000);
