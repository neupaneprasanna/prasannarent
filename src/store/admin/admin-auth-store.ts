import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminRole, Permission, SidebarItem, PermissionModule, PermissionAction } from '@/types/admin';

// ─── Admin Auth Store ───────────────────────────────────────────────────────────

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: AdminRole;
    verified: boolean;
    permissions: Permission[];
}

interface AdminAuthState {
    user: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    accessibleModules: string[];
    sidebarItems: SidebarItem[];
    loading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<boolean>;
    fetchMe: () => Promise<void>;
    logout: () => void;
    hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
    clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAdminAuthStore = create<AdminAuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            accessibleModules: [],
            sidebarItems: [],
            loading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const res = await fetch(`${API_URL}/admin/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        set({ loading: false, error: data.error || 'Login failed' });
                        return false;
                    }

                    const data = await res.json();
                    set({
                        user: data.user,
                        token: data.token,
                        isAuthenticated: true,
                        accessibleModules: data.accessibleModules,
                        sidebarItems: data.sidebarItems,
                        loading: false,
                        error: null,
                    });
                    return true;
                } catch {
                    set({ loading: false, error: 'Network error. Please try again.' });
                    return false;
                }
            },

            fetchMe: async () => {
                const { token } = get();
                if (!token) return;

                try {
                    const res = await fetch(`${API_URL}/admin/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (!res.ok) {
                        set({ user: null, token: null, isAuthenticated: false });
                        return;
                    }

                    const data = await res.json();
                    set({
                        user: data.user,
                        accessibleModules: data.accessibleModules,
                        sidebarItems: data.sidebarItems,
                    });
                } catch {
                    // Silent fail — will retry on next page load
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    accessibleModules: [],
                    sidebarItems: [],
                });
            },

            hasPermission: (module: PermissionModule, action: PermissionAction) => {
                const { user } = get();
                if (!user) return false;
                if (user.role === 'SUPER_ADMIN') return true;
                return user.permissions.some(p => p.module === module && p.action === action);
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'rentverse-admin-auth',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                accessibleModules: state.accessibleModules,
                sidebarItems: state.sidebarItems,
            }),
        }
    )
);
