import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Flare } from '../hooks/useF19FlightSimulatorGame';

function FlareObject({ flare }: { flare: Flare }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const now = Date.now();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(flare.position[0], flare.position[1], flare.position[2]);

    if (meshRef.current) {
      const elapsed = Date.now() - flare.firedAt;
      const lifeFraction = Math.max(0, 1 - elapsed / flare.lifetime);
      const pulse = 0.5 + Math.sin(performance.now() * 0.02) * 0.5;
      const intensity = lifeFraction * pulse;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity * 4;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0.2, lifeFraction);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core bright sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffee88"
          emissiveIntensity={4}
          transparent
          opacity={1}
        />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={2}
          transparent
          opacity={0.4}
        />
      </mesh>
      <pointLight color="#ffdd44" intensity={8} distance={30} />
    </group>
  );
}

export function F19FlaresRenderer({ flares }: { flares: Flare[] }) {
  return (
    <>
      {flares.map(flare => (
        <FlareObject key={flare.id} flare={flare} />
      ))}
    </>
  );
}
