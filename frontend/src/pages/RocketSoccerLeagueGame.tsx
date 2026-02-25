import { useRef, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Zap } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useRocketSoccerLeagueGame,
  FIELD_W, FIELD_H, GOAL_W, GOAL_DEPTH, GOAL_HEIGHT,
  WALL_H, BALL_RADIUS, CAR_W, CAR_H, CAR_D, BOOST_MAX,
} from '../hooks/useRocketSoccerLeagueGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

// ─── 3D Scene ─────────────────────────────────────────────────────────────────
function RocketSoccerScene({
  getState,
  update,
}: {
  getState: ReturnType<typeof useRocketSoccerLeagueGame>['getState'];
  update: ReturnType<typeof useRocketSoccerLeagueGame>['update'];
}) {
  const { camera } = useThree();
  const ballRef = useRef<THREE.Mesh>(null);
  const playerCarRef = useRef<THREE.Group>(null);
  const aiCarRef = useRef<THREE.Group>(null);
  const playerBoostRef = useRef<THREE.PointLight>(null);
  const aiBoostRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    update(delta);
    const s = getState();

    // Ball
    if (ballRef.current) {
      ballRef.current.position.set(s.ball.pos.x, s.ball.pos.y, s.ball.pos.z);
      const spd = Math.sqrt(s.ball.vel.x ** 2 + s.ball.vel.z ** 2);
      ballRef.current.rotation.x += s.ball.vel.z * delta * 0.5;
      ballRef.current.rotation.z -= s.ball.vel.x * delta * 0.5;
      // Glow intensity based on speed
      const mat = ballRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.min(spd * 0.05, 0.7);
    }

    // Player car
    if (playerCarRef.current) {
      playerCarRef.current.position.set(s.player.pos.x, s.player.pos.y, s.player.pos.z);
      playerCarRef.current.rotation.y = s.player.rot;
    }
    if (playerBoostRef.current) {
      playerBoostRef.current.intensity = s.player.boosting ? 3 : 0;
    }

    // AI car
    if (aiCarRef.current) {
      aiCarRef.current.position.set(s.ai.pos.x, s.ai.pos.y, s.ai.pos.z);
      aiCarRef.current.rotation.y = s.ai.rot;
    }
    if (aiBoostRef.current) {
      aiBoostRef.current.intensity = s.ai.boosting ? 3 : 0;
    }

    // Camera: follow player from behind and above
    const px = s.player.pos.x;
    const pz = s.player.pos.z;
    const camDist = 18;
    const camHeight = 10;
    const camX = px * 0.3;
    const camZ = pz + camDist;
    camera.position.lerp(new THREE.Vector3(camX, camHeight, camZ), 0.08);
    camera.lookAt(px * 0.2, 0, pz - 4);
  });

  const hw = FIELD_W / 2;
  const hd = FIELD_H / 2;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} color="#1a1a3e" />
      <directionalLight position={[0, 20, 0]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[-hw, 8, 0]} intensity={1.5} color="#00ffff" distance={30} />
      <pointLight position={[hw, 8, 0]} intensity={1.5} color="#ff00ff" distance={30} />
      <pointLight position={[0, 8, -hd]} intensity={1.2} color="#00ff88" distance={25} />
      <pointLight position={[0, 8, hd]} intensity={1.2} color="#ff6600" distance={25} />

      {/* ── Field ── */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[FIELD_W, 0.2, FIELD_H]} />
        <meshStandardMaterial color="#0a1a0a" roughness={0.9} />
      </mesh>

      {/* Center line */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[FIELD_W, 0.02, 0.15]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
      </mesh>

      {/* Center circle */}
      {Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const r = 4;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.11, Math.sin(angle) * r]}>
            <boxGeometry args={[0.3, 0.02, 0.3]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
          </mesh>
        );
      })}

      {/* Field markings — goal area lines */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0, 0.11, side * (hd - 3)]}>
            <boxGeometry args={[GOAL_W + 2, 0.02, 0.12]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── Boundary walls ── */}
      {/* Left wall */}
      <mesh position={[-hw - 0.25, WALL_H / 2, 0]}>
        <boxGeometry args={[0.5, WALL_H, FIELD_H]} />
        <meshStandardMaterial color="#0d0d2e" emissive="#00ffff" emissiveIntensity={0.15} transparent opacity={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[hw + 0.25, WALL_H / 2, 0]}>
        <boxGeometry args={[0.5, WALL_H, FIELD_H]} />
        <meshStandardMaterial color="#0d0d2e" emissive="#ff00ff" emissiveIntensity={0.15} transparent opacity={0.85} />
      </mesh>
      {/* Back wall segments (around goals) */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Left segment */}
          <mesh position={[-(hw / 2 + GOAL_W / 4 + 0.5), WALL_H / 2, side * (hd + 0.25)]}>
            <boxGeometry args={[hw - GOAL_W / 2, WALL_H, 0.5]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.85} />
          </mesh>
          {/* Right segment */}
          <mesh position={[(hw / 2 + GOAL_W / 4 + 0.5), WALL_H / 2, side * (hd + 0.25)]}>
            <boxGeometry args={[hw - GOAL_W / 2, WALL_H, 0.5]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.85} />
          </mesh>
          {/* Top bar over goal */}
          <mesh position={[0, GOAL_HEIGHT + 0.15, side * (hd + 0.25)]}>
            <boxGeometry args={[GOAL_W, 0.3, 0.5]} />
            <meshStandardMaterial color="#0d0d2e" emissive="#00ff88" emissiveIntensity={0.12} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── Goals ── */}
      {/* Player's goal (positive Z) — orange */}
      <GoalFrame posZ={hd + GOAL_DEPTH / 2} color="#ff6600" />
      {/* AI's goal (negative Z) — cyan */}
      <GoalFrame posZ={-(hd + GOAL_DEPTH / 2)} color="#00ffff" />

      {/* ── Ball ── */}
      <mesh ref={ballRef} position={[0, BALL_RADIUS, 0]} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 20, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffff00"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* ── Player car (cyan) ── */}
      <group ref={playerCarRef} position={[0, CAR_H / 2, hd - 4]}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[CAR_W, CAR_H, CAR_D]} />
          <meshStandardMaterial color="#003344" emissive="#00ffff" emissiveIntensity={0.4} roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, CAR_H * 0.6, -CAR_D * 0.1]}>
          <boxGeometry args={[CAR_W * 0.8, CAR_H * 0.5, CAR_D * 0.6]} />
          <meshStandardMaterial color="#004455" emissive="#00ffff" emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Wheels */}
        {[[-CAR_W / 2 - 0.1, -CAR_H / 2 + 0.15, CAR_D / 3], [CAR_W / 2 + 0.1, -CAR_H / 2 + 0.15, CAR_D / 3],
          [-CAR_W / 2 - 0.1, -CAR_H / 2 + 0.15, -CAR_D / 3], [CAR_W / 2 + 0.1, -CAR_H / 2 + 0.15, -CAR_D / 3]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
            <meshStandardMaterial color="#111" emissive="#00ffff" emissiveIntensity={0.2} roughness={0.8} />
          </mesh>
        ))}
        {/* Boost flame */}
        <pointLight ref={playerBoostRef} position={[0, 0, CAR_D / 2 + 0.3]} color="#00ffff" intensity={0} distance={5} />
        <mesh position={[0, 0, CAR_D / 2 + 0.2]}>
          <coneGeometry args={[0.2, 0.6, 8]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
        {/* Label */}
        <mesh position={[0, CAR_H + 0.3, 0]}>
          <boxGeometry args={[0.8, 0.15, 0.05]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* ── AI car (magenta) ── */}
      <group ref={aiCarRef} position={[0, CAR_H / 2, -(hd - 4)]}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[CAR_W, CAR_H, CAR_D]} />
          <meshStandardMaterial color="#330022" emissive="#ff00ff" emissiveIntensity={0.4} roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, CAR_H * 0.6, -CAR_D * 0.1]}>
          <boxGeometry args={[CAR_W * 0.8, CAR_H * 0.5, CAR_D * 0.6]} />
          <meshStandardMaterial color="#440033" emissive="#ff00ff" emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Wheels */}
        {[[-CAR_W / 2 - 0.1, -CAR_H / 2 + 0.15, CAR_D / 3], [CAR_W / 2 + 0.1, -CAR_H / 2 + 0.15, CAR_D / 3],
          [-CAR_W / 2 - 0.1, -CAR_H / 2 + 0.15, -CAR_D / 3], [CAR_W / 2 + 0.1, -CAR_H / 2 + 0.15, -CAR_D / 3]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.25, 12]} />
            <meshStandardMaterial color="#111" emissive="#ff00ff" emissiveIntensity={0.2} roughness={0.8} />
          </mesh>
        ))}
        {/* Boost flame */}
        <pointLight ref={aiBoostRef} position={[0, 0, CAR_D / 2 + 0.3]} color="#ff00ff" intensity={0} distance={5} />
        <mesh position={[0, 0, CAR_D / 2 + 0.2]}>
          <coneGeometry args={[0.2, 0.6, 8]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} transparent opacity={0.6} />
        </mesh>
        {/* Label */}
        <mesh position={[0, CAR_H + 0.3, 0]}>
          <boxGeometry args={[0.8, 0.15, 0.05]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Stadium atmosphere — corner lights */}
      {[[-hw, 0, -hd], [hw, 0, -hd], [-hw, 0, hd], [hw, 0, hd]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.5, 12, 0.5]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#ffffff" emissiveIntensity={0.05} />
        </mesh>
      ))}
    </>
  );
}

