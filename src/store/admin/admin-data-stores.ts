import { create } from 'zustand';

const API_URL = '/api';

// ─── Generic Admin Module Store ─────────────────────────────────────────────────

interface PaginatedState<T> {
    items: T[];
    selectedItem: T | null;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    search: string;
    filters: Record<string, string>;
    sort: { field: string; direction: 'asc' | 'desc' };
    loading: boolean;
    error: string | null;
}

interface AdminUsersState extends PaginatedState<any> {
    fetch: (token: string) => Promise<void>;
    fetchOne: (token: string, id: string) => Promise<void>;
    updateUser: (token: string, id: string, data: Record<string, unknown>) => Promise<void>;
    banUser: (token: string, id: string, reason?: string) => Promise<void>;
    unbanUser: (token: string, id: string) => Promise<void>;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setFilters: (filters: Record<string, string>) => void;
}

export const useAdminUsersStore = create<AdminUsersState>()((set, get) => ({
    items: [],
    selectedItem: null,
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    search: '',
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    loading: false,
    error: null,

    fetch: async (token: string) => {
        const { page, pageSize, search, filters } = get();
        set({ loading: true });
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search }),
                ...filters,
            });
            const res = await fetch(`${API_URL}/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ items: data.items, total: data.total, totalPages: data.totalPages, loading: false });
            } else {
                const errorData = await res.json().catch(() => ({}));
                set({ error: errorData.error || 'Failed to fetch users', loading: false });
            }
        } catch (error) {
            set({ error: 'Failed to fetch users', loading: false });
        }
    },

    fetchOne: async (token: string, id: string) => {
        set({ loading: true });
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ selectedItem: data.user, loading: false });
            } else {
                const errorData = await res.json().catch(() => ({}));
                set({ error: errorData.error || 'Failed to fetch user', loading: false });
            }
        } catch (error) {
            set({ error: 'Failed to fetch user', loading: false });
        }
    },

    updateUser: async (token: string, id: string, data: Record<string, unknown>) => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                // Refresh the list
                get().fetch(token);
            }
        } catch {
            set({ error: 'Failed to update user' });
        }
    },

    banUser: async (token: string, id: string, reason?: string) => {
        try {
            await fetch(`${API_URL}/admin/users/${id}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason }),
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to ban user' });
        }
    },

    unbanUser: async (token: string, id: string) => {
        try {
            await fetch(`${API_URL}/admin/users/${id}/unban`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to unban user' });
        }
    },

    setSearch: (search: string) => set({ search, page: 1 }),
    setPage: (page: number) => set({ page }),
    setFilters: (filters: Record<string, string>) => set({ filters, page: 1 }),
}));

// ─── Listings Store ─────────────────────────────────────────────────────────────

interface AdminListingsState extends PaginatedState<any> {
    fetch: (token: string) => Promise<void>;
    fetchOne: (token: string, id: string) => Promise<void>;
    updateListing: (token: string, id: string, data: Record<string, unknown>) => Promise<void>;
    deleteListing: (token: string, id: string) => Promise<void>;
    approveListing: (token: string, id: string) => Promise<void>;
    rejectListing: (token: string, id: string, reason?: string) => Promise<void>;
    setSearch: (search: string) => void;
    setPage: (page: number) => void;
    setFilters: (filters: Record<string, string>) => void;
}

export const useAdminListingsStore = create<AdminListingsState>()((set, get) => ({
    items: [],
    selectedItem: null,
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    search: '',
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    loading: false,
    error: null,

    fetch: async (token: string) => {
        const { page, pageSize, search, filters } = get();
        set({ loading: true });
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search }),
                ...filters,
            });
            const res = await fetch(`${API_URL}/admin/listings?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ items: data.items, total: data.total, totalPages: data.totalPages, loading: false });
            } else {
                const errorData = await res.json().catch(() => ({}));
                set({ error: errorData.error || 'Failed to fetch listings', loading: false });
            }
        } catch (error) {
            set({ error: 'Failed to fetch listings', loading: false });
        }
    },

    fetchOne: async (token: string, id: string) => {
        set({ loading: true });
        try {
            const res = await fetch(`${API_URL}/admin/listings/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ selectedItem: data.listing, loading: false });
            } else {
                const errorData = await res.json().catch(() => ({}));
                set({ error: errorData.error || 'Failed to fetch listing', loading: false });
            }
        } catch (error) {
            set({ error: 'Failed to fetch listing', loading: false });
        }
    },

    updateListing: async (token: string, id: string, data: Record<string, unknown>) => {
        try {
            await fetch(`${API_URL}/admin/listings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to update listing' });
        }
    },

    deleteListing: async (token: string, id: string) => {
        try {
            await fetch(`${API_URL}/admin/listings/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to delete listing' });
        }
    },

    approveListing: async (token: string, id: string) => {
        try {
            await fetch(`${API_URL}/admin/listings/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to approve listing' });
        }
    },

    rejectListing: async (token: string, id: string, reason?: string) => {
        try {
            await fetch(`${API_URL}/admin/listings/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason }),
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to reject listing' });
        }
    },

    setSearch: (search: string) => set({ search, page: 1 }),
    setPage: (page: number) => set({ page }),
    setFilters: (filters: Record<string, string>) => set({ filters, page: 1 }),
}));

// ─── Bookings Store ─────────────────────────────────────────────────────────────

interface AdminBookingsState extends PaginatedState<any> {
    fetch: (token: string) => Promise<void>;
    updateStatus: (token: string, id: string, status: string) => Promise<void>;
    setPage: (page: number) => void;
    setFilters: (filters: Record<string, string>) => void;
}

export const useAdminBookingsStore = create<AdminBookingsState>()((set, get) => ({
    items: [],
    selectedItem: null,
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    search: '',
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    loading: false,
    error: null,

    fetch: async (token: string) => {
        const { page, pageSize, filters } = get();
        set({ loading: true });
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...filters,
            });
            const res = await fetch(`${API_URL}/admin/bookings?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ items: data.items, total: data.total, totalPages: data.totalPages, loading: false });
            } else {
                const errorData = await res.json().catch(() => ({}));
                set({ error: errorData.error || 'Failed to fetch bookings', loading: false });
            }
        } catch (error) {
            set({ error: 'Failed to fetch bookings', loading: false });
        }
    },

    updateStatus: async (token: string, id: string, status: string) => {
        try {
            await fetch(`${API_URL}/admin/bookings/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            get().fetch(token);
        } catch {
            set({ error: 'Failed to update booking status' });
        }
    },

    setPage: (page: number) => set({ page }),
    setFilters: (filters: Record<string, string>) => set({ filters, page: 1 }),
}));

// ─── UI Store ───────────────────────────────────────────────────────────────────

interface AdminUIState {
    sidebarCollapsed: boolean;
    sidebarMobileOpen: boolean;
    commandPaletteOpen: boolean;
    activeModal: string | null;
    modalData: any;

    toggleSidebar: () => void;
    setSidebarMobileOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;
    openModal: (modal: string, data?: any) => void;
    closeModal: () => void;
}

export const useAdminUIStore = create<AdminUIState>()((set) => ({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    commandPaletteOpen: false,
    activeModal: null,
    modalData: null,

    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarMobileOpen: (open: boolean) => set({ sidebarMobileOpen: open }),
    toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
    openModal: (modal: string, data?: any) => set({ activeModal: modal, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),
}));
