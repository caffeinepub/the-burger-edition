import { useRef, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Zap } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useRocketSoccerDerbyGame,
  FIELD_W, FIELD_H, GOAL_W, GOAL_DEPTH, GOAL_HEIGHT,
  WALL_H, BALL_RADIUS, CAR_W, CAR_H, CAR_D, BOOST_MAX,
} from '../hooks/useRocketSoccerDerbyGame';

// ─── Goal Frame ───────────────────────────────────────────────────────────────
function GoalFrame({ posZ, color }: { posZ: number; color: string }) {
  const sign = posZ > 0 ? 1 : -1;
  return (
    <group>
      {/* Net back */}
      <mesh position={[0, GOAL_HEIGHT / 2, posZ + sign * GOAL_DEPTH * 0.6]}>
        <boxGeometry args={[GOAL_W, GOAL_HEIGHT, 0.3]} />
        <meshStandardMaterial color="#050510" emissive={color} emissiveIntensity={0.15} transparent opacity={0.45} />
      </mesh>
      {/* Left post */}
      <mesh position={[-GOAL_W / 2, GOAL_HEIGHT / 2, posZ]}>
        <boxGeometry args={[0.8, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111122" emissive={color} emissiveIntensity={1.0} />
      </mesh>
      {/* Right post */}
      <mesh position={[GOAL_W / 2, GOAL_HEIGHT / 2, posZ]}>
        <boxGeometry args={[0.8, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111122" emissive={color} emissiveIntensity={1.0} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, GOAL_HEIGHT, posZ]}>
        <boxGeometry args={[GOAL_W + 0.8, 0.8, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111122" emissive={color} emissiveIntensity={1.0} />
      </mesh>
      {/* Goal glow light */}
      <pointLight position={[0, GOAL_HEIGHT / 2, posZ + sign * 2]} color={color} intensity={2} distance={35} />
    </group>
  );
}

// ─── Field markings ───────────────────────────────────────────────────────────
function FieldMarkings() {
  const hw = FIELD_W / 2;
  const hd = FIELD_H / 2;
  const Y = 0.22;

  // Center circle segments
  const circleSegs = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * Math.PI * 2;
    const r = 28;
    return (
      <mesh key={`cc-${i}`} position={[Math.cos(angle) * r, Y, Math.sin(angle) * r]}>
        <boxGeometry args={[1.2, 0.05, 1.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
    );
  });

  // Penalty arc segments (both ends)
  const penaltyArcs = [-1, 1].flatMap((side) =>
    Array.from({ length: 32 }, (_, i) => {
      const angle = (i / 32) * Math.PI;
      const r = 18;
      const cx = Math.cos(angle) * r;
      const cz = side * (hd - 30) + Math.sin(angle) * r * side;
      return (
        <mesh key={`pa-${side}-${i}`} position={[cx, Y, cz]}>
          <boxGeometry args={[0.8, 0.05, 0.8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
      );
    })
  );

  return (
    <>
      {/* Center line */}
      <mesh position={[0, Y, 0]}>
        <boxGeometry args={[FIELD_W, 0.05, 0.7]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Center spot */}
      <mesh position={[0, Y, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.05, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>

      {/* Center circle */}
      {circleSegs}

      {/* Penalty boxes */}
      {[-1, 1].map((side) => (
        <group key={`pb-${side}`}>
          {/* Penalty box lines */}
          <mesh position={[0, Y, side * (hd - 22)]}>
            <boxGeometry args={[GOAL_W + 30, 0.05, 0.6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[-(GOAL_W / 2 + 15), Y, side * (hd - 11)]}>
            <boxGeometry args={[0.6, 0.05, 22]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[(GOAL_W / 2 + 15), Y, side * (hd - 11)]}>
            <boxGeometry args={[0.6, 0.05, 22]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          {/* Goal box */}
          <mesh position={[0, Y, side * (hd - 8)]}>
            <boxGeometry args={[GOAL_W + 10, 0.05, 0.5]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[-(GOAL_W / 2 + 5), Y, side * (hd - 4)]}>
            <boxGeometry args={[0.5, 0.05, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[(GOAL_W / 2 + 5), Y, side * (hd - 4)]}>
            <boxGeometry args={[0.5, 0.05, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}

      {/* Penalty arcs */}
      {penaltyArcs}

      {/* Sideline stripes (alternating grass) */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -hd + (i + 0.5) * (FIELD_H / 10);
        return (
          <mesh key={`stripe-${i}`} position={[0, 0.01, z]}>
            <boxGeometry args={[FIELD_W, 0.02, FIELD_H / 10]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#0d2a0d' : '#0a220a'}
              roughness={0.95}
            />
          </mesh>
        );
      })}

      {/* Corner flags */}
      {[[-hw, hd], [hw, hd], [-hw, -hd], [hw, -hd]].map(([x, z], i) => (
        <group key={`flag-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 6, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.8, 5.5, 0]}>
            <boxGeometry args={[1.6, 1.0, 0.1]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Car mesh ─────────────────────────────────────────────────────────────────
function CarMesh({ isPlayer }: { isPlayer: boolean }) {
  const bodyColor = isPlayer ? '#001a44' : '#3a0a00';
  const emissiveColor = isPlayer ? '#0088ff' : '#ff6600';

  const wheelPositions: [number, number, number][] = [
    [-CAR_W / 2 - 0.3, -CAR_H / 2 + 0.4, CAR_D / 3],
    [CAR_W / 2 + 0.3, -CAR_H / 2 + 0.4, CAR_D / 3],
    [-CAR_W / 2 - 0.3, -CAR_H / 2 + 0.4, -CAR_D / 3],
    [CAR_W / 2 + 0.3, -CAR_H / 2 + 0.4, -CAR_D / 3],
  ];

  return (
    <>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[CAR_W, CAR_H, CAR_D]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.55} roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, CAR_H * 0.65, -CAR_D * 0.08]} castShadow>
        <boxGeometry args={[CAR_W * 0.75, CAR_H * 0.55, CAR_D * 0.55]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.4} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Front bumper */}
      <mesh position={[0, -CAR_H * 0.1, -CAR_D / 2 - 0.3]}>
        <boxGeometry args={[CAR_W * 0.9, CAR_H * 0.4, 0.6]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.8} roughness={0.4} />
      </mesh>
      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 14]} />
          <meshStandardMaterial color="#111111" emissive={emissiveColor} emissiveIntensity={0.2} roughness={0.85} />
        </mesh>
      ))}
      {/* Boost exhaust cone */}
      <mesh position={[0, 0, CAR_D / 2 + 0.5]}>
        <coneGeometry args={[0.5, 1.5, 10]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.7} transparent opacity={0.75} />
      </mesh>
      {/* Roof marker */}
      <mesh position={[0, CAR_H + 0.7, 0]}>
        <boxGeometry args={[2.0, 0.35, 0.15]} />
        <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={1.2} />
      </mesh>
    </>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function DerbyScene({
  getState,
  update,
}: {
  getState: ReturnType<typeof useRocketSoccerDerbyGame>['getState'];
  update: ReturnType<typeof useRocketSoccerDerbyGame>['update'];
}) {
  const { camera } = useThree();
  const ballRef = useRef<THREE.Mesh>(null);
  const playerCarRef = useRef<THREE.Group>(null);
  const aiCarRef = useRef<THREE.Group>(null);
  const playerBoostLightRef = useRef<THREE.PointLight>(null);
  const aiBoostLightRef = useRef<THREE.PointLight>(null);

  const camPos = useRef(new THREE.Vector3(0, 30, 60));
  const camLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    update(delta);
    const s = getState();

    // Ball
    if (ballRef.current) {
      ballRef.current.position.set(s.ball.pos.x, s.ball.pos.y, s.ball.pos.z);
      ballRef.current.rotation.x += s.ball.vel.z * delta * 0.25;
      ballRef.current.rotation.z -= s.ball.vel.x * delta * 0.25;
      const spd = Math.sqrt(s.ball.vel.x ** 2 + s.ball.vel.z ** 2);
      const mat = ballRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + Math.min(spd * 0.015, 0.65);
    }

    // Player car
    if (playerCarRef.current) {
      playerCarRef.current.position.set(s.player.pos.x, s.player.pos.y, s.player.pos.z);
      playerCarRef.current.rotation.y = s.player.rot;
    }
    if (playerBoostLightRef.current) {
      playerBoostLightRef.current.intensity = s.player.boosting ? 12 : 0;
    }

    // AI car
    if (aiCarRef.current) {
      aiCarRef.current.position.set(s.ai.pos.x, s.ai.pos.y, s.ai.pos.z);
      aiCarRef.current.rotation.y = s.ai.rot;
    }
    if (aiBoostLightRef.current) {
      aiBoostLightRef.current.intensity = s.ai.boosting ? 12 : 0;
    }

    // Chase camera
    const px = s.player.pos.x;
    const py = s.player.pos.y;
    const pz = s.player.pos.z;
    const rot = s.player.rot;

    const fwdX = Math.sin(rot);
    const fwdZ = Math.cos(rot);

    const camDist = 28;
    const camHeight = 16;

    const targetCamX = px - fwdX * camDist;
    const targetCamY = py + camHeight;
    const targetCamZ = pz - fwdZ * camDist;

    camPos.current.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.09);
    camera.position.copy(camPos.current);

    const lookAhead = 18;
    const lookX = px + fwdX * lookAhead;
    const lookY = py + 3;
    const lookZ = pz + fwdZ * lookAhead;

    camLook.current.lerp(new THREE.Vector3(lookX, lookY, lookZ), 0.11);
    camera.lookAt(camLook.current);
  });

  const hw = FIELD_W / 2;
  const hd = FIELD_H / 2;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} color="#1a1a3e" />
      <directionalLight
        position={[0, 120, 0]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-camera-left={-hw}
        shadow-camera-right={hw}
        shadow-camera-top={hd}
        shadow-camera-bottom={-hd}
      />
      {/* Stadium floodlights */}
      <pointLight position={[-hw * 0.5, 50, -hd * 0.5]} intensity={3} color="#ffffff" distance={250} />
      <pointLight position={[hw * 0.5, 50, -hd * 0.5]} intensity={3} color="#ffffff" distance={250} />
      <pointLight position={[-hw * 0.5, 50, hd * 0.5]} intensity={3} color="#ffffff" distance={250} />
      <pointLight position={[hw * 0.5, 50, hd * 0.5]} intensity={3} color="#ffffff" distance={250} />
      {/* Accent lights */}
      <pointLight position={[-hw * 0.5, 30, 0]} intensity={2} color="#0088ff" distance={200} />
      <pointLight position={[hw * 0.5, 30, 0]} intensity={2} color="#ff6600" distance={200} />

      {/* ── Field surface ── */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[FIELD_W, 0.4, FIELD_H]} />
        <meshStandardMaterial color="#0a1f0a" roughness={0.92} />
      </mesh>

      {/* Field markings */}
      <FieldMarkings />

      {/* ── Boundary walls ── */}
      {/* Left wall */}
      <mesh position={[-hw - 0.6, WALL_H / 2, 0]}>
        <boxGeometry args={[1.2, WALL_H, FIELD_H]} />
        <meshStandardMaterial color="#0d0d2e" emissive="#0088ff" emissiveIntensity={0.18} transparent opacity={0.8} />
      </mesh>
      {/* Right wall */}
      <mesh position={[hw + 0.6, WALL_H / 2, 0]}>
        <boxGeometry args={[1.2, WALL_H, FIELD_H]} />
        <meshStandardMaterial color="#0d0d2e" emissive="#ff6600" emissiveIntensity={0.18} transparent opacity={0.8} />
      </mesh>
      {/* End walls (with goal openings) */}
      {[-1, 1].map((side) => (
        <group key={`wall-${side}`}>
          <mesh position={[-(hw / 2 + GOAL_W / 4 + 2), WALL_H / 2, side * (hd + 0.6)]}>
            <boxGeometry args={[hw - GOAL_W / 2 - 2, WALL_H, 1.2]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.8} />
          </mesh>
          <mesh position={[(hw / 2 + GOAL_W / 4 + 2), WALL_H / 2, side * (hd + 0.6)]}>
            <boxGeometry args={[hw - GOAL_W / 2 - 2, WALL_H, 1.2]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, GOAL_HEIGHT + 1, side * (hd + 0.6)]}>
            <boxGeometry args={[GOAL_W, 2, 1.2]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── Goals ── */}
      {/* Blue goal (player's goal, positive Z) */}
      <GoalFrame posZ={hd + GOAL_DEPTH / 2} color="#0088ff" />
      {/* Orange goal (AI's goal, negative Z) */}
      <GoalFrame posZ={-(hd + GOAL_DEPTH / 2)} color="#ff6600" />

      {/* ── Ball ── */}
      <mesh ref={ballRef} position={[0, BALL_RADIUS, 0]} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 28, 28]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffee00"
          emissiveIntensity={0.3}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* ── Player car (blue) ── */}
      <group ref={playerCarRef} position={[0, CAR_H / 2, hd - 20]}>
        <CarMesh isPlayer={true} />
        <pointLight
          ref={playerBoostLightRef}
          position={[0, 0, CAR_D / 2 + 1]}
          color="#0088ff"
          intensity={0}
          distance={18}
        />
      </group>

      {/* ── AI car (orange) ── */}
      <group ref={aiCarRef} position={[0, CAR_H / 2, -(hd - 20)]}>
        <CarMesh isPlayer={false} />
        <pointLight
          ref={aiBoostLightRef}
          position={[0, 0, CAR_D / 2 + 1]}
          color="#ff6600"
          intensity={0}
          distance={18}
        />
      </group>

      {/* Stadium pylons */}
      {[[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map((pos, i) => (
        <mesh key={`pylon-${i}`} position={[pos[0], 0, pos[1]]}>
          <boxGeometry args={[3, 55, 3]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#ffffff" emissiveIntensity={0.06} />
        </mesh>
      ))}
      {/* Mid-field pylons */}
      {[[-hw, 0], [hw, 0]].map((pos, i) => (
        <mesh key={`mid-pylon-${i}`} position={[pos[0], 0, pos[1]]}>
          <boxGeometry args={[3, 45, 3]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>
      ))}
    </>
  );
}

// ─── Boost bar ────────────────────────────────────────────────────────────────
function BoostBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = (value / max) * 100;
  const isLow = pct < 25;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-pixel text-[9px] tracking-widest" style={{ color }}>{label}</span>
      <div className="w-24 h-3 bg-black/70 rounded-full border border-white/15 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${pct}%`,
            backgroundColor: isLow ? '#ff3333' : color,
            boxShadow: `0 0 8px ${isLow ? '#ff3333' : color}`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RocketSoccerDerbyGame() {
  const navigate = useNavigate();
  const { update, start, restart, getState, uiState } = useRocketSoccerDerbyGame();
  const [boostDisplay, setBoostDisplay] = useState({ player: BOOST_MAX, ai: BOOST_MAX });

  useEffect(() => {
    const interval = setInterval(() => {
      const s = getState();
      setBoostDisplay({ player: s.player.boost, ai: s.ai.boost });
    }, 80);
    return () => clearInterval(interval);
  }, [getState]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const blueWon = uiState.blueScore > uiState.orangeScore;
  const isDraw = uiState.blueScore === uiState.orangeScore;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-arcade-muted hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-sm sm:text-base text-neon-cyan tracking-widest">
          ROCKET SOCCER DERBY
        </h1>
        <Zap className="w-4 h-4 text-neon-yellow" />
        <span className="font-pixel text-[9px] text-arcade-muted tracking-widest ml-auto hidden sm:block">
          5× FIELD · SPACE = BOOST
        </span>
      </div>

      {/* Game canvas */}
      <div
        className="relative rounded-xl overflow-hidden border-2 border-neon-cyan/40"
        style={{ height: '560px' }}
      >
        <Canvas
          camera={{ fov: 65, near: 0.1, far: 2500, position: [0, 30, 60] }}
          shadows
          style={{ background: '#050510' }}
        >
          <DerbyScene getState={getState} update={update} />
        </Canvas>

        {/* ── HUD overlay ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Score bar */}
          <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-4 pt-3 gap-2">
            {/* Blue score */}
            <div className="flex flex-col items-center bg-black/75 rounded-lg px-4 py-2 border border-blue-500/50">
              <span className="font-pixel text-[9px] text-blue-400 tracking-widest mb-1">YOU</span>
              <span
                className="font-pixel text-3xl"
                style={{ color: '#0088ff', textShadow: '0 0 14px #0088ff' }}
              >
                {uiState.blueScore}
              </span>
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center bg-black/75 rounded-lg px-5 py-2 border border-neon-yellow/40">
              <span className="font-pixel text-[9px] text-arcade-muted tracking-widest mb-1">TIME</span>
              <span
                className="font-pixel text-xl"
                style={{
                  color: uiState.timer <= 30 ? '#ff3333' : '#ffcc00',
                  textShadow: `0 0 10px ${uiState.timer <= 30 ? '#ff3333' : '#ffcc00'}`,
                }}
              >
                {formatTime(uiState.timer)}
              </span>
            </div>

            {/* Orange score */}
            <div className="flex flex-col items-center bg-black/75 rounded-lg px-4 py-2 border border-orange-500/50">
              <span className="font-pixel text-[9px] text-orange-400 tracking-widest mb-1">AI</span>
              <span
                className="font-pixel text-3xl"
                style={{ color: '#ff6600', textShadow: '0 0 14px #ff6600' }}
              >
                {uiState.orangeScore}
              </span>
            </div>
          </div>

          {/* Boost bars */}
          {uiState.phase === 'playing' && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
              <BoostBar value={boostDisplay.player} max={BOOST_MAX} color="#0088ff" label="BOOST" />
            </div>
          )}

          {/* Goal flash */}
          {uiState.lastGoalBy && uiState.phase === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="font-pixel text-4xl sm:text-5xl tracking-widest animate-bounce"
                style={{
                  color: uiState.lastGoalBy === 'blue' ? '#0088ff' : '#ff6600',
                  textShadow: `0 0 30px ${uiState.lastGoalBy === 'blue' ? '#0088ff' : '#ff6600'}`,
                }}
              >
                GOAL!
              </div>
            </div>
          )}
        </div>

        {/* ── Idle overlay ── */}
        {uiState.phase === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="text-center px-6 max-w-md">
              <div className="font-pixel text-4xl mb-2" style={{ color: '#0088ff', textShadow: '0 0 20px #0088ff' }}>
                ⚽🚀
              </div>
              <h2 className="font-pixel text-xl text-neon-cyan tracking-widest mb-2">
                ROCKET SOCCER DERBY
              </h2>
              <p className="font-pixel text-[10px] text-arcade-muted tracking-wider mb-6 leading-relaxed">
                5× MASSIVE FIELD · ROCKET BOOST · SCORE GOALS
              </p>
              <div className="bg-black/60 rounded-lg border border-neon-cyan/30 p-4 mb-6 text-left">
                <p className="font-pixel text-[9px] text-arcade-muted tracking-wider leading-loose">
                  W / ↑ — DRIVE FORWARD<br />
                  S / ↓ — REVERSE<br />
                  A / ← — TURN LEFT<br />
                  D / → — TURN RIGHT<br />
                  <span style={{ color: '#0088ff' }}>SPACE — ROCKET BOOST 🚀</span>
                </p>
              </div>
              <button
                onClick={start}
                className="btn-neon-cyan font-pixel text-sm tracking-widest px-8 py-3"
              >
                KICK OFF!
              </button>
            </div>
          </div>
        )}

        {/* ── Finished overlay ── */}
        {uiState.phase === 'finished' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
            <div className="text-center px-6 max-w-sm">
              <div
                className="font-pixel text-2xl mb-3 tracking-widest"
                style={{
                  color: isDraw ? '#ffcc00' : blueWon ? '#0088ff' : '#ff6600',
                  textShadow: `0 0 20px ${isDraw ? '#ffcc00' : blueWon ? '#0088ff' : '#ff6600'}`,
                }}
              >
                {isDraw ? 'DRAW!' : blueWon ? 'YOU WIN! 🏆' : 'AI WINS!'}
              </div>
              <div className="font-pixel text-4xl mb-6" style={{ color: '#ffffff' }}>
                <span style={{ color: '#0088ff' }}>{uiState.blueScore}</span>
                <span className="text-arcade-muted mx-3">—</span>
                <span style={{ color: '#ff6600' }}>{uiState.orangeScore}</span>
              </div>
              <button
                onClick={restart}
                className="btn-neon-cyan font-pixel text-sm tracking-widest px-8 py-3"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls reference */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {[
          { key: 'W/↑', desc: 'Forward' },
          { key: 'S/↓', desc: 'Reverse' },
          { key: 'A/←', desc: 'Turn Left' },
          { key: 'D/→', desc: 'Turn Right' },
          { key: 'SPACE', desc: 'Rocket Boost 🚀', highlight: true },
        ].map(({ key, desc, highlight }) => (
          <div
            key={key}
            className={`flex items-center gap-2 bg-arcade-card rounded-lg px-3 py-2 border ${highlight ? 'border-blue-500/50' : 'border-neon-cyan/20'}`}
          >
            <kbd
              className="font-pixel text-[9px] px-2 py-1 rounded"
              style={{
                background: highlight ? '#001a44' : '#0d0d1a',
                color: highlight ? '#0088ff' : '#00ffff',
                border: `1px solid ${highlight ? '#0088ff' : '#00ffff44'}`,
              }}
            >
              {key}
            </kbd>
            <span className="font-pixel text-[9px] text-arcade-muted">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
