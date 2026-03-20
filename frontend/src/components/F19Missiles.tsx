import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Missile } from '../hooks/useF19FlightSimulatorGame';

function MissileObject({ missile }: { missile: Missile }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(missile.position[0], missile.position[1], missile.position[2]);

    const vx = missile.velocity[0];
    const vy = missile.velocity[1];
    const vz = missile.velocity[2];
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed > 0.1) {
      const dir = new THREE.Vector3(vx / speed, vy / speed, vz / speed);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      groupRef.current.quaternion.copy(quaternion);
    }
  });

  const bodyColor = missile.isHoming ? '#ffcc00' : missile.isEnemy ? '#ff00aa' : '#cc2200';
  const glowColor = missile.isHoming ? '#ffaa00' : missile.isEnemy ? '#ff00aa' : '#ff4400';

  return (
    <group ref={groupRef}>
      {/* Missile body */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 1.8, 8]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.15, 0.5, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Fins */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <mesh key={i} position={[Math.sin(rot) * 0.2, -0.7, Math.cos(rot) * 0.2]} rotation={[0, rot, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.3]} />
          <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}
      {/* Exhaust glow */}
      <mesh position={[0, -1.0, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={3}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight color={glowColor} intensity={3} distance={12} />
    </group>
  );
}

export function F19MissilesRenderer({ missiles }: { missiles: Missile[] }) {
  return (
    <>
      {missiles.map(missile => (
        <MissileObject key={missile.id} missile={missile} />
      ))}
    </>
  );
}
