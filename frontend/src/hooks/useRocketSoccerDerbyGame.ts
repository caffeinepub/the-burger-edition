import { useRef, useState, useEffect, useCallback } from 'react';

// ─── Field Constants (5x standard soccer pitch: 105m × 68m → 525 × 340) ──────
export const FIELD_W = 525;
export const FIELD_H = 340;
export const GOAL_W = 36;       // 5x standard ~7.32m
export const GOAL_DEPTH = 12;
export const GOAL_HEIGHT = 14;  // 5x standard ~2.44m
export const WALL_H = 8;
export const BALL_RADIUS = 2.5;
export const CAR_W = 4.5;
export const CAR_H = 2.0;
export const CAR_D = 7.0;
export const CAR_SPEED = 55;
export const CAR_BOOST_SPEED = 110;
export const CAR_TURN_SPEED = 2.0;
export const BOOST_MAX = 100;
export const BOOST_DRAIN = 35;
export const BOOST_REGEN = 18;
export const GRAVITY = -35;
export const BALL_RESTITUTION = 0.68;
export const BALL_FRICTION = 0.988;
export const BALL_GROUND_FRICTION = 0.975;
export const MATCH_DURATION = 300; // 5 minutes

export interface Vec3 { x: number; y: number; z: number; }

export interface CarState {
  pos: Vec3;
  vel: Vec3;
  rot: number;
  boost: number;
  boosting: boolean;
}

export interface BallState {
  pos: Vec3;
  vel: Vec3;
}

export interface GameState {
  phase: 'idle' | 'playing' | 'goal' | 'finished';
  blueScore: number;
  orangeScore: number;
  timer: number;
  player: CarState;
  ai: CarState;
  ball: BallState;
  lastGoalBy: 'blue' | 'orange' | null;
  goalFlash: number; // countdown for goal flash effect
}

function makePlayerCar(): CarState {
  return {
    pos: { x: 0, y: CAR_H / 2, z: FIELD_H / 2 - 20 },
    vel: { x: 0, y: 0, z: 0 },
    rot: Math.PI,
    boost: BOOST_MAX,
    boosting: false,
  };
}

function makeAiCar(): CarState {
  return {
    pos: { x: 0, y: CAR_H / 2, z: -(FIELD_H / 2 - 20) },
    vel: { x: 0, y: 0, z: 0 },
    rot: 0,
    boost: BOOST_MAX,
    boosting: false,
  };
}

