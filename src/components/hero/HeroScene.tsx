'use client';

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment, Sphere, Preload } from '@react-three/drei';
import * as THREE from 'three';

function FloatingObject({ position, color, speed, distort }: {
    position: [number, number, number];
    color: string;
    speed: number;
    distort: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);

    const targetPosition = useMemo(() => new THREE.Vector3(...position), [position]);
    const currentPosition = useRef(new THREE.Vector3(...position));

    const mouseVec = new THREE.Vector3();

    useFrame((state) => {
        if (!meshRef.current) return;

        // Basic floating animation
        const time = state.clock.elapsedTime;
        meshRef.current.rotation.x = Math.sin(time * speed * 0.3) * 0.2;
        meshRef.current.rotation.y = Math.cos(time * speed * 0.2) * 0.3;

        // Mouse interaction
        mouseVec.set(
            (state.mouse.x * state.viewport.width) / 2,
            (state.mouse.y * state.viewport.height) / 2,
            0
        );

        const dist = currentPosition.current.distanceTo(mouseVec);
        const repulsionRadius = 3;
        const force = Math.max(0, repulsionRadius - dist) * 0.4;

        const direction = new THREE.Vector3().subVectors(currentPosition.current, mouseVec).normalize();
        const repulsion = direction.multiplyScalar(force);

        const finalTarget = targetPosition.clone().add(repulsion);
        currentPosition.current.lerp(finalTarget, 0.08);
        meshRef.current.position.copy(currentPosition.current);
    });

    return (
        <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.8}>
            <mesh ref={meshRef} position={position}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color={color}
                    roughness={0.2}
                    metalness={0.8}
                    distort={distort}
                    speed={2}
                    transparent
                    opacity={0.7}
                />
            </mesh>
        </Float>
    );
}

function ParticleField() {
    const count = 200;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return pos;
    }, []);

    const ref = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.y = state.clock.elapsedTime * 0.02;
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#6c5ce7"
                sizeAttenuation
                transparent
                opacity={0.6}
            />
        </points>
    );
}

function AmbientSphere() {
    const ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!ref.current) return;
        ref.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        ref.current.scale.y = 1 + Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
    });

    return (
        <Sphere ref={ref} args={[3, 64, 64]} position={[0, 0, -5]}>
            <MeshDistortMaterial
                color="#1a1a2e"
                roughness={1}
                metalness={0}
                distort={0.3}
                speed={1.5}
                transparent
                opacity={0.5}
            />
        </Sphere>
    );
}

export default function HeroScene() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
            >
                <color attach="background" args={['#050508']} />
                <fog attach="fog" args={['#050508', 5, 25]} />

                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} color="#6c5ce7" />
                    <directionalLight position={[-5, 3, 2]} intensity={0.8} color="#fd79a8" />
                    <pointLight position={[0, -3, 3]} intensity={1} color="#a29bfe" />

                    {/* Floating objects */}
                    <FloatingObject position={[-3.5, 1.5, -2]} color="#6c5ce7" speed={1.5} distort={0.2} />
                    <FloatingObject position={[3, -1, -1]} color="#a29bfe" speed={2} distort={0.25} />
                    <FloatingObject position={[-1.5, -2, 0]} color="#fd79a8" speed={1.2} distort={0.15} />
                    <FloatingObject position={[2.5, 2, -3]} color="#00cec9" speed={1.8} distort={0.22} />
                    <FloatingObject position={[0, 3, -4]} color="#fdcb6e" speed={1} distort={0.18} />

                    {/* Background sphere */}
                    <AmbientSphere />

                    {/* Particles */}
                    <ParticleField />

                    <Environment preset="night" />
                </Suspense>

                <Preload all />
            </Canvas>
        </div>
    );
}
