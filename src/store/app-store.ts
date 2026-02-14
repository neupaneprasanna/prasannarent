import { create } from 'zustand';

interface AppState {
    isLoading: boolean;
    isIntroComplete: boolean;
    cursorVariant: 'default' | 'hover' | 'click' | 'text' | 'hidden' | 'drag' | 'loading' | 'video';
    cursorText: string;
    isMobileMenuOpen: boolean;
    isSearchActive: boolean;
    isCommandMenuOpen: boolean;
    isCinemaMode: boolean;
    activeSection: string;
    setLoading: (loading: boolean) => void;
    setIntroComplete: (complete: boolean) => void;
    setCursorVariant: (variant: AppState['cursorVariant']) => void;
    setCursorText: (text: string) => void;
    setMobileMenuOpen: (open: boolean) => void;
    setSearchActive: (active: boolean) => void;
    setCommandMenuOpen: (open: boolean) => void;
    setCinemaMode: (active: boolean) => void;
    setActiveSection: (section: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isLoading: true,
    isIntroComplete: false,
    cursorVariant: 'default',
    cursorText: '',
    isMobileMenuOpen: false,
    isSearchActive: false,
    isCommandMenuOpen: false,
    isCinemaMode: false,
    activeSection: 'hero',
    setLoading: (loading) => set({ isLoading: loading }),
    setIntroComplete: (complete) => set({ isIntroComplete: complete }),
    setCursorVariant: (variant) => set({ cursorVariant: variant }),
    setCursorText: (text) => set({ cursorText: text }),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    setSearchActive: (active) => set({ isSearchActive: active }),
    setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
    setCinemaMode: (active: boolean) => set({ isCinemaMode: active }),
    setActiveSection: (section) => set({ activeSection: section }),
}));
