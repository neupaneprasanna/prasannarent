import { create } from 'zustand';

interface PublicSettingsState {
    maintenanceMode: boolean;
    loading: boolean;
    fetchPublicSettings: () => Promise<void>;
}

export const usePublicSettingsStore = create<PublicSettingsState>((set) => ({
    maintenanceMode: false,
    loading: true,
    fetchPublicSettings: async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${baseUrl}/settings/public`);
            if (res.ok) {
                const data = await res.json();
                set({ maintenanceMode: data.maintenanceMode, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Failed to fetch public settings:', error);
            set({ loading: false });
        }
    }
}));
