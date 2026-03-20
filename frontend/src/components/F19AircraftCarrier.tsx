import React from 'react';

interface F19AircraftCarrierProps {
  protectHP?: number;
  maxProtectHP?: number;
  showHealthBar?: boolean;
}

export default function F19AircraftCarrier({
  protectHP = 100,
  maxProtectHP = 100,
  showHealthBar = false,
}: F19AircraftCarrierProps) {
  const hpPercent = maxProtectHP > 0 ? protectHP / maxProtectHP : 1;

  return (
    <group position={[150, 0, 150]}>
      {/* Hull */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[20, 2, 80]} />
        <meshStandardMaterial color="#556677" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Flight deck */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[22, 0.2, 82]} />
        <meshStandardMaterial color="#445566" />
      </mesh>

      {/* Runway stripe */}
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[1.5, 0.05, 70]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Catapult tracks */}
      {[-4, 4].map((x, i) => (
        <mesh key={i} position={[x, 2.25, -20]}>
          <boxGeometry args={[0.3, 0.05, 40]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}

      {/* Island superstructure */}
      <mesh position={[8, 5, -10]}>
        <boxGeometry args={[5, 8, 15]} />
        <meshStandardMaterial color="#445566" />
      </mesh>

      {/* Bridge windows */}
      {[-2, 0, 2].map((z, i) => (
        <mesh key={i} position={[10.6, 6, z - 10]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color="#88aacc" emissive="#224466" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Radar mast */}
      <mesh position={[8, 10, -10]}>
        <cylinderGeometry args={[0.2, 0.2, 4, 6]} />
        <meshStandardMaterial color="#334455" />
      </mesh>
      <mesh position={[8, 12.5, -10]}>
        <boxGeometry args={[3, 0.3, 1]} />
        <meshStandardMaterial color="#445566" />
      </mesh>

      {/* Deck lighting */}
      {[-30, -10, 10, 30].map((z, i) => (
        <pointLight key={i} position={[0, 3, z]} color="#ffffff" intensity={0.3} distance={20} />
      ))}

      {/* Approach lights */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x * 3, 2.3, 38]}>
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* Health bar (protect objective mode) */}
      {showHealthBar && (
        <group position={[0, 18, 0]}>
          {/* Background */}
          <mesh>
            <boxGeometry args={[24, 1.2, 0.2]} />
            <meshStandardMaterial color="#220000" />
          </mesh>
          {/* HP fill */}
          <mesh position={[(hpPercent - 1) * 12, 0, 0.15]}>
            <boxGeometry args={[24 * hpPercent, 1.0, 0.2]} />
            <meshStandardMaterial
              color={hpPercent > 0.5 ? '#00ff41' : hpPercent > 0.25 ? '#ffaa00' : '#ff2222'}
              emissive={hpPercent > 0.5 ? '#00aa22' : hpPercent > 0.25 ? '#aa6600' : '#aa0000'}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
