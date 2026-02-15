import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSettingsState {
    general: {
        siteName: string;
        maintenanceMode: boolean;
        supportEmail: string;
    };
    registration: {
        allowNewUsers: boolean;
        requireEmailVerification: boolean;
        defaultRole: string;
    };
    fees: {
        platformFeePercent: number;
        currency: string;
    };
    notifications: {
        emailAlerts: boolean;
        slackIntegration: boolean;
    };

    // Actions
    fetchSettings: (token: string) => Promise<void>;
    updateGeneral: (token: string, settings: Partial<AdminSettingsState['general']>) => Promise<void>;
    updateRegistration: (settings: Partial<AdminSettingsState['registration']>) => void;
    updateFees: (settings: Partial<AdminSettingsState['fees']>) => void;
    updateNotifications: (settings: Partial<AdminSettingsState['notifications']>) => void;
}

export const useAdminSettingsStore = create<AdminSettingsState>()(
    persist(
        (set) => ({
            general: {
                siteName: 'RentVerse',
                maintenanceMode: false,
                supportEmail: 'support@rentverse.com',
            },
            registration: {
                allowNewUsers: true,
                requireEmailVerification: true,
                defaultRole: 'USER',
            },
            fees: {
                platformFeePercent: 10, // 10%
                currency: 'USD',
            },
            notifications: {
                emailAlerts: true,
                slackIntegration: false,
            },

            fetchSettings: async (token) => {
                try {
                    const res = await fetch(`/api/admin/settings?group=general`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const { settings } = await res.json();
                        const maintenance = settings.find((s: any) => s.key === 'maintenance_mode');
                        if (maintenance) {
                            set((state) => ({
                                general: { ...state.general, maintenanceMode: maintenance.value === 'true' }
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch settings:', error);
                }
            },
            updateGeneral: async (token, settings) => {
                if (settings.maintenanceMode !== undefined) {
                    try {
                        await fetch(`/api/admin/settings/maintenance_mode`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ value: String(settings.maintenanceMode) })
                        });
                    } catch (error) {
                        console.error('Failed to update maintenance mode:', error);
                    }
                }

                set((state) => ({
                    general: { ...state.general, ...settings }
                }));
            },
            updateRegistration: (settings) => set((state) => ({
                registration: { ...state.registration, ...settings }
            })),
            updateFees: (settings) => set((state) => ({
                fees: { ...state.fees, ...settings }
            })),
            updateNotifications: (settings) => set((state) => ({
                notifications: { ...state.notifications, ...settings }
            })),
        }),
        {
            name: 'admin-settings-storage', // unique name
        }
    )
);