function makeBall(): BallState {
  return {
    pos: { x: 0, y: BALL_RADIUS + 0.1, z: 0 },
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

// ─── Car physics ──────────────────────────────────────────────────────────────
function updateCar(
  car: CarState,
  fwd: boolean, bwd: boolean, left: boolean, right: boolean,
  boost: boolean, dt: number
) {
  const maxSpeed = boost ? CAR_BOOST_SPEED : CAR_SPEED;
  car.boosting = boost && car.boost > 0;

  if (car.boosting) {
    car.boost = Math.max(0, car.boost - BOOST_DRAIN * dt);
    if (car.boost <= 0) car.boosting = false;
  } else {
    car.boost = Math.min(BOOST_MAX, car.boost + BOOST_REGEN * dt);
  }

  const speed2d = Math.sqrt(car.vel.x * car.vel.x + car.vel.z * car.vel.z);
  if (speed2d > 0.5) {
    if (left) car.rot += CAR_TURN_SPEED * dt;
    if (right) car.rot -= CAR_TURN_SPEED * dt;
  }

  const dirX = Math.sin(car.rot);
  const dirZ = Math.cos(car.rot);

  if (fwd) {
    car.vel.x += dirX * maxSpeed * dt * 5;
    car.vel.z += dirZ * maxSpeed * dt * 5;
  }
  if (bwd) {
    car.vel.x -= dirX * maxSpeed * 0.55 * dt * 5;
    car.vel.z -= dirZ * maxSpeed * 0.55 * dt * 5;
  }

  car.vel.x *= 0.87;
  car.vel.z *= 0.87;

  const spd = Math.sqrt(car.vel.x * car.vel.x + car.vel.z * car.vel.z);
  if (spd > maxSpeed) {
    car.vel.x = (car.vel.x / spd) * maxSpeed;
    car.vel.z = (car.vel.z / spd) * maxSpeed;
  }

  car.pos.x += car.vel.x * dt;
  car.pos.z += car.vel.z * dt;

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

  // Aim slightly behind ball toward player goal (positive Z)
  const targetX = ball.pos.x;
  const targetZ = ball.pos.z + 12;

  const dx = targetX - ai.pos.x;
  const dz = targetZ - ai.pos.z;
  const distToBall = Math.sqrt(dx * dx + dz * dz);

  const desiredRot = Math.atan2(dx, dz);
  let rotDiff = desiredRot - ai.rot;
  while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
  while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
  ai.rot += clamp(rotDiff, -CAR_TURN_SPEED * dt * 2.2, CAR_TURN_SPEED * dt * 2.2);

  const useBoost = distToBall > 40 && ai.boost > 20;
  const fwd = distToBall > 4;

  updateCar(ai, fwd, false, false, false, useBoost, dt);
}

// ─── Ball physics ─────────────────────────────────────────────────────────────
function updateBall(s: GameState, dt: number) {
  const b = s.ball;

  b.vel.y += GRAVITY * dt;

  b.pos.x += b.vel.x * dt;
  b.pos.y += b.vel.y * dt;
  b.pos.z += b.vel.z * dt;

  if (b.pos.y <= BALL_RADIUS) {
    b.pos.y = BALL_RADIUS;
    b.vel.y = Math.abs(b.vel.y) * BALL_RESTITUTION;
    b.vel.x *= BALL_GROUND_FRICTION;
    b.vel.z *= BALL_GROUND_FRICTION;
    if (Math.abs(b.vel.y) < 0.5) b.vel.y = 0;
  }

  b.vel.x *= BALL_FRICTION;
  b.vel.z *= BALL_FRICTION;

  const hw = FIELD_W / 2 - BALL_RADIUS;
  if (b.pos.x > hw) { b.pos.x = hw; b.vel.x = -Math.abs(b.vel.x) * BALL_RESTITUTION; }
  if (b.pos.x < -hw) { b.pos.x = -hw; b.vel.x = Math.abs(b.vel.x) * BALL_RESTITUTION; }

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

  if (b.pos.y > WALL_H + BALL_RADIUS) {
    b.pos.y = WALL_H + BALL_RADIUS;
    b.vel.y = -Math.abs(b.vel.y) * BALL_RESTITUTION;
  }
}

// ─── Car-ball collision ───────────────────────────────────────────────────────
function carBallCollision(car: CarState, ball: BallState) {
  const collisionRadius = CAR_W * 0.85 + BALL_RADIUS;
  const d = dist3(car.pos, ball.pos);
  if (d < collisionRadius && d > 0.001) {
    const normal = normalize3({
      x: ball.pos.x - car.pos.x,
      y: ball.pos.y - car.pos.y,
      z: ball.pos.z - car.pos.z,
    });

    ball.pos.x = car.pos.x + normal.x * collisionRadius;
    ball.pos.y = car.pos.y + normal.y * collisionRadius;
    ball.pos.z = car.pos.z + normal.z * collisionRadius;

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
      ball.vel.y += normal.y * impulse + 5;
      ball.vel.z += normal.z * impulse;
    }

    const kick = Math.max(carSpeed * 0.9, 10);
    ball.vel.x += normal.x * kick;
    ball.vel.y += Math.abs(normal.y) * kick * 0.5 + 3;
    ball.vel.z += normal.z * kick;
  }
}

function resetAfterGoal(s: GameState) {
  s.ball = makeBall();
  s.player = makePlayerCar();
  s.ai = makeAiCar();
  s.goalFlash = 2.5;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRocketSoccerDerbyGame() {
  const stateRef = useRef<GameState>({
    phase: 'idle',
    blueScore: 0,
    orangeScore: 0,
    timer: MATCH_DURATION,
    player: makePlayerCar(),
    ai: makeAiCar(),
    ball: makeBall(),
    lastGoalBy: null,
    goalFlash: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const goalCooldownRef = useRef(0);

  const [uiState, setUiState] = useState({
    phase: 'idle' as GameState['phase'],
    blueScore: 0,
    orangeScore: 0,
    timer: MATCH_DURATION,
    lastGoalBy: null as 'blue' | 'orange' | null,
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
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

  const update = useCallback((delta: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    const dt = Math.min(delta, 0.05);
    goalCooldownRef.current = Math.max(0, goalCooldownRef.current - dt);
    if (s.goalFlash > 0) s.goalFlash = Math.max(0, s.goalFlash - dt);

    const keys = keysRef.current;
    const fwd = keys.has('w') || keys.has('arrowup');
    const bwd = keys.has('s') || keys.has('arrowdown');
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    // Space bar for boost
    const boost = keys.has(' ');

    updateCar(s.player, fwd, bwd, left, right, boost, dt);
    updateAI(s, dt);
    updateBall(s, dt);
    carBallCollision(s.player, s.ball);
    carBallCollision(s.ai, s.ball);

    if (goalCooldownRef.current <= 0) {
      const bz = s.ball.pos.z;
      const bx = s.ball.pos.x;
      const inGoalX = Math.abs(bx) < GOAL_W / 2;

      // Blue scores (ball enters AI's goal at negative Z)
      if (bz < -(FIELD_H / 2) && inGoalX) {
        s.blueScore += 1;
        s.lastGoalBy = 'blue';
        resetAfterGoal(s);
        goalCooldownRef.current = 2.5;
        setUiState({ phase: s.phase, blueScore: s.blueScore, orangeScore: s.orangeScore, timer: s.timer, lastGoalBy: 'blue' });
      }
      // Orange scores (ball enters player's goal at positive Z)
      else if (bz > FIELD_H / 2 && inGoalX) {
        s.orangeScore += 1;
        s.lastGoalBy = 'orange';
        resetAfterGoal(s);
        goalCooldownRef.current = 2.5;
        setUiState({ phase: s.phase, blueScore: s.blueScore, orangeScore: s.orangeScore, timer: s.timer, lastGoalBy: 'orange' });
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
    s.blueScore = 0;
    s.orangeScore = 0;
    s.timer = MATCH_DURATION;
    s.lastGoalBy = null;
    s.goalFlash = 0;
    s.player = makePlayerCar();
    s.ai = makeAiCar();
    s.ball = makeBall();
    goalCooldownRef.current = 0;
    keysRef.current.clear();
    setUiState({ phase: 'playing', blueScore: 0, orangeScore: 0, timer: MATCH_DURATION, lastGoalBy: null });
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  return { update, start, restart, getState, uiState };
}
