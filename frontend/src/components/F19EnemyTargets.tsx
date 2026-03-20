import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Enemy } from '../hooks/useF19FlightSimulatorGame';

interface F19EnemyTargetsProps {
  enemies: Enemy[];
  lockedTargetId: string | null;
}

// ── Individual enemy meshes ──────────────────────────────────────────────────

function GroundInstallation({ enemy }: { enemy: Enemy }) {
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 1, 4]} />
        <meshStandardMaterial color="#4a4a2a" />
      </mesh>
      {/* Radar dish */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 8]} />
        <meshStandardMaterial color="#666633" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 6]} />
        <meshStandardMaterial color="#888844" />
      </mesh>
    </group>
  );
}

function AirPatrolEnemy({ enemy }: { enemy: Enemy }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5;
  });
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.5, 4, 6]} />
        <meshStandardMaterial color="#cc4400" emissive="#441100" />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.3, 6, 1]} />
        <meshStandardMaterial color="#aa3300" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.2, 2, 0.8]} />
        <meshStandardMaterial color="#aa3300" />
      </mesh>
    </group>
  );
}

function FastJetEnemy({ enemy }: { enemy: Enemy }) {
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Sleek elongated fuselage */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.4, 6, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff2200" emissiveIntensity={0.3} />
      </mesh>
      {/* Swept delta wings */}
      <mesh position={[0, 0, 0.5]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
        <boxGeometry args={[0.15, 5, 1.5]} />
        <meshStandardMaterial color="#dd4400" />
      </mesh>
      <mesh position={[0, 0, -0.5]} rotation={[0, -Math.PI / 4, Math.PI / 2]}>
        <boxGeometry args={[0.15, 5, 1.5]} />
        <meshStandardMaterial color="#dd4400" />
      </mesh>
      {/* Engine glow */}
      <pointLight position={[0, -3, 0]} color="#ff4400" intensity={2} distance={8} />
    </group>
  );
}

function ArmoredEnemy({ enemy }: { enemy: Enemy }) {
  const hpPercent = enemy.health / enemy.maxHealth;
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Bulky main body */}
      <mesh>
        <boxGeometry args={[3, 2, 5]} />
        <meshStandardMaterial color="#556655" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Armor plating sides */}
      <mesh position={[1.8, 0, 0]}>
        <boxGeometry args={[0.5, 1.5, 4]} />
        <meshStandardMaterial color="#445544" metalness={0.9} />
      </mesh>
      <mesh position={[-1.8, 0, 0]}>
        <boxGeometry args={[0.5, 1.5, 4]} />
        <meshStandardMaterial color="#445544" metalness={0.9} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.4, 7, 2]} />
        <meshStandardMaterial color="#334433" />
      </mesh>
      {/* Health bar */}
      <group position={[0, 4, 0]}>
        {/* Background */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4, 0.4, 0.1]} />
          <meshStandardMaterial color="#330000" />
        </mesh>
        {/* HP fill */}
        <mesh position={[(hpPercent - 1) * 2, 0, 0.05]}>
          <boxGeometry args={[4 * hpPercent, 0.35, 0.1]} />
          <meshStandardMaterial
            color={hpPercent > 0.5 ? '#00ff41' : hpPercent > 0.25 ? '#ffaa00' : '#ff2222'}
            emissive={hpPercent > 0.5 ? '#00aa22' : hpPercent > 0.25 ? '#aa6600' : '#aa0000'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}

function MissileDroneEnemy({ enemy }: { enemy: Enemy }) {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * 8;
  });
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Central body */}
      <mesh>
        <boxGeometry args={[1.5, 0.6, 1.5]} />
        <meshStandardMaterial color="#222244" emissive="#111133" />
      </mesh>
      {/* Rotors */}
      <group ref={rotorRef}>
        {[[-1.5, 0.4, -1.5], [1.5, 0.4, -1.5], [-1.5, 0.4, 1.5], [1.5, 0.4, 1.5]].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.1, 0.3, 6]} />
              <meshStandardMaterial color="#444466" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[1.2, 0.05, 0.2]} />
              <meshStandardMaterial color="#6666aa" />
            </mesh>
          </group>
        ))}
      </group>
      {/* Missile pods */}
      <mesh position={[0.8, -0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#441100" />
      </mesh>
      <mesh position={[-0.8, -0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.2, 6]} />
        <meshStandardMaterial color="#ff4400" emissive="#441100" />
      </mesh>
      {/* Glow */}
      <pointLight position={[0, 0, 0]} color="#4444ff" intensity={1.5} distance={10} />
    </group>
  );
}

function GroundTurretEnemy({ enemy }: { enemy: Enemy }) {
  const barrelRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (barrelRef.current) barrelRef.current.rotation.y += delta * 1.5;
  });
  return (
    <group position={enemy.position} rotation={enemy.rotation}>
      {/* Base cylinder */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2.5, 1.5, 8]} />
        <meshStandardMaterial color="#556644" metalness={0.7} />
      </mesh>
      {/* Rotating turret */}
      <group ref={barrelRef} position={[0, 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[1, 1, 0.8, 8]} />
          <meshStandardMaterial color="#445533" metalness={0.8} />
        </mesh>
        {/* Gun barrel */}
        <mesh position={[0, 0.5, 1.2]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 2.5, 6]} />
          <meshStandardMaterial color="#333322" metalness={0.9} />
        </mesh>
      </group>
      {/* Health bar */}
      {enemy.health < enemy.maxHealth && (
        <group position={[0, 4, 0]}>
          <mesh>
            <boxGeometry args={[3, 0.3, 0.1]} />
            <meshStandardMaterial color="#330000" />
          </mesh>
          <mesh position={[((enemy.health / enemy.maxHealth) - 1) * 1.5, 0, 0.05]}>
            <boxGeometry args={[3 * (enemy.health / enemy.maxHealth), 0.25, 0.1]} />
            <meshStandardMaterial color="#ff6600" emissive="#aa3300" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function ExplosionEffect({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.addScalar(delta * 3);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 1.5);
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[2, 8, 8]} />
      <meshStandardMaterial
        color="#ff6600"
        emissive="#ff2200"
        emissiveIntensity={2}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function F19EnemyTargets({ enemies, lockedTargetId }: F19EnemyTargetsProps) {
  return (
    <group>
      {enemies.map(enemy => {
        if (enemy.destroyed) {
          return <ExplosionEffect key={`exp_${enemy.id}`} position={enemy.position} />;
        }

        const isLocked = enemy.id === lockedTargetId;

        return (
          <group key={enemy.id}>
            {/* Lock-on indicator */}
            {isLocked && (
              <mesh position={enemy.position}>
                <ringGeometry args={[6, 7, 16]} />
                <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={2} transparent opacity={0.8} />
              </mesh>
            )}

            {/* Enemy mesh by type */}
            {enemy.type === 'ground' && <GroundInstallation enemy={enemy} />}
            {enemy.type === 'airPatrol' && <AirPatrolEnemy enemy={enemy} />}
            {enemy.type === 'fastJet' && <FastJetEnemy enemy={enemy} />}
            {enemy.type === 'armoredEnemy' && <ArmoredEnemy enemy={enemy} />}
            {enemy.type === 'missileDrone' && <MissileDroneEnemy enemy={enemy} />}
            {enemy.type === 'groundTurret' && <GroundTurretEnemy enemy={enemy} />}
          </group>
        );
      })}
    </group>
  );
}
