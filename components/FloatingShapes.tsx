import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Shape = ({ geometry, material, position }) => {
    const ref = useRef();
    const [speed, factor] = useMemo(() => [(Math.random() + 1) * 0.1, 0.5 + Math.random() * 0.5], []);

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.getElapsedTime();
            ref.current.rotation.x += 0.001 * speed;
            ref.current.rotation.y += 0.0015 * speed;
            ref.current.position.y = position[1] + Math.sin(time * factor) * 0.5;
        }
    });

    return (
        <mesh ref={ref} position={position} geometry={geometry} material={material} />
    );
};

const FloatingShapes = () => {
    const shapes = useMemo(() => {
        const geometries = [
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.SphereGeometry(0.2, 32, 32),
            new THREE.TorusGeometry(0.2, 0.08, 16, 100),
            new THREE.ConeGeometry(0.2, 0.4, 32),
            new THREE.IcosahedronGeometry(0.3, 0),
        ];

        const material = new THREE.MeshStandardMaterial({ color: '#a855f7', roughness: 0.4, metalness: 0.6 });

        return Array.from({ length: 15 }).map((_, i) => {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const position = [
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 10,
            ];
            return { id: i, geometry, material, position };
        });
    }, []);

    return (
        <>
            {shapes.map(shape => (
                <Shape key={shape.id} {...shape} />
            ))}
        </>
    );
};

export default FloatingShapes;
