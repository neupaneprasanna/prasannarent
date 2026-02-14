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
    updateGeneral: (settings: Partial<AdminSettingsState['general']>) => void;
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

            updateGeneral: (settings) => set((state) => ({
                general: { ...state.general, ...settings }
            })),
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
