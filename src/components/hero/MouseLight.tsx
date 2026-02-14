'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function MouseLight() {
    const light = useRef<THREE.SpotLight>(null);
    const { viewport, mouse } = useThree();

    useFrame((state) => {
        if (!light.current) return;

        // Move light based on mouse position
        // Map mouse (-1 to 1) to viewport coordinates
        const x = (state.mouse.x * viewport.width) / 2;
        const y = (state.mouse.y * viewport.height) / 2;

        // Smoothly interpolate current light position to target
        light.current.position.x = THREE.MathUtils.lerp(light.current.position.x, x, 0.1);
        light.current.position.y = THREE.MathUtils.lerp(light.current.position.y, y, 0.1);

        // Make the light look at the center
        light.current.target.position.set(0, 0, 0);
        light.current.target.updateMatrixWorld();
    });

    return (
        <spotLight
            ref={light}
            position={[0, 0, 5]}
            intensity={40}
            angle={0.5}
            penumbra={1}
            castShadow
            distance={20}
            color="#a29bfe"
        />
    );
}
