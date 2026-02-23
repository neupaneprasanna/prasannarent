'use client';

import dynamic from 'next/dynamic';

// Lazy load heavy canvas components
const NebulaShader = dynamic(() => import('@/components/background/NebulaShader'), {
    ssr: false,
});
const ParticleField = dynamic(() => import('@/components/background/ParticleField'), {
    ssr: false,
});

export default function PremiumBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* CSS fallback gradient — behind everything, visible briefly before canvas loads */}
            <div
                className="fixed inset-0"
                style={{
                    zIndex: -1,
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(122,92,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,240,255,0.05) 0%, transparent 50%), #050608',
                }}
            />

            {/* Plane 0 — Nebula procedural background (z-index: 0 inline) */}
            <NebulaShader />

            {/* Plane 1 — Particle dust field (z-index: 1 inline) */}
            <ParticleField count={250} />

            {/* Geometric mesh pattern at 3% opacity — above canvases */}
            <div
                className="fixed inset-0 opacity-[0.03]"
                style={{
                    zIndex: 2,
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
          `,
                    backgroundSize: '200px 200px',
                }}
            />
        </div>
    );
}
