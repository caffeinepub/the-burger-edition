import { useRef, useCallback } from 'react';

export interface SlopeObstacle {
  x: number;
  z: number;
  type: 'box' | 'gap';
  width: number;
  depth: number;
}

export interface SlopeGameState {
  ballX: number;
  ballZ: number;
  ballVX: number;
  ballVZ: number;
  speed: number;
  score: number;
  gameOver: boolean;
  obstacles: SlopeObstacle[];
  nextObstacleZ: number;
  laneWidth: number;
}

const LANE_WIDTH = 6;
const BALL_RADIUS = 0.4;
const INITIAL_SPEED = 8;
const MAX_SPEED = 25;
const ACCELERATION = 0.003;
const STEER_SPEED = 5;

function generateObstacle(z: number): SlopeObstacle {
  const type = Math.random() < 0.3 ? 'gap' : 'box';
  const width = type === 'gap' ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5;
  const xRange = LANE_WIDTH - width;
  const x = -xRange / 2 + Math.random() * xRange;
  return { x, z, type, width, depth: 1.5 };
}

export function useSlopeGame() {
  const stateRef = useRef<SlopeGameState>({
    ballX: 0,
    ballZ: 0,
    ballVX: 0,
    ballVZ: 0,
    speed: INITIAL_SPEED,
    score: 0,
    gameOver: false,
    obstacles: Array.from({ length: 15 }, (_, i) => generateObstacle(-(20 + i * 12))),
    nextObstacleZ: -(20 + 15 * 12),
    laneWidth: LANE_WIDTH,
  });

  const keysRef = useRef<Set<string>>(new Set());

  const getState = useCallback(() => stateRef.current, []);
  const pressKey = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey = useCallback((key: string) => keysRef.current.delete(key), []);

  const restart = useCallback(() => {
    stateRef.current = {
      ballX: 0,
      ballZ: 0,
      ballVX: 0,
      ballVZ: 0,
      speed: INITIAL_SPEED,
      score: 0,
      gameOver: false,
      obstacles: Array.from({ length: 15 }, (_, i) => generateObstacle(-(20 + i * 12))),
      nextObstacleZ: -(20 + 15 * 12),
      laneWidth: LANE_WIDTH,
    };
  }, []);

  const update = useCallback((delta: number) => {
    const s = stateRef.current;
    if (s.gameOver) return;

    const keys = keysRef.current;
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');

    // Steering
    if (left) s.ballVX = -STEER_SPEED;
    else if (right) s.ballVX = STEER_SPEED;
    else s.ballVX *= 0.85;

    // Accelerate
    s.speed = Math.min(MAX_SPEED, s.speed + ACCELERATION * s.speed);
    s.ballVZ = -s.speed;

    // Move ball
    s.ballX += s.ballVX * delta;
    s.ballZ += s.ballVZ * delta;

    // Score
    s.score = Math.floor(-s.ballZ);

    // Lane bounds
    if (Math.abs(s.ballX) > LANE_WIDTH / 2 + BALL_RADIUS) {
      s.gameOver = true;
      return;
    }

    // Generate new obstacles
    while (s.nextObstacleZ > s.ballZ - 200) {
      s.obstacles.push(generateObstacle(s.nextObstacleZ));
      s.nextObstacleZ -= 10 + Math.random() * 8;
    }

    // Remove old obstacles
    s.obstacles = s.obstacles.filter(o => o.z > s.ballZ - 5);

    // Collision detection
    for (const obs of s.obstacles) {
      if (obs.type === 'box') {
        const bx = s.ballX, bz = s.ballZ;
        const ox = obs.x, oz = obs.z;
        const hw = obs.width / 2 + BALL_RADIUS;
        const hd = obs.depth / 2 + BALL_RADIUS;
        if (Math.abs(bx - (ox + obs.width / 2)) < hw && Math.abs(bz - (oz - obs.depth / 2)) < hd) {
          s.gameOver = true;
          return;
        }
      } else if (obs.type === 'gap') {
        const bx = s.ballX, bz = s.ballZ;
        const ox = obs.x, oz = obs.z;
        const inGapZ = bz <= oz && bz >= oz - obs.depth;
        const inGapX = bx >= ox && bx <= ox + obs.width;
        if (inGapZ && inGapX) {
          s.gameOver = true;
          return;
        }
      }
    }
  }, []);

  return { getState, pressKey, releaseKey, update, restart };
}
