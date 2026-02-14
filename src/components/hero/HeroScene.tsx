'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import ModelViewer from './ModelViewer';
import MouseLight from './MouseLight';

export default function HeroScene() {
    return (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

                    {/* Environment & Lighting */}
                    <color attach="background" args={['#030304']} />
                    <fog attach="fog" args={['#030304', 5, 20]} />
                    <ambientLight intensity={0.2} />
                    <Environment preset="city" />

                    {/* Interactive Elements */}
                    <MouseLight />
                    <ModelViewer />

                    {/* Background Elements */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                </Suspense>
            </Canvas>

            {/* Vignette Overlay for cinematic focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        </div>
    );
}