// ─── Goal frame component ─────────────────────────────────────────────────────
function GoalFrame({ posZ, color }: { posZ: number; color: string }) {
  const hd = FIELD_H / 2;
  const sign = posZ > 0 ? 1 : -1;
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, GOAL_HEIGHT / 2, posZ + sign * GOAL_DEPTH / 2]}>
        <boxGeometry args={[GOAL_W, GOAL_HEIGHT, 0.15]} />
        <meshStandardMaterial color="#050510" emissive={color} emissiveIntensity={0.15} transparent opacity={0.5} />
      </mesh>
      {/* Left post */}
      <mesh position={[-GOAL_W / 2, GOAL_HEIGHT / 2, posZ]}>
        <boxGeometry args={[0.2, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Right post */}
      <mesh position={[GOAL_W / 2, GOAL_HEIGHT / 2, posZ]}>
        <boxGeometry args={[0.2, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, GOAL_HEIGHT, posZ]}>
        <boxGeometry args={[GOAL_W + 0.2, 0.2, GOAL_DEPTH]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Goal light */}
      <pointLight position={[0, GOAL_HEIGHT / 2, posZ + sign * 0.5]} color={color} intensity={0.8} distance={8} />
    </group>
  );
}

// ─── Boost bar ────────────────────────────────────────────────────────────────
function BoostBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-pixel text-[9px] tracking-widest" style={{ color }}>{label}</span>
      <div className="w-20 h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RocketSoccerLeagueGame() {
  const navigate = useNavigate();
  const { update, start, restart, getState, uiState } = useRocketSoccerLeagueGame();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [boostDisplay, setBoostDisplay] = useState({ player: BOOST_MAX, ai: BOOST_MAX });

  // Poll boost values for HUD
  useEffect(() => {
    const interval = setInterval(() => {
      const s = getState();
      setBoostDisplay({ player: s.player.boost, ai: s.ai.boost });
    }, 100);
    return () => clearInterval(interval);
  }, [getState]);

  // Reset scoreSubmitted on restart
  useEffect(() => {
    if (uiState.phase === 'playing') setScoreSubmitted(false);
  }, [uiState.phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const playerWon = uiState.playerScore > uiState.aiScore;
  const isDraw = uiState.playerScore === uiState.aiScore;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-cyan transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-base text-neon-cyan tracking-widest">ROCKET SOCCER LEAGUE</h1>
        <Zap className="w-4 h-4 text-neon-yellow" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {/* Game canvas wrapper */}
          <div className="relative rounded-xl overflow-hidden border-2 border-neon-cyan/40" style={{ height: '520px' }}>

            {/* ── HUD overlay ── */}
            <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
              <div className="flex items-start justify-between px-4 pt-3">
                {/* Player score */}
                <div className="flex flex-col items-center bg-black/70 rounded-lg px-4 py-2 border border-neon-cyan/40">
                  <span className="font-pixel text-[9px] text-neon-cyan tracking-widest mb-1">YOU</span>
                  <span className="font-pixel text-3xl text-neon-cyan" style={{ textShadow: '0 0 12px #00ffff' }}>
                    {uiState.playerScore}
                  </span>
                </div>

                {/* Timer */}
                <div className="flex flex-col items-center bg-black/70 rounded-lg px-5 py-2 border border-neon-yellow/40">
                  <span className="font-pixel text-[9px] text-arcade-muted tracking-widest mb-1">TIME</span>
                  <span
                    className="font-pixel text-xl text-neon-yellow"
                    style={{ textShadow: '0 0 10px #ffcc00', color: uiState.timer <= 30 ? '#ff3333' : undefined }}
                  >
                    {formatTime(uiState.timer)}
                  </span>
                </div>

                {/* AI score */}
                <div className="flex flex-col items-center bg-black/70 rounded-lg px-4 py-2 border border-neon-pink/40">
                  <span className="font-pixel text-[9px] text-neon-pink tracking-widest mb-1">AI</span>
                  <span className="font-pixel text-3xl text-neon-pink" style={{ textShadow: '0 0 12px #ff00ff' }}>
                    {uiState.aiScore}
                  </span>
                </div>
              </div>

              {/* Boost bars */}
              {uiState.phase === 'playing' && (
                <div className="flex justify-between px-4 pt-2">
                  <BoostBar value={boostDisplay.player} max={BOOST_MAX} color="#00ffff" label="BOOST" />
                  <BoostBar value={boostDisplay.ai} max={BOOST_MAX} color="#ff00ff" label="BOOST" />
                </div>
              )}

              {/* Goal flash */}
              {uiState.lastGoalBy && uiState.phase === 'playing' && (
                <div className="flex justify-center mt-2">
                  <span
                    className="font-pixel text-sm px-4 py-1 rounded-lg bg-black/80 border tracking-widest animate-pulse"
                    style={{
                      color: uiState.lastGoalBy === 'player' ? '#00ffff' : '#ff00ff',
                      borderColor: uiState.lastGoalBy === 'player' ? '#00ffff44' : '#ff00ff44',
                    }}
                  >
                    {uiState.lastGoalBy === 'player' ? '⚽ GOAL! YOU SCORED!' : '⚽ AI SCORED!'}
                  </span>
                </div>
              )}
            </div>

            {/* ── 3D Canvas ── */}
            <Canvas camera={{ position: [0, 10, 18], fov: 70 }} shadows>
              <RocketSoccerScene getState={getState} update={update} />
            </Canvas>

            {/* ── Idle overlay ── */}
            {uiState.phase === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                <p className="font-pixel text-2xl text-neon-cyan mb-2 tracking-widest" style={{ textShadow: '0 0 20px #00ffff' }}>
                  ROCKET SOCCER
                </p>
                <p className="font-pixel text-xs text-neon-yellow mb-1 tracking-widest">3-MINUTE MATCH</p>
                <p className="font-pixel text-xs text-arcade-muted mb-8 tracking-wider">SCORE MORE GOALS THAN THE AI</p>
                <button
                  onClick={start}
                  className="btn-neon-cyan font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
                >
                  ▶ KICK OFF
                </button>
              </div>
            )}

            {/* ── Finished overlay ── */}
            {uiState.phase === 'finished' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20 px-4">
                <p className="font-pixel text-xs text-arcade-muted mb-3 tracking-widest">FINAL SCORE</p>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="font-pixel text-[10px] text-neon-cyan mb-1">YOU</p>
                    <p className="font-pixel text-4xl text-neon-cyan" style={{ textShadow: '0 0 16px #00ffff' }}>
                      {uiState.playerScore}
                    </p>
                  </div>
                  <p className="font-pixel text-2xl text-arcade-muted">—</p>
                  <div className="text-center">
                    <p className="font-pixel text-[10px] text-neon-pink mb-1">AI</p>
                    <p className="font-pixel text-4xl text-neon-pink" style={{ textShadow: '0 0 16px #ff00ff' }}>
                      {uiState.aiScore}
                    </p>
                  </div>
                </div>

                <p
                  className="font-pixel text-xl mb-6 tracking-widest"
                  style={{
                    color: playerWon ? '#00ffff' : isDraw ? '#ffcc00' : '#ff00ff',
                    textShadow: playerWon ? '0 0 20px #00ffff' : isDraw ? '0 0 20px #ffcc00' : '0 0 20px #ff00ff',
                  }}
                >
                  {playerWon ? '🏆 YOU WIN!' : isDraw ? '🤝 DRAW!' : '💀 AI WINS!'}
                </p>

                {playerWon && !scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="rocket-soccer-league"
                      score={uiState.playerScore}
                      label="SAVE WIN"
                      scoreSuffix="goals"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}

                <button
                  onClick={restart}
                  className="btn-neon-cyan font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
                >
                  ▶ PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Controls guide */}
          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-3">CONTROLS</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-arcade-muted font-sans">
              <div className="flex flex-col gap-1">
                <span className="font-pixel text-[9px] text-neon-cyan">MOVE</span>
                <span>W / ↑ — Forward</span>
                <span>S / ↓ — Reverse</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-pixel text-[9px] text-neon-cyan">STEER</span>
                <span>A / ← — Turn Left</span>
                <span>D / → — Turn Right</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-pixel text-[9px] text-neon-yellow">BOOST</span>
                <span>Shift / Space</span>
                <span>Recharges over time</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-pixel text-[9px] text-neon-pink">GOAL</span>
                <span>Hit ball into AI goal</span>
                <span>(far end — cyan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard sidebar */}
        <div className="lg:w-64 flex flex-col gap-4">
          <Leaderboard game="rocket-soccer-league" title="TOP SCORERS" accentColor="neon-cyan" />
          {uiState.phase === 'finished' && (
            <div className="bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
              <p className="font-pixel text-[10px] text-arcade-muted tracking-wider mb-2">MATCH RESULT</p>
              <p className="font-pixel text-xs text-neon-cyan">
                {playerWon ? '🏆 VICTORY' : isDraw ? '🤝 DRAW' : '💀 DEFEAT'}
              </p>
              <p className="font-pixel text-[9px] text-arcade-muted mt-1">
                {uiState.playerScore} — {uiState.aiScore}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
