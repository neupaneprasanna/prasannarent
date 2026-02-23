/**
 * RentVerse Motion System — Barrel Export
 * 
 * The complete cinematic interaction system:
 * - Scroll Engine: velocity, direction, progress tracking
 * - Cursor Light: radial glow following cursor with interactive detection
 * - Dimensional Reveal: cinematic section entry with Z-push
 * - Holographic Card: 3D tilt, cursor light, idle float
 * - Liquid Button: physics-driven buttons with ripple & sweep
 * - Page Transition: dimension-shift route transitions
 * - Microinteractions: text reveal, count-up, breathing badges
 * - Motion Tokens: spring presets, variants, hover/tap configs
 */

// Engine providers
export { ScrollEngineProvider, useScrollEngine, useScrollValue, useScrollRef } from './scroll-engine';
export { CursorLightProvider, useCursorLight, useCursorLightRef } from './cursor-light';

// Tokens
export { SPRINGS, TRANSITIONS, VARIANTS, HOVER, TAP, STAGGER } from '@/lib/design/motion-tokens';
