import { useRef } from 'react';
import * as THREE from 'three';

interface F19AircraftProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export default function F19Aircraft({ position = [0, 0, 0], rotation = [0, 0, 0] }: F19AircraftProps) {
  const groupRef = useRef<THREE.Group>(null);

  const bodyColor = '#3a3a3a';
  const darkGrey = '#2a2a2a';
  const accentGrey = '#4a4a4a';
  const exhaustColor = '#ff6600';

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* ── Main fuselage (elongated box for stealth shape) ── */}
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.7, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Nose cone (tapered) */}
      <mesh position={[0, -0.05, -5]} castShadow>
        <coneGeometry args={[0.5, 3, 4]} />
        <meshStandardMaterial color={darkGrey} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* ── Main delta wings ── */}
      {/* Left wing */}
      <mesh position={[-3.5, -0.1, 1]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[5, 0.18, 4.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Right wing */}
      <mesh position={[3.5, -0.1, 1]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[5, 0.18, 4.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Wing leading edge sweep (left) */}
      <mesh position={[-2.5, -0.1, -1.5]} rotation={[0, 0.4, 0.05]} castShadow>
        <boxGeometry args={[3, 0.15, 2]} />
        <meshStandardMaterial color={darkGrey} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Wing leading edge sweep (right) */}
      <mesh position={[2.5, -0.1, -1.5]} rotation={[0, -0.4, -0.05]} castShadow>
        <boxGeometry args={[3, 0.15, 2]} />
        <meshStandardMaterial color={darkGrey} roughness={0.25} metalness={0.8} />
      </mesh>

      {/* ── Tail fins (V-tail for stealth) ── */}
      {/* Left V-tail */}
      <mesh position={[-1.2, 0.6, 3.2]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.15, 2.2, 2.0]} />
        <meshStandardMaterial color={accentGrey} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Right V-tail */}
      <mesh position={[1.2, 0.6, 3.2]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.15, 2.2, 2.0]} />
        <meshStandardMaterial color={accentGrey} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ── Canopy ── */}
      <mesh position={[0, 0.55, -1.5]} castShadow>
        <boxGeometry args={[0.9, 0.5, 2.2]} />
        <meshStandardMaterial color="#1a3a5c" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
      </mesh>

      {/* ── Engine exhausts ── */}
      <mesh position={[-0.5, 0, 4.2]}>
        <cylinderGeometry args={[0.35, 0.45, 0.8, 12]} />
        <meshStandardMaterial color={darkGrey} roughness={0.4} metalness={0.9} />
      </mesh>
      <mesh position={[0.5, 0, 4.2]}>
        <cylinderGeometry args={[0.35, 0.45, 0.8, 12]} />
        <meshStandardMaterial color={darkGrey} roughness={0.4} metalness={0.9} />
      </mesh>

      {/* Exhaust glow */}
      <mesh position={[-0.5, 0, 4.7]}>
        <cylinderGeometry args={[0.2, 0.35, 0.5, 10]} />
        <meshStandardMaterial color={exhaustColor} emissive={exhaustColor} emissiveIntensity={1.5} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.5, 0, 4.7]}>
        <cylinderGeometry args={[0.2, 0.35, 0.5, 10]} />
        <meshStandardMaterial color={exhaustColor} emissive={exhaustColor} emissiveIntensity={1.5} transparent opacity={0.7} />
      </mesh>

      {/* Engine glow lights */}
      <pointLight position={[-0.5, 0, 5]} color={exhaustColor} intensity={2} distance={8} />
      <pointLight position={[0.5, 0, 5]} color={exhaustColor} intensity={2} distance={8} />

      {/* ── Air intakes ── */}
      <mesh position={[-0.9, -0.2, -0.5]} castShadow>
        <boxGeometry args={[0.5, 0.4, 2.5]} />
        <meshStandardMaterial color={darkGrey} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.9, -0.2, -0.5]} castShadow>
        <boxGeometry args={[0.5, 0.4, 2.5]} />
        <meshStandardMaterial color={darkGrey} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* ── Navigation lights ── */}
      {/* Red left wingtip */}
      <pointLight position={[-6, 0, 1]} color="#ff0000" intensity={1.5} distance={6} />
      {/* Green right wingtip */}
      <pointLight position={[6, 0, 1]} color="#00ff00" intensity={1.5} distance={6} />
      {/* White tail */}
      <pointLight position={[0, 0.5, 4.5]} color="#ffffff" intensity={1} distance={5} />
    </group>
  );
}
