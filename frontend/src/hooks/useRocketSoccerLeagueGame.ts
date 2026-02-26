import { useRef, useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
export const FIELD_W = 200;   // 5x original 40 — half-width = 100
export const FIELD_H = 120;   // 5x original 24 — half-depth = 60
export const GOAL_W = 20;     // 5x original 8 (scaled with field)
export const GOAL_DEPTH = 8;  // 5x original ~2
export const GOAL_HEIGHT = 10; // 5x original ~3 (scaled)
export const WALL_H = 6;      // taller walls for bigger field
export const BALL_RADIUS = 1.5; // bigger ball for bigger field
export const CAR_W = 3.2;     // 2x original for better visibility
export const CAR_H = 1.4;
export const CAR_D = 4.8;
export const CAR_SPEED = 40;  // faster for bigger field
export const CAR_BOOST_SPEED = 70;
export const CAR_TURN_SPEED = 2.2;
export const BOOST_MAX = 100;
export const BOOST_DRAIN = 40;
export const BOOST_REGEN = 15;
export const GRAVITY = -30;
export const BALL_RESTITUTION = 0.65;
export const BALL_FRICTION = 0.985;
export const BALL_GROUND_FRICTION = 0.97;
export const MATCH_DURATION = 180; // seconds

export interface Vec3 { x: number; y: number; z: number; }

export interface CarState {
  pos: Vec3;
  vel: Vec3;
  rot: number;   // Y-axis rotation in radians
  boost: number; // 0-100
  boosting: boolean;
}

export interface BallState {
  pos: Vec3;
  vel: Vec3;
}

export interface GameState {
  phase: 'idle' | 'playing' | 'goal' | 'finished';
  playerScore: number;
  aiScore: number;
  timer: number;
  player: CarState;
  ai: CarState;
  ball: BallState;
  lastGoalBy: 'player' | 'ai' | null;
}

function makePlayerCar(): CarState {
  return {
    pos: { x: 0, y: CAR_H / 2, z: FIELD_H / 2 - 15 },
    vel: { x: 0, y: 0, z: 0 },
    rot: Math.PI,
    boost: BOOST_MAX,
    boosting: false,
  };
}

function makeAiCar(): CarState {
  return {
    pos: { x: 0, y: CAR_H / 2, z: -(FIELD_H / 2 - 15) },
    vel: { x: 0, y: 0, z: 0 },
    rot: 0,
    boost: BOOST_MAX,
    boosting: false,
  };
}

function makeBall(): BallState {
  return {
    pos: { x: 0, y: BALL_RADIUS + 0.05, z: 0 },
    vel: { x: 0, y: 0, z: 0 },
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function dist3(a: Vec3, b: Vec3) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalize3(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 0.0001) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function dot3(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function useRocketSoccerLeagueGame() {
  // ── Refs for physics (updated every frame) ──────────────────────────────────
  const stateRef = useRef<GameState>({
    phase: 'idle',
    playerScore: 0,
    aiScore: 0,
    timer: MATCH_DURATION,
    player: makePlayerCar(),
    ai: makeAiCar(),
    ball: makeBall(),
    lastGoalBy: null,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const goalCooldownRef = useRef(0);

  // ── React state for UI ───────────────────────────────────────────────────────
  const [uiState, setUiState] = useState({
    phase: 'idle' as GameState['phase'],
    playerScore: 0,
    aiScore: 0,
    timer: MATCH_DURATION,
    lastGoalBy: null as 'player' | 'ai' | null,
  });

  // ── Keyboard listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ── Timer countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== 'playing') return;
      s.timer = Math.max(0, s.timer - 1);
      if (s.timer <= 0) {
        s.phase = 'finished';
        setUiState(prev => ({ ...prev, phase: 'finished', timer: 0 }));
      } else {
        setUiState(prev => ({ ...prev, timer: s.timer }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Physics update (called from useFrame) ───────────────────────────────────
  const update = useCallback((delta: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    const dt = Math.min(delta, 0.05);
    goalCooldownRef.current = Math.max(0, goalCooldownRef.current - dt);

    // ── Player car input ──────────────────────────────────────────────────────
    const keys = keysRef.current;
    const fwd = keys.has('w') || keys.has('arrowup');
    const bwd = keys.has('s') || keys.has('arrowdown');
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    const boost = keys.has('shift') || keys.has(' ');

    updateCar(s.player, fwd, bwd, left, right, boost, dt, 1);

    // ── AI car logic ──────────────────────────────────────────────────────────
    updateAI(s, dt);

    // ── Ball physics ──────────────────────────────────────────────────────────
    updateBall(s, dt);

    // ── Car-ball collisions ───────────────────────────────────────────────────
    carBallCollision(s.player, s.ball);
    carBallCollision(s.ai, s.ball);

    // ── Goal detection ────────────────────────────────────────────────────────
    if (goalCooldownRef.current <= 0) {
      const bz = s.ball.pos.z;
      const bx = s.ball.pos.x;
      const inGoalX = Math.abs(bx) < GOAL_W / 2;

      // Player scores (ball enters AI's goal at negative Z)
      if (bz < -(FIELD_H / 2) && inGoalX) {
        s.playerScore += 1;
        s.lastGoalBy = 'player';
        resetAfterGoal(s);
        goalCooldownRef.current = 2;
        setUiState({ phase: s.phase, playerScore: s.playerScore, aiScore: s.aiScore, timer: s.timer, lastGoalBy: 'player' });
      }
      // AI scores (ball enters player's goal at positive Z)
      else if (bz > FIELD_H / 2 && inGoalX) {
        s.aiScore += 1;
        s.lastGoalBy = 'ai';
        resetAfterGoal(s);
        goalCooldownRef.current = 2;
        setUiState({ phase: s.phase, playerScore: s.playerScore, aiScore: s.aiScore, timer: s.timer, lastGoalBy: 'ai' });
      }
    }
  }, []);

  const start = useCallback(() => {
    const s = stateRef.current;
    s.phase = 'playing';
    setUiState(prev => ({ ...prev, phase: 'playing' }));
  }, []);

  const restart = useCallback(() => {
    const s = stateRef.current;
    s.phase = 'playing';
    s.playerScore = 0;
    s.aiScore = 0;
    s.timer = MATCH_DURATION;
    s.lastGoalBy = null;
    s.player = makePlayerCar();
    s.ai = makeAiCar();
    s.ball = makeBall();
    goalCooldownRef.current = 0;
    keysRef.current.clear();
    setUiState({ phase: 'playing', playerScore: 0, aiScore: 0, timer: MATCH_DURATION, lastGoalBy: null });
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  return { update, start, restart, getState, uiState };
}

// ─── Car physics ──────────────────────────────────────────────────────────────
function updateCar(
  car: CarState,
  fwd: boolean, bwd: boolean, left: boolean, right: boolean,
  boost: boolean, dt: number, _side: number
) {
  const maxSpeed = boost ? CAR_BOOST_SPEED : CAR_SPEED;
  car.boosting = boost && car.boost > 0;

  // Boost drain/regen
  if (car.boosting) {
    car.boost = Math.max(0, car.boost - BOOST_DRAIN * dt);
    if (car.boost <= 0) car.boosting = false;
  } else {
    car.boost = Math.min(BOOST_MAX, car.boost + BOOST_REGEN * dt);
  }

  // Turning
  const speed2d = Math.sqrt(car.vel.x * car.vel.x + car.vel.z * car.vel.z);
  if (speed2d > 0.5) {
    if (left) car.rot += CAR_TURN_SPEED * dt;
    if (right) car.rot -= CAR_TURN_SPEED * dt;
  }

  // Acceleration
  const dirX = Math.sin(car.rot);
  const dirZ = Math.cos(car.rot);

  if (fwd) {
    car.vel.x += dirX * maxSpeed * dt * 6;
    car.vel.z += dirZ * maxSpeed * dt * 6;
  }
  if (bwd) {
    car.vel.x -= dirX * maxSpeed * 0.6 * dt * 6;
    car.vel.z -= dirZ * maxSpeed * 0.6 * dt * 6;
  }

  // Friction
  car.vel.x *= 0.88;
  car.vel.z *= 0.88;

  // Clamp speed
  const spd = Math.sqrt(car.vel.x * car.vel.x + car.vel.z * car.vel.z);
  if (spd > maxSpeed) {
    car.vel.x = (car.vel.x / spd) * maxSpeed;
    car.vel.z = (car.vel.z / spd) * maxSpeed;
  }

  // Move
  car.pos.x += car.vel.x * dt;
  car.pos.z += car.vel.z * dt;

  // Boundary clamp
  const hw = FIELD_W / 2 - CAR_W / 2;
  const hd = FIELD_H / 2 - CAR_D / 2;
  car.pos.x = clamp(car.pos.x, -hw, hw);
  car.pos.z = clamp(car.pos.z, -hd, hd);
  car.pos.y = CAR_H / 2;
}

// ─── AI logic ─────────────────────────────────────────────────────────────────
function updateAI(s: GameState, dt: number) {
  const ai = s.ai;
  const ball = s.ball;

  // Target: position slightly behind ball toward player's goal (positive Z)
  const targetX = ball.pos.x;
  const targetZ = ball.pos.z + 8; // approach from behind ball toward player goal (scaled for bigger field)

  const dx = targetX - ai.pos.x;
  const dz = targetZ - ai.pos.z;
  const distToBall = Math.sqrt(dx * dx + dz * dz);

  // Desired heading
  const desiredRot = Math.atan2(dx, dz);

  // Steer toward desired heading
  let rotDiff = desiredRot - ai.rot;
  while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
  while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
  ai.rot += clamp(rotDiff, -CAR_TURN_SPEED * dt * 2, CAR_TURN_SPEED * dt * 2);

  // Boost when far from ball (scaled threshold for bigger field)
  const useBoost = distToBall > 25 && ai.boost > 20;
  const fwd = distToBall > 3;

  updateCar(ai, fwd, false, false, false, useBoost, dt, -1);
}

// ─── Ball physics ─────────────────────────────────────────────────────────────
function updateBall(s: GameState, dt: number) {
  const b = s.ball;

  // Gravity
  b.vel.y += GRAVITY * dt;

  // Move
  b.pos.x += b.vel.x * dt;
  b.pos.y += b.vel.y * dt;
  b.pos.z += b.vel.z * dt;

  // Ground bounce
  if (b.pos.y <= BALL_RADIUS) {
    b.pos.y = BALL_RADIUS;
    b.vel.y = Math.abs(b.vel.y) * BALL_RESTITUTION;
    b.vel.x *= BALL_GROUND_FRICTION;
    b.vel.z *= BALL_GROUND_FRICTION;
    if (Math.abs(b.vel.y) < 0.5) b.vel.y = 0;
  }

  // Air friction
  b.vel.x *= BALL_FRICTION;
  b.vel.z *= BALL_FRICTION;

  // Side walls (X)
  const hw = FIELD_W / 2 - BALL_RADIUS;
  if (b.pos.x > hw) { b.pos.x = hw; b.vel.x = -Math.abs(b.vel.x) * BALL_RESTITUTION; }
  if (b.pos.x < -hw) { b.pos.x = -hw; b.vel.x = Math.abs(b.vel.x) * BALL_RESTITUTION; }

  // End walls (Z) — only bounce if NOT in goal opening
  const hd = FIELD_H / 2 - BALL_RADIUS;
  const inGoalX = Math.abs(b.pos.x) < GOAL_W / 2;
  const inGoalY = b.pos.y < GOAL_HEIGHT;

  if (b.pos.z > hd) {
    if (!(inGoalX && inGoalY)) {
      b.pos.z = hd;
      b.vel.z = -Math.abs(b.vel.z) * BALL_RESTITUTION;
    }
  }
  if (b.pos.z < -hd) {
    if (!(inGoalX && inGoalY)) {
      b.pos.z = -hd;
      b.vel.z = Math.abs(b.vel.z) * BALL_RESTITUTION;
    }
  }

  // Ceiling
  if (b.pos.y > WALL_H + BALL_RADIUS) {
    b.pos.y = WALL_H + BALL_RADIUS;
    b.vel.y = -Math.abs(b.vel.y) * BALL_RESTITUTION;
  }
}

// ─── Car-ball collision ───────────────────────────────────────────────────────
function carBallCollision(car: CarState, ball: BallState) {
  const collisionRadius = CAR_W * 0.8 + BALL_RADIUS;
  const d = dist3(car.pos, ball.pos);
  if (d < collisionRadius && d > 0.001) {
    const normal = normalize3({
      x: ball.pos.x - car.pos.x,
      y: ball.pos.y - car.pos.y,
      z: ball.pos.z - car.pos.z,
    });

    // Push ball out of car
    ball.pos.x = car.pos.x + normal.x * collisionRadius;
    ball.pos.y = car.pos.y + normal.y * collisionRadius;
    ball.pos.z = car.pos.z + normal.z * collisionRadius;

    // Transfer velocity
    const carSpeed = Math.sqrt(car.vel.x * car.vel.x + car.vel.z * car.vel.z);
    const relVel = {
      x: ball.vel.x - car.vel.x,
      y: ball.vel.y - car.vel.y,
      z: ball.vel.z - car.vel.z,
    };
    const relDot = dot3(relVel, normal);
    if (relDot < 0) {
      const impulse = -(1 + BALL_RESTITUTION) * relDot;
      ball.vel.x += normal.x * impulse;
      ball.vel.y += normal.y * impulse + 4;
      ball.vel.z += normal.z * impulse;
    }

    // Extra kick based on car speed
    const kick = Math.max(carSpeed * 0.8, 8);
    ball.vel.x += normal.x * kick;
    ball.vel.y += Math.abs(normal.y) * kick * 0.5 + 2;
    ball.vel.z += normal.z * kick;
  }
}

// ─── Reset after goal ─────────────────────────────────────────────────────────
function resetAfterGoal(s: GameState) {
  s.ball = makeBall();
  s.player = makePlayerCar();
  s.ai = makeAiCar();
}
