import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Crosshair } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  use1v1Lol3DGame,
  WEAPONS,
  DIFFICULTY_CONFIGS,
  type Difficulty,
  type WeaponType,
  type Projectile,
  type CombatantState,
} from '../hooks/use1v1Lol3DGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

// ─── Arena constants ──────────────────────────────────────────────────────────
const ARENA_SIZE = 40;
const HALF = ARENA_SIZE / 2;

// ─── Obstacle positions ───────────────────────────────────────────────────────
const OBSTACLES = [
  { pos: [8, 1, 5] as [number, number, number], size: [2, 2, 2] as [number, number, number], color: '#334455' },
  { pos: [-8, 1, 5] as [number, number, number], size: [2, 2, 2] as [number, number, number], color: '#334455' },
  { pos: [0, 1, -5] as [number, number, number], size: [4, 2, 1] as [number, number, number], color: '#445533' },
  { pos: [12, 1.5, -8] as [number, number, number], size: [1.5, 3, 1.5] as [number, number, number], color: '#553344' },
  { pos: [-12, 1.5, -8] as [number, number, number], size: [1.5, 3, 1.5] as [number, number, number], color: '#553344' },
  { pos: [5, 1, -15] as [number, number, number], size: [3, 2, 1] as [number, number, number], color: '#334455' },
  { pos: [-5, 1, -15] as [number, number, number], size: [3, 2, 1] as [number, number, number], color: '#334455' },
  { pos: [0, 1, 0] as [number, number, number], size: [2, 2, 2] as [number, number, number], color: '#445544' },
];

// ─── Arena scene ─────────────────────────────────────────────────────────────
function Arena() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
      </mesh>

      {/* Grid lines on ground */}
      <gridHelper args={[ARENA_SIZE, 20, '#2a4a2a', '#1e3a1e']} position={[0, 0.01, 0]} />

      {/* Walls */}
      <mesh position={[0, 3, -HALF]} castShadow receiveShadow>
        <boxGeometry args={[ARENA_SIZE, 6, 0.5]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3, HALF]} castShadow receiveShadow>
        <boxGeometry args={[ARENA_SIZE, 6, 0.5]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      <mesh position={[-HALF, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 6, ARENA_SIZE]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      <mesh position={[HALF, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 6, ARENA_SIZE]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      {/* Obstacles */}
      {OBSTACLES.map((obs, i) => (
        <mesh key={i} position={obs.pos} castShadow receiveShadow>
          <boxGeometry args={obs.size} />
          <meshStandardMaterial color={obs.color} roughness={0.7} />
        </mesh>
      ))}

      {/* Neon edge strips on walls */}
      <mesh position={[0, 0.05, -HALF + 0.3]}>
        <boxGeometry args={[ARENA_SIZE, 0.05, 0.05]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0.05, HALF - 0.3]}>
        <boxGeometry args={[ARENA_SIZE, 0.05, 0.05]} />
        <meshStandardMaterial color="#ff0044" emissive="#ff0044" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── Bot mesh ─────────────────────────────────────────────────────────────────
function BotMesh({ bot }: { bot: CombatantState }) {
  const meshRef = useRef<THREE.Group>(null);
  const hpPct = bot.hp / bot.maxHp;
  const bodyColor = hpPct > 0.5 ? '#ff3333' : hpPct > 0.25 ? '#ff8800' : '#ff0000';

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(bot.position);
      meshRef.current.position.y = 0;
    }
  });

  return (
    <group ref={meshRef} position={[bot.position.x, 0, bot.position.z]}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.5]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.15, 1.95, 0.31]}>
        <boxGeometry args={[0.12, 0.1, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.15, 1.95, 0.31]}>
        <boxGeometry args={[0.12, 0.1, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      {/* Legs */}
      <mesh position={[0.2, 0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.4]} />
        <meshStandardMaterial color="#222244" />
      </mesh>
      <mesh position={[-0.2, 0.3, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.4]} />
        <meshStandardMaterial color="#222244" />
      </mesh>
      {/* HP bar above head */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[1.2, 0.12, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-(1.2 * (1 - hpPct)) / 2, 2.5, 0.01]}>
        <boxGeometry args={[1.2 * hpPct, 0.1, 0.05]} />
        <meshStandardMaterial
          color={hpPct > 0.5 ? '#00ff88' : hpPct > 0.25 ? '#ffcc00' : '#ff3333'}
          emissive={hpPct > 0.5 ? '#00ff88' : hpPct > 0.25 ? '#ffcc00' : '#ff3333'}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

// ─── Projectile meshes ────────────────────────────────────────────────────────
function ProjectileMesh({ proj }: { proj: Projectile }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const weaponColor = WEAPONS[proj.weapon].color;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(proj.position);
    }
  });

  return (
    <mesh ref={meshRef} position={[proj.position.x, proj.position.y, proj.position.z]}>
      <sphereGeometry args={[proj.weapon === 'sniper' ? 0.12 : 0.08, 6, 6]} />
      <meshStandardMaterial
        color={weaponColor}
        emissive={weaponColor}
        emissiveIntensity={3}
      />
    </mesh>
  );
}

