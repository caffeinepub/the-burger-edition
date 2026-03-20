import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, RUNWAY_X, RUNWAY_Z, RUNWAY_LENGTH, RUNWAY_WIDTH, WORLD_SIZE } from '../hooks/useF19FlightSimulatorGame';

const TERRAIN_SEGMENTS = 128;
const TERRAIN_SIZE = 4000;

interface RunwayMark {
  x: number;
  z: number;
  w: number;
  d: number;
}

export default function F19Terrain() {
  // ── Procedural terrain geometry ──
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position as THREE.BufferAttribute;
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const h = getTerrainHeight(x, z);
      positions.setY(i, Math.max(0, h));
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  // ── Runway markings ──
  const runwayMarkings = useMemo(() => {
    const marks: RunwayMark[] = [];
    const stripeCount = 12;
    const stripeLength = 8;
    const stripeWidth = 2;
    const stripeSpacing = RUNWAY_LENGTH / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      const z = RUNWAY_Z + RUNWAY_LENGTH / 2 - i * stripeSpacing - stripeSpacing / 2;
      marks.push({ x: RUNWAY_X, z, w: stripeWidth, d: stripeLength });
    }
    return marks;
  }, []);

  return (
    <>
      {/* ── Ocean floor (large blue plane) ── */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#1a5f7a" roughness={0.1} metalness={0.3} />
      </mesh>

      {/* ── Terrain mesh ── */}
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial
          color="#3a5f2a"
          roughness={0.9}
          metalness={0.0}
          vertexColors={false}
        />
      </mesh>

      {/* ── Airport runway ── */}
      <mesh position={[RUNWAY_X, 0.15, RUNWAY_Z]} receiveShadow>
        <boxGeometry args={[RUNWAY_WIDTH, 0.3, RUNWAY_LENGTH]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>

      {/* Runway center line */}
      <mesh position={[RUNWAY_X, 0.32, RUNWAY_Z]}>
        <boxGeometry args={[0.8, 0.05, RUNWAY_LENGTH - 10]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>

      {/* Runway threshold markings */}
      {runwayMarkings.map((m, i) => (
        <mesh key={i} position={[m.x, 0.32, m.z]}>
          <boxGeometry args={[m.w, 0.05, m.d]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}

      {/* Runway edge lights */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = RUNWAY_Z - RUNWAY_LENGTH / 2 + (i + 0.5) * (RUNWAY_LENGTH / 10);
        return (
          <group key={`light-${i}`}>
            <pointLight position={[RUNWAY_X - RUNWAY_WIDTH / 2 - 1, 1, z]} color="#ffffff" intensity={0.8} distance={15} />
            <pointLight position={[RUNWAY_X + RUNWAY_WIDTH / 2 + 1, 1, z]} color="#ffffff" intensity={0.8} distance={15} />
          </group>
        );
      })}

      {/* Runway threshold lights (red/green) */}
      <pointLight position={[RUNWAY_X, 1, RUNWAY_Z - RUNWAY_LENGTH / 2]} color="#00ff00" intensity={3} distance={30} />
      <pointLight position={[RUNWAY_X, 1, RUNWAY_Z + RUNWAY_LENGTH / 2]} color="#ff0000" intensity={3} distance={30} />

      {/* ── Airport buildings ── */}
      {/* Control tower */}
      <mesh position={[RUNWAY_X + 60, 15, RUNWAY_Z - 50]} castShadow>
        <boxGeometry args={[8, 30, 8]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.7} />
      </mesh>
      <mesh position={[RUNWAY_X + 60, 32, RUNWAY_Z - 50]} castShadow>
        <boxGeometry args={[12, 4, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} />
      </mesh>
      {/* Tower light */}
      <pointLight position={[RUNWAY_X + 60, 36, RUNWAY_Z - 50]} color="#ff4400" intensity={3} distance={40} />

      {/* Hangar 1 */}
      <mesh position={[RUNWAY_X + 80, 8, RUNWAY_Z + 30]} castShadow>
        <boxGeometry args={[40, 16, 25]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.8} />
      </mesh>
      {/* Hangar 2 */}
      <mesh position={[RUNWAY_X + 80, 8, RUNWAY_Z + 70]} castShadow>
        <boxGeometry args={[40, 16, 25]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>

      {/* ── Taxiway ── */}
      <mesh position={[RUNWAY_X + 40, 0.12, RUNWAY_Z]} receiveShadow>
        <boxGeometry args={[80, 0.25, 12]} />
        <meshStandardMaterial color="#222222" roughness={0.95} />
      </mesh>
    </>
  );
}
