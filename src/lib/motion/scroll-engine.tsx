'use client';

import { createContext, useContext, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScrollState {
    /** Pixels scrolled from top */
    scrollY: number;
    /** 0–1 normalized page progress */
    progress: number;
    /** Scroll velocity in px/frame (smoothed) */
    velocity: number;
    /** Absolute velocity magnitude */
    speed: number;
    /** 1 = scrolling down, -1 = scrolling up, 0 = idle */
    direction: -1 | 0 | 1;
    /** Whether the user is actively scrolling */
    isScrolling: boolean;
    /** Viewport height */
    viewportHeight: number;
    /** Document total scrollable height */
    documentHeight: number;
}

type Subscriber = () => void;

// ─── Scroll Store (external store pattern for zero re-renders) ──────────────
function createScrollStore() {
    let state: ScrollState = {
        scrollY: 0,
        progress: 0,
        velocity: 0,
        speed: 0,
        direction: 0,
        isScrolling: false,
        viewportHeight: 0,
        documentHeight: 0,
    };

    const subscribers = new Set<Subscriber>();

    return {
        getState: () => state,
        setState: (partial: Partial<ScrollState>) => {
            state = { ...state, ...partial };
            subscribers.forEach((fn) => fn());
        },
        subscribe: (fn: Subscriber) => {
            subscribers.add(fn);
            return () => subscribers.delete(fn);
        },
    };
}

// ─── Context ────────────────────────────────────────────────────────────────
const ScrollEngineContext = createContext<ReturnType<typeof createScrollStore> | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function ScrollEngineProvider({ children }: { children: React.ReactNode }) {
    const storeRef = useRef(createScrollStore());
    const prevScrollY = useRef(0);
    const velocitySmooth = useRef(0);
    const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafId = useRef(0);

    useEffect(() => {
        const store = storeRef.current;

        // Reduced motion check
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const update = () => {
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;
            const documentHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            );
            const maxScroll = documentHeight - viewportHeight;
            const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

            // Raw velocity
            const rawVelocity = scrollY - prevScrollY.current;
            // Exponential smoothing (α = 0.15 for silky feel)
            velocitySmooth.current = velocitySmooth.current * 0.85 + rawVelocity * 0.15;

            const velocity = velocitySmooth.current;
            const speed = Math.abs(velocity);
            const direction: -1 | 0 | 1 = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : 0;

            prevScrollY.current = scrollY;

            store.setState({
                scrollY,
                progress,
                velocity,
                speed,
                direction,
                isScrolling: speed > 0.5,
                viewportHeight,
                documentHeight,
            });

            // Idle detection
            if (idleTimer.current) clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => {
                velocitySmooth.current = 0;
                store.setState({ velocity: 0, speed: 0, direction: 0, isScrolling: false });
            }, 150);

            rafId.current = requestAnimationFrame(update);
        };

        rafId.current = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(rafId.current);
            if (idleTimer.current) clearTimeout(idleTimer.current);
        };
    }, []);

    return (
        <ScrollEngineContext.Provider value={storeRef.current}>
            {children}
        </ScrollEngineContext.Provider>
    );
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Full scroll state (triggers re-render on every scroll frame — use sparingly) */
export function useScrollEngine(): ScrollState {
    const store = useContext(ScrollEngineContext);
    if (!store) {
        // Fallback when outside provider (e.g., admin pages)
        return {
            scrollY: 0, progress: 0, velocity: 0, speed: 0,
            direction: 0, isScrolling: false, viewportHeight: 0, documentHeight: 0,
        };
    }

    return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Select specific slice of scroll state */
export function useScrollValue<T>(selector: (state: ScrollState) => T): T {
    const store = useContext(ScrollEngineContext);
    if (!store) return selector({
        scrollY: 0, progress: 0, velocity: 0, speed: 0,
        direction: 0, isScrolling: false, viewportHeight: 0, documentHeight: 0,
    });

    return useSyncExternalStore(
        store.subscribe,
        () => selector(store.getState()),
        () => selector(store.getState())
    );
}

/** Imperative access to scroll state (no re-render) */
export function useScrollRef() {
    const store = useContext(ScrollEngineContext);
    return useCallback(() => {
        return store?.getState() ?? {
            scrollY: 0, progress: 0, velocity: 0, speed: 0,
            direction: 0, isScrolling: false, viewportHeight: 0, documentHeight: 0,
        };
    }, [store]);
}
