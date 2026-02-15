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
            const res = await fetch('/api/settings/public');
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
