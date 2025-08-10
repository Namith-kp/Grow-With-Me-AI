import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

const Globe = () => {
    const globeRef = useRef();

    useFrame(() => {
        if (globeRef.current) {
            // @ts-ignore
            globeRef.current.rotation.y += 0.001;
        }
    });

    return (
        <Sphere ref={globeRef} args={[1, 100, 200]} scale={2.5}>
            <MeshDistortMaterial
                color="#800080"
                attach="material"
                distort={0.5}
                speed={1.5}
                roughness={0.5}
            />
        </Sphere>
    );
};

export default Globe;
