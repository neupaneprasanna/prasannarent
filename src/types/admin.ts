// ─── Admin TypeScript Types ─────────────────────────────────────────────────────

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'FINANCE' | 'SUPPORT' | 'ANALYST';

export const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'FINANCE', 'SUPPORT', 'ANALYST'];

// Role hierarchy: higher index = more access
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
    SUPPORT: 1,
    ANALYST: 1,
    MODERATOR: 2,
    FINANCE: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
};

export type PermissionModule =
    | 'dashboard'
    | 'users'
    | 'listings'
    | 'bookings'
    | 'payments'
    | 'content'
    | 'ai'
    | 'features'
    | 'notifications'
    | 'moderation'
    | 'analytics'
    | 'audit'
    | 'system'
    | 'settings'
    | 'messages';

export type PermissionAction = 'read' | 'write' | 'delete' | 'approve' | 'manage';

export interface Permission {
    module: PermissionModule;
    action: PermissionAction;
}

// ─── Permission Matrix ──────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    SUPER_ADMIN: [
        // Full access to everything
        ...(['dashboard', 'users', 'listings', 'bookings', 'payments', 'content', 'ai', 'features', 'notifications', 'moderation', 'analytics', 'audit', 'system', 'settings'] as PermissionModule[])
            .flatMap(module => (['read', 'write', 'delete', 'approve', 'manage'] as PermissionAction[]).map(action => ({ module, action }))),
    ],
    ADMIN: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' }, { module: 'users', action: 'write' }, { module: 'users', action: 'manage' },
        { module: 'listings', action: 'read' }, { module: 'listings', action: 'write' }, { module: 'listings', action: 'delete' }, { module: 'listings', action: 'approve' },
        { module: 'bookings', action: 'read' }, { module: 'bookings', action: 'write' },
        { module: 'payments', action: 'read' }, { module: 'payments', action: 'write' },
        { module: 'content', action: 'read' }, { module: 'content', action: 'write' },
        { module: 'notifications', action: 'read' }, { module: 'notifications', action: 'write' },
        { module: 'moderation', action: 'read' }, { module: 'moderation', action: 'write' }, { module: 'moderation', action: 'approve' },
        { module: 'analytics', action: 'read' },
        { module: 'audit', action: 'read' },
        { module: 'system', action: 'read' },
    ],
    MODERATOR: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' }, { module: 'users', action: 'write' },
        { module: 'listings', action: 'read' }, { module: 'listings', action: 'write' }, { module: 'listings', action: 'delete' }, { module: 'listings', action: 'approve' },
        { module: 'bookings', action: 'read' },
        { module: 'content', action: 'read' }, { module: 'content', action: 'write' },
        { module: 'notifications', action: 'read' }, { module: 'notifications', action: 'write' },
        { module: 'moderation', action: 'read' }, { module: 'moderation', action: 'write' }, { module: 'moderation', action: 'approve' },
        { module: 'audit', action: 'read' },
    ],
    FINANCE: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' },
        { module: 'listings', action: 'read' },
        { module: 'bookings', action: 'read' }, { module: 'bookings', action: 'write' },
        { module: 'payments', action: 'read' }, { module: 'payments', action: 'write' }, { module: 'payments', action: 'manage' },
        { module: 'analytics', action: 'read' },
        { module: 'audit', action: 'read' },
    ],
    SUPPORT: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' },
        { module: 'listings', action: 'read' },
        { module: 'bookings', action: 'read' },
        { module: 'moderation', action: 'read' },
        { module: 'audit', action: 'read' },
    ],
    ANALYST: [
        { module: 'dashboard', action: 'read' },
        { module: 'users', action: 'read' },
        { module: 'listings', action: 'read' },
        { module: 'bookings', action: 'read' },
        { module: 'payments', action: 'read' },
        { module: 'analytics', action: 'read' }, { module: 'analytics', action: 'manage' },
        { module: 'audit', action: 'read' },
    ],
};

// ─── Helper Functions ───────────────────────────────────────────────────────────

export function isAdminRole(role: string): role is AdminRole {
    return ADMIN_ROLES.includes(role as AdminRole);
}

export function hasPermission(role: AdminRole, module: PermissionModule, action: PermissionAction): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.some(p => p.module === module && p.action === action);
}

export function getAccessibleModules(role: AdminRole): PermissionModule[] {
    const permissions = ROLE_PERMISSIONS[role];
    return [...new Set(permissions.map(p => p.module))];
}

// ─── Admin API Response Types ───────────────────────────────────────────────────

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    avatar?: string;
    verified: boolean;
    permissions: Permission[];
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalListings: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
    pendingApprovals: number;
    moderationQueue: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
}

export interface AdminActivityEvent {
    id: string;
    action: string;
    module: string;
    adminId: string;
    adminName: string;
    severity: 'info' | 'warning' | 'critical';
    timestamp: string;
    details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface AdminRevenueDataPoint {
    date: string;
    revenue: number;
    bookings: number;
}

// ─── Sidebar Navigation Types ───────────────────────────────────────────────────

export interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    module: PermissionModule;
    badge?: number;
    children?: SidebarItem[];
}

export const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
    { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard', href: '/admin', module: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'Users', href: '/admin/users', module: 'users' },
    { id: 'listings', label: 'Listings', icon: 'Building2', href: '/admin/listings', module: 'listings' },
    { id: 'bookings', label: 'Bookings', icon: 'Calendar', href: '/admin/bookings', module: 'bookings' },
    { id: 'messages', label: 'Messages', icon: 'MessageSquare', href: '/admin/messages', module: 'dashboard' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard', href: '/admin/payments', module: 'payments' },
    { id: 'content', label: 'Content', icon: 'FileText', href: '/admin/content', module: 'content' },
    { id: 'ai', label: 'AI Control', icon: 'Brain', href: '/admin/ai', module: 'ai' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell', href: '/admin/notifications', module: 'notifications' },
    { id: 'features', label: 'Features', icon: 'ToggleRight', href: '/admin/features', module: 'features' },
    { id: 'moderation', label: 'Moderation', icon: 'Shield', href: '/admin/moderation', module: 'moderation' },
    { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/admin/analytics', module: 'analytics' },
    { id: 'audit', label: 'Audit Log', icon: 'ScrollText', href: '/admin/audit', module: 'audit' },
    { id: 'system', label: 'System', icon: 'Server', href: '/admin/system', module: 'system' },
    { id: 'settings', label: 'Settings', icon: 'Settings', href: '/admin/settings', module: 'settings' },
];
