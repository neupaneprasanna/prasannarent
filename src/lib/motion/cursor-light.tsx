'use client';

import { createContext, useContext, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CursorLightState {
    /** Client X position */
    x: number;
    /** Client Y position */
    y: number;
    /** Normalized 0–1 X within viewport */
    nx: number;
    /** Normalized 0–1 Y within viewport */
    ny: number;
    /** Cursor velocity magnitude */
    speed: number;
    /** Whether cursor is over an interactive element */
    isOverInteractive: boolean;
}

type Subscriber = () => void;

function createCursorStore() {
    let state: CursorLightState = {
        x: -100, y: -100, nx: 0.5, ny: 0.5,
        speed: 0, isOverInteractive: false,
    };
    const subscribers = new Set<Subscriber>();

    return {
        getState: () => state,
        setState: (partial: Partial<CursorLightState>) => {
            state = { ...state, ...partial };
            subscribers.forEach((fn) => fn());
        },
        subscribe: (fn: Subscriber) => {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        },
    };
}

const CursorLightContext = createContext<ReturnType<typeof createCursorStore> | null>(null);

export function CursorLightProvider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef(createCursorStore());
    const prevPos = useRef({ x: 0, y: 0 });
    const smoothSpeed = useRef(0);

    useEffect(() => {
        const store = storeRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - prevPos.current.x;
            const dy = e.clientY - prevPos.current.y;
            const rawSpeed = Math.sqrt(dx * dx + dy * dy);
            smoothSpeed.current = smoothSpeed.current * 0.85 + rawSpeed * 0.15;

            prevPos.current = { x: e.clientX, y: e.clientY };

            // Check if over interactive element
            const target = e.target as HTMLElement;
            const isOverInteractive = !!(
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                target.closest('input') ||
                target.closest('[data-interactive]')
            );

            store.setState({
                x: e.clientX,
                y: e.clientY,
                nx: e.clientX / window.innerWidth,
                ny: e.clientY / window.innerHeight,
                speed: smoothSpeed.current,
                isOverInteractive,
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <CursorLightContext.Provider value={storeRef.current}>
            {children}
        </CursorLightContext.Provider>
    );
}

/** Full cursor light state */
export function useCursorLight(): CursorLightState {
    const store = useContext(CursorLightContext);
    if (!store) return { x: -100, y: -100, nx: 0.5, ny: 0.5, speed: 0, isOverInteractive: false };
    return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Imperative access (no re-render) */
export function useCursorLightRef() {
    const store = useContext(CursorLightContext);
    return useCallback(() => {
        return store?.getState() ?? { x: -100, y: -100, nx: 0.5, ny: 0.5, speed: 0, isOverInteractive: false };
    }, [store]);
}
