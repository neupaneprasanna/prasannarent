'use client';

import { Float, MeshTransmissionMaterial, Stage } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function ModelViewer() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={0.5}
            floatingRange={[-0.1, 0.1]}
        >
            {/* Placeholder Premium Object until GLB is loaded */}
            <mesh ref={meshRef} scale={1.2}>
                <torusKnotGeometry args={[1, 0.3, 128, 32]} />
                <MeshTransmissionMaterial
                    backside
                    backsideThickness={5}
                    thickness={0.5}
                    roughness={0}
                    chromaticAberration={0.06}
                    anisotropy={0.5}
                    color="#ececf3"
                    resolution={1024}
                    distortion={0.5}
                    distortionScale={1}
                    temporalDistortion={0.2}
                />
            </mesh>

            {/* Inner glowing core for "Energy" feel */}
            <mesh scale={0.5}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color="#6c5ce7"
                    emissive="#6c5ce7"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>
        </Float>
    );
}
