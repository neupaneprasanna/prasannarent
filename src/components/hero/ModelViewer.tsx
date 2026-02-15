'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export default function ModelViewer() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={[0, 0, 0]}>
                <icosahedronGeometry args={[2, 0]} />
                <meshStandardMaterial
                    color="#6c5ce7"
                    wireframe
                    emissive="#6c5ce7"
                    emissiveIntensity={0.5}
                />
            </mesh>
            <mesh scale={[1.9, 1.9, 1.9]}>
                <icosahedronGeometry args={[2, 0]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
        </Float>
    );
}
