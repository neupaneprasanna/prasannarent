'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePublicSettingsStore } from '@/store/public-settings-store';
import { useAdminAuthStore } from '@/store/admin/admin-auth-store';

export default function MaintenanceGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { maintenanceMode, loading, fetchPublicSettings } = usePublicSettingsStore();
    const { isAuthenticated, token } = useAdminAuthStore();

    useEffect(() => {
        fetchPublicSettings();

        // Poll for maintenance status every 30 seconds for faster response
        const interval = setInterval(fetchPublicSettings, 30000);
        return () => clearInterval(interval);
    }, [fetchPublicSettings]);

    useEffect(() => {
        if (loading) return;

        const isAdminPath = pathname.startsWith('/admin');
        const isMaintenancePath = pathname === '/maintenance';

        // If maintenance mode is ON
        if (maintenanceMode) {
            // Allow Admins to see the site
            // We check both the isAuthenticated flag and the presence of a token
            if (!isAdminPath && !isMaintenancePath && !isAuthenticated && !token) {
                router.replace('/maintenance');
            }
        } else {
            // If maintenance mode is OFF and user is on /maintenance, send home
            if (isMaintenancePath) {
                router.replace('/');
            }
        }
    }, [maintenanceMode, loading, pathname, isAuthenticated, token, router]);

    return <>{children}</>;
}