// ─── Player controller (inside Canvas) ───────────────────────────────────────
interface PlayerControllerProps {
  keysRef: React.MutableRefObject<Set<string>>;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  playerPos: THREE.Vector3;
  isPlaying: boolean;
  onFire: () => void;
}

function PlayerController({ keysRef, cameraRef, playerPos, isPlaying, onFire }: PlayerControllerProps) {
  const { camera } = useThree();
  const fireIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    cameraRef.current = camera;
    camera.position.copy(playerPos);
  }, [camera, cameraRef, playerPos]);

  useFrame(() => {
    if (cameraRef.current !== camera) {
      cameraRef.current = camera;
    }
  });

  // Auto-fire on mouse hold
  useEffect(() => {
    if (!isPlaying) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        onFire();
        fireIntervalRef.current = setInterval(onFire, 80);
      }
    };
    const handleMouseUp = () => {
      if (fireIntervalRef.current) {
        clearInterval(fireIntervalRef.current);
        fireIntervalRef.current = null;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (fireIntervalRef.current) clearInterval(fireIntervalRef.current);
    };
  }, [isPlaying, onFire]);

  return <PointerLockControls />;
}

// ─── Lights ───────────────────────────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#334466" />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color="#aaccff" castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#6688aa" />
      <pointLight position={[0, 0.5, -HALF + 1]} intensity={1.5} color="#00ffff" distance={8} />
      <pointLight position={[0, 0.5, HALF - 1]} intensity={1.5} color="#ff0044" distance={8} />
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OneLolGame() {
  const navigate = useNavigate();
  const {
    gameState,
    startGame,
    reset,
    switchWeapon,
    firePlayer,
    keysRef,
    cameraRef,
  } = use1v1Lol3DGame();

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const { phase, player, bot, projectiles, difficulty, score, playerWon } = gameState;

  // ─── Keyboard input ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);

      if (phase !== 'playing') return;

      // Weapon switching
      if (e.key === '1') switchWeapon('sniper');
      if (e.key === '2') switchWeapon('shotgun');
      if (e.key === '3') switchWeapon('pistol');
      if (e.key === '4') switchWeapon('machinegun');

      // Prevent scroll
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase, keysRef, switchWeapon]);

  // ─── Pointer lock state ──────────────────────────────────────────────────────
  useEffect(() => {
    const onLockChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setScoreSubmitted(false);
  }, [reset]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const playerWeapon = WEAPONS[player.weapon];
  const playerHpPct = player.hp / player.maxHp;
  const botHpPct = bot.hp / bot.maxHp;

  // ─── Idle / difficulty selection ─────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-arcade-muted hover:text-neon-green transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-pixel text-xl text-neon-cyan tracking-widest">1V1.LOL 3D</h1>
        </div>

        <div className="flex flex-col items-center gap-8">
          {/* Title */}
          <div className="text-center">
            <h2 className="font-pixel text-3xl text-neon-green mb-2 drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
              1V1.LOL
            </h2>
            <p className="font-pixel text-sm text-neon-cyan tracking-widest">3D BATTLE ARENA</p>
          </div>

          {/* Difficulty selection */}
          <div className="w-full max-w-lg">
            <p className="font-pixel text-xs text-arcade-muted tracking-widest text-center mb-6">
              SELECT DIFFICULTY
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(DIFFICULTY_CONFIGS) as [Difficulty, typeof DIFFICULTY_CONFIGS[Difficulty]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => startGame(key)}
                    className="group relative bg-arcade-card border-2 border-arcade-border hover:border-neon-cyan/60 rounded-xl p-5 transition-all hover:scale-105 text-left"
                  >
                    <div
                      className="font-pixel text-sm mb-1 tracking-wider"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </div>
                    <div className="font-pixel text-[10px] text-arcade-muted space-y-1">
                      <div>⚡ Reaction: {cfg.reactionTime}ms</div>
                      <div>🎯 Accuracy: {Math.round(cfg.accuracy * 100)}%</div>
                      <div>🏃 Speed: {cfg.moveSpeed} u/s</div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Weapons info */}
          <div className="w-full max-w-lg">
            <p className="font-pixel text-xs text-arcade-muted tracking-widest text-center mb-4">
              WEAPONS (KEYS 1–4)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(WEAPONS) as [WeaponType, typeof WEAPONS[WeaponType]][]).map(([key, w], i) => (
                <div
                  key={key}
                  className="bg-arcade-card border border-arcade-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-pixel text-[10px] text-arcade-muted">[{i + 1}]</span>
                    <span className="font-pixel text-xs" style={{ color: w.color }}>
                      {w.name}
                    </span>
                  </div>
                  <div className="font-pixel text-[9px] text-arcade-muted space-y-0.5">
                    <div>💥 DMG: {w.damage}{w.pellets > 1 ? ` × ${w.pellets}` : ''}</div>
                    <div>🔫 AMMO: {w.maxAmmo}</div>
                    <div>⏱ RELOAD: {(w.reloadTime / 1000).toFixed(1)}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-lg bg-arcade-card border border-arcade-border rounded-xl p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-widest mb-3">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 font-pixel text-[10px] text-arcade-muted">
              <span>WASD — Move</span>
              <span>MOUSE — Look</span>
              <span>LMB — Shoot</span>
              <span>1-4 — Switch Weapon</span>
              <span>ESC — Unlock Mouse</span>
              <span>Click — Lock Mouse</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game over screen ─────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-arcade-muted hover:text-neon-green transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-pixel text-xl text-neon-cyan tracking-widest">1V1.LOL 3D</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col items-center gap-6">
            {/* Result */}
            <div className="text-center">
              <p
                className={`font-pixel text-4xl mb-3 ${playerWon ? 'text-neon-green' : 'text-neon-pink'}`}
                style={{
                  textShadow: playerWon
                    ? '0 0 30px rgba(0,255,136,0.8)'
                    : '0 0 30px rgba(255,0,68,0.8)',
                }}
              >
                {playerWon ? '🏆 YOU WIN!' : '💀 YOU LOSE!'}
              </p>
              <p className="font-pixel text-sm text-neon-yellow">
                {playerWon
                  ? `SURVIVED WITH ${player.hp} HP`
                  : `BOT HAD ${bot.hp} HP REMAINING`}
              </p>
              <p className="font-pixel text-xs text-arcade-muted mt-1">
                DIFFICULTY: {DIFFICULTY_CONFIGS[difficulty].label}
              </p>
            </div>

            {/* HP summary */}
            <div className="w-full max-w-sm space-y-3">
              <div>
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-neon-cyan">YOU</span>
                  <span className="text-neon-cyan">{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-3 bg-arcade-bg rounded-full overflow-hidden border border-neon-cyan/30">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(player.hp / player.maxHp) * 100}%`,
                      background: player.hp > 50 ? '#00ff88' : player.hp > 25 ? '#ffcc00' : '#ff3333',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-pixel text-xs mb-1">
                  <span className="text-neon-pink">BOT</span>
                  <span className="text-neon-pink">{bot.hp} / {bot.maxHp}</span>
                </div>
                <div className="h-3 bg-arcade-bg rounded-full overflow-hidden border border-neon-pink/30">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(bot.hp / bot.maxHp) * 100}%`,
                      background: '#ff3333',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Score submission */}
            {playerWon && !scoreSubmitted && (
              <div className="w-full max-w-sm">
                <ScoreSubmission
                  game="1v1-lol-3d"
                  score={score}
                  label="SAVE SCORE"
                  scoreSuffix="pts"
                  onSubmitted={() => setScoreSubmitted(true)}
                />
              </div>
            )}

            {/* Play again */}
            <button
              onClick={handleReset}
              className="btn-neon-cyan font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
            >
              ▶ PLAY AGAIN
            </button>
          </div>

          {/* Leaderboard */}
          <div className="lg:w-64">
            <Leaderboard
              game="1v1-lol-3d"
              title="TOP SCORES"
              accentColor="neon-cyan"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-arcade-muted hover:text-neon-green transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-lg text-neon-cyan tracking-widest">1V1.LOL 3D</h1>
        <span
          className="font-pixel text-xs ml-auto tracking-wider"
          style={{ color: diffConfig.color }}
        >
          {diffConfig.label}
        </span>
      </div>

      {/* Game container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border-2 border-neon-cyan/40"
        style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}
      >
        {/* 3D Canvas */}
        <Canvas
          shadows
          camera={{
            fov: 75,
            near: 0.1,
            far: 200,
            position: [player.position.x, player.position.y, player.position.z],
          }}
          style={{ background: '#0a0a1a' }}
        >
          <Lights />
          <Arena />
          <BotMesh bot={bot} />
          {projectiles.map((proj) => (
            <ProjectileMesh key={proj.id} proj={proj} />
          ))}
          <PlayerController
            keysRef={keysRef}
            cameraRef={cameraRef}
            playerPos={player.position}
            isPlaying={phase === 'playing'}
            onFire={firePlayer}
          />
        </Canvas>

        {/* ── HUD overlay ── */}

        {/* Click to lock overlay */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="text-center">
              <Crosshair className="w-12 h-12 text-neon-cyan mx-auto mb-4 animate-pulse" />
              <p className="font-pixel text-lg text-neon-cyan mb-2">CLICK TO PLAY</p>
              <p className="font-pixel text-xs text-arcade-muted">Click the game to lock your mouse</p>
              <p className="font-pixel text-xs text-arcade-muted mt-1">Press ESC to unlock</p>
            </div>
          </div>
        )}

        {/* Crosshair */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-6 h-6">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/80 -translate-y-1/2" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/80 -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        {/* Player HP — top left */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-black/70 rounded-lg px-3 py-2 border border-neon-cyan/30 min-w-[160px]">
            <div className="flex justify-between font-pixel text-[10px] mb-1">
              <span className="text-neon-cyan">YOU</span>
              <span className="text-neon-cyan">{player.hp} HP</span>
            </div>
            <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-neon-cyan/20">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${playerHpPct * 100}%`,
                  background: playerHpPct > 0.5 ? '#00ff88' : playerHpPct > 0.25 ? '#ffcc00' : '#ff3333',
                  boxShadow: `0 0 6px ${playerHpPct > 0.5 ? '#00ff88' : playerHpPct > 0.25 ? '#ffcc00' : '#ff3333'}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bot HP — top right */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="bg-black/70 rounded-lg px-3 py-2 border border-neon-pink/30 min-w-[160px]">
            <div className="flex justify-between font-pixel text-[10px] mb-1">
              <span className="text-neon-pink">BOT</span>
              <span className="text-neon-pink">{bot.hp} HP</span>
            </div>
            <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-neon-pink/20">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${botHpPct * 100}%`,
                  background: botHpPct > 0.5 ? '#ff3333' : botHpPct > 0.25 ? '#ff8800' : '#ff0000',
                  boxShadow: `0 0 6px ${botHpPct > 0.5 ? '#ff3333' : '#ff8800'}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Difficulty — top center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/70 rounded-lg px-3 py-1.5 border border-arcade-border/40">
            <span
              className="font-pixel text-[10px] tracking-widest"
              style={{ color: diffConfig.color }}
            >
              {diffConfig.label}
            </span>
          </div>
        </div>

        {/* Weapon / Ammo — bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/80 rounded-xl px-5 py-3 border border-arcade-border/40 text-center min-w-[200px]">
            {/* Weapon name */}
            <div
              className="font-pixel text-sm mb-1 tracking-widest"
              style={{ color: playerWeapon.color }}
            >
              {playerWeapon.name}
            </div>

            {/* Ammo */}
            <div className="font-pixel text-xs text-arcade-muted mb-2">
              {player.isReloading ? (
                <span className="text-neon-yellow animate-pulse">RELOADING...</span>
              ) : (
                <span>
                  <span style={{ color: playerWeapon.color }}>{player.ammo}</span>
                  <span className="text-arcade-muted"> / {playerWeapon.maxAmmo}</span>
                </span>
              )}
            </div>

            {/* Reload progress bar */}
            {player.isReloading && (
              <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-neon-yellow/30">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${player.reloadProgress * 100}%`,
                    background: '#ffcc00',
                    boxShadow: '0 0 6px #ffcc00',
                  }}
                />
              </div>
            )}

            {/* Weapon slots */}
            <div className="flex gap-1.5 mt-2 justify-center">
              {(['sniper', 'shotgun', 'pistol', 'machinegun'] as WeaponType[]).map((w, i) => (
                <div
                  key={w}
                  className="font-pixel text-[8px] px-1.5 py-0.5 rounded border transition-all"
                  style={{
                    borderColor: player.weapon === w ? WEAPONS[w].color : 'rgba(255,255,255,0.1)',
                    color: player.weapon === w ? WEAPONS[w].color : 'rgba(255,255,255,0.3)',
                    background: player.weapon === w ? `${WEAPONS[w].color}22` : 'transparent',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bot weapon info — bottom right */}
        <div className="absolute bottom-4 right-3 z-10 pointer-events-none">
          <div className="bg-black/60 rounded-lg px-3 py-2 border border-arcade-border/30">
            <div className="font-pixel text-[9px] text-arcade-muted space-y-0.5">
              <div>BOT WEAPON:</div>
              <div style={{ color: WEAPONS[bot.weapon].color }}>{WEAPONS[bot.weapon].name}</div>
              <div className="text-arcade-muted mt-1">
                {bot.isReloading ? (
                  <span className="text-neon-yellow">RELOADING</span>
                ) : (
                  <span>{bot.ammo}/{WEAPONS[bot.weapon].maxAmmo}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls reminder */}
      <div className="mt-3 bg-arcade-card rounded-xl border border-neon-cyan/20 p-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-pixel text-[9px] text-arcade-muted">
          <span>WASD — Move</span>
          <span>MOUSE — Look</span>
          <span>LMB — Shoot</span>
          <span>1 — Sniper</span>
          <span>2 — Shotgun</span>
          <span>3 — Pistol</span>
          <span>4 — Machine Gun</span>
          <span>ESC — Unlock Mouse</span>
        </div>
      </div>
    </div>
  );
}
