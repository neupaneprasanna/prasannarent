import { create } from 'zustand';

interface AppState {
    isLoading: boolean;
    isIntroComplete: boolean;
    cursorVariant: 'default' | 'hover' | 'click' | 'text' | 'hidden' | 'drag' | 'loading' | 'video';
    cursorText: string;
    isMobileMenuOpen: boolean;
    isSearchActive: boolean;
    isCommandMenuOpen: boolean;
    isAIAgentOpen: boolean;
    isCinemaMode: boolean;
    activeSection: string;
    activeChatContext?: any;
    aiDraftedReply?: string | null;
    setLoading: (loading: boolean) => void;
    setIntroComplete: (complete: boolean) => void;
    setCursorVariant: (variant: AppState['cursorVariant']) => void;
    setCursorText: (text: string) => void;
    setMobileMenuOpen: (open: boolean) => void;
    setSearchActive: (active: boolean) => void;
    setCommandMenuOpen: (open: boolean) => void;
    setAIAgentOpen: (open: boolean) => void;
    setCinemaMode: (active: boolean) => void;
    setActiveSection: (section: string) => void;
    setActiveChatContext: (context: any) => void;
    setAiDraftedReply: (reply: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isLoading: true,
    isIntroComplete: false,
    cursorVariant: 'default',
    cursorText: '',
    isMobileMenuOpen: false,
    isSearchActive: false,
    isCommandMenuOpen: false,
    isAIAgentOpen: false,
    isCinemaMode: false,
    activeSection: 'hero',
    setLoading: (loading) => set({ isLoading: loading }),
    setIntroComplete: (complete) => set({ isIntroComplete: complete }),
    setCursorVariant: (variant) => set({ cursorVariant: variant }),
    setCursorText: (text) => set({ cursorText: text }),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
    setSearchActive: (active) => set({ isSearchActive: active }),
    setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
    setAIAgentOpen: (open) => set({ isAIAgentOpen: open }),
    setCinemaMode: (active: boolean) => set({ isCinemaMode: active }),
    setActiveSection: (section) => set({ activeSection: section }),
    setActiveChatContext: (context) => set({ activeChatContext: context }),
    setAiDraftedReply: (reply) => set({ aiDraftedReply: reply }),
}));
