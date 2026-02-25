import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSlopeGame } from '../hooks/useSlopeGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const LANE_WIDTH = 6;
const TILE_DEPTH = 8;
const TILE_COUNT = 20;

function SlopeScene({ getState, update }: { getState: () => ReturnType<ReturnType<typeof useSlopeGame>['getState']>; update: (delta: number) => void }) {
  const { camera } = useThree();
  const ballRef = useRef<THREE.Mesh>(null);
  const tilesRef = useRef<THREE.Mesh[]>([]);
  const obstacleGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    update(delta);
    const s = getState();

    if (ballRef.current) {
      ballRef.current.position.x = s.ballX;
      ballRef.current.position.z = s.ballZ;
      ballRef.current.rotation.x += s.speed * delta * 0.5;
    }

    // Camera follow
    camera.position.set(s.ballX * 0.3, 4, s.ballZ + 10);
    camera.lookAt(s.ballX * 0.1, 0, s.ballZ - 5);

    // Update tiles
    const tileZ = Math.floor(s.ballZ / TILE_DEPTH) * TILE_DEPTH;
    tilesRef.current.forEach((tile, i) => {
      tile.position.z = tileZ - i * TILE_DEPTH;
    });

    // Update obstacles
    if (obstacleGroupRef.current) {
      const children = obstacleGroupRef.current.children;
      s.obstacles.forEach((obs, i) => {
        if (i < children.length) {
          const child = children[i] as THREE.Mesh;
          child.position.set(obs.x + obs.width / 2, obs.type === 'box' ? 0.5 : -2, obs.z - obs.depth / 2);
          child.scale.set(obs.width, obs.type === 'box' ? 1 : 0.1, obs.depth);
          child.visible = true;
        }
      });
      for (let i = s.obstacles.length; i < children.length; i++) {
        (children[i] as THREE.Mesh).visible = false;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#00ffaa" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff00ff" />

      {/* Ball */}
      <mesh ref={ballRef} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
      </mesh>

      {/* Lane tiles */}
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) tilesRef.current[i] = el; }}
          position={[0, 0, -i * TILE_DEPTH]}
          receiveShadow
        >
          <boxGeometry args={[LANE_WIDTH, 0.2, TILE_DEPTH]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#1a1a3e' : '#0d0d2e'}
            emissive={i % 2 === 0 ? '#0a0a20' : '#050510'}
          />
        </mesh>
      ))}

      {/* Lane edges */}
      <mesh position={[-LANE_WIDTH / 2 - 0.1, 0.3, -50]}>
        <boxGeometry args={[0.2, 0.6, 200]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[LANE_WIDTH / 2 + 0.1, 0.3, -50]}>
        <boxGeometry args={[0.2, 0.6, 200]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Obstacles */}
      <group ref={obstacleGroupRef}>
        {Array.from({ length: 20 }, (_, i) => (
          <mesh key={i} visible={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function SlopeGame() {
  const navigate = useNavigate();
  const { getState, pressKey, releaseKey, update, restart } = useSlopeGame();
  const [displayScore, setDisplayScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const scoreIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressKey(e.key);
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => releaseKey(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    scoreIntervalRef.current = setInterval(() => {
      const s = getState();
      setDisplayScore(s.score);
      if (s.gameOver) {
        setGameOver(true);
        if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    };
  }, [pressKey, releaseKey, getState]);

  const handleRestart = () => {
    restart();
    setGameOver(false);
    setDisplayScore(0);
    setScoreSubmitted(false);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    scoreIntervalRef.current = setInterval(() => {
      const s = getState();
      setDisplayScore(s.score);
      if (s.gameOver) {
        setGameOver(true);
        if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      }
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-xl text-neon-green tracking-widest">SLOPE</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative rounded-xl overflow-hidden border-2 border-neon-green/40" style={{ height: '500px' }}>
            {/* Score overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 rounded-lg px-3 py-2">
              <p className="font-pixel text-sm text-neon-green">DIST: {displayScore}m</p>
            </div>

            <Canvas camera={{ position: [0, 4, 10], fov: 75 }}>
              <SlopeScene getState={getState} update={update} />
            </Canvas>

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <p className="font-pixel text-2xl text-neon-pink mb-2">GAME OVER</p>
                <p className="font-pixel text-lg text-neon-green mb-6">DISTANCE: {displayScore}m</p>
                {!scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="slope"
                      score={displayScore}
                      label="SAVE DISTANCE"
                      scoreSuffix="m"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={handleRestart} className="btn-neon-green font-pixel text-sm px-6 py-3 rounded-lg tracking-widest">
                  ▶ PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-green/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-2">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-arcade-muted font-sans">
              <span>← → / A D — Steer</span>
              <span>Avoid red obstacles</span>
              <span>Don't fall off edges</span>
              <span>Speed increases over time</span>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="slope" title="BEST DISTANCE" accentColor="neon-green" />
        </div>
      </div>
    </div>
  );
}
