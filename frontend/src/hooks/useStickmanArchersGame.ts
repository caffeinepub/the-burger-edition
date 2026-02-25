import { useRef, useState, useCallback } from 'react';

export type GameMode = 'single' | 'two-player';
export type GamePhase = 'idle' | 'playing' | 'gameover';

export interface Archer {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  facingRight: boolean;
  aimAngle: number; // degrees, 0 = horizontal
  isPlayer1: boolean;
}

export interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer1: boolean;
  active: boolean;
}

export interface GameStateData {
  archer1: Archer;
  archer2: Archer;
  arrows: Arrow[];
  phase: GamePhase;
  winner: 1 | 2 | null;
  mode: GameMode;
  turn: 1 | 2; // whose turn it is to shoot
  shootCooldown1: number;
  shootCooldown2: number;
}

const CANVAS_W = 700;
const CANVAS_H = 350;
const GROUND_Y = CANVAS_H - 60;
const ARCHER_HEALTH = 100;
const ARROW_SPEED = 14;
const GRAVITY = 0.45;
const HIT_RADIUS = 22;
const COOLDOWN_FRAMES = 40;
const AI_SHOOT_DELAY = 90; // frames before AI shoots

function createInitialState(mode: GameMode): GameStateData {
  return {
    archer1: {
      x: 90,
      y: GROUND_Y,
      health: ARCHER_HEALTH,
      maxHealth: ARCHER_HEALTH,
      facingRight: true,
      aimAngle: 35,
      isPlayer1: true,
    },
    archer2: {
      x: CANVAS_W - 90,
      y: GROUND_Y,
      health: ARCHER_HEALTH,
      maxHealth: ARCHER_HEALTH,
      facingRight: false,
      aimAngle: 35,
      isPlayer1: false,
    },
    arrows: [],
    phase: 'idle',
    winner: null,
    mode,
    turn: 1,
    shootCooldown1: 0,
    shootCooldown2: 0,
  };
}

export function useStickmanArchersGame() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [mode, setMode] = useState<GameMode>('single');
  const [aim1, setAim1] = useState(35);
  const [aim2, setAim2] = useState(35);
  const [health1, setHealth1] = useState(ARCHER_HEALTH);
  const [health2, setHealth2] = useState(ARCHER_HEALTH);
  const [turn, setTurn] = useState<1 | 2>(1);

  const stateRef = useRef<GameStateData>(createInitialState('single'));
  const rafRef = useRef<number | null>(null);
  const aiTimerRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startGame = useCallback((selectedMode?: GameMode) => {
    stopLoop();
    const m = selectedMode ?? mode;
    setMode(m);
    const initial = createInitialState(m);
    stateRef.current = initial;
    setPhase('playing');
    setWinner(null);
    setAim1(initial.archer1.aimAngle);
    setAim2(initial.archer2.aimAngle);
    setHealth1(ARCHER_HEALTH);
    setHealth2(ARCHER_HEALTH);
    setTurn(1);
    aiTimerRef.current = 0;
  }, [mode, stopLoop]);

  const restartGame = useCallback(() => {
    startGame(stateRef.current.mode);
  }, [startGame]);

  const adjustAim = useCallback((player: 1 | 2, delta: number) => {
    const state = stateRef.current;
    if (state.phase !== 'playing') return;
    if (player === 1) {
      const newAngle = Math.max(5, Math.min(75, state.archer1.aimAngle + delta));
      state.archer1.aimAngle = newAngle;
      setAim1(newAngle);
    } else {
      const newAngle = Math.max(5, Math.min(75, state.archer2.aimAngle + delta));
      state.archer2.aimAngle = newAngle;
      setAim2(newAngle);
    }
  }, []);

  const shootArrow = useCallback((player: 1 | 2) => {
    const state = stateRef.current;
    if (state.phase !== 'playing') return;
    if (player === 1 && state.shootCooldown1 > 0) return;
    if (player === 2 && state.shootCooldown2 > 0) return;

    const archer = player === 1 ? state.archer1 : state.archer2;
    const angleRad = (archer.aimAngle * Math.PI) / 180;
    const dir = archer.facingRight ? 1 : -1;

    const arrow: Arrow = {
      x: archer.x + dir * 18,
      y: archer.y - 28,
      vx: dir * ARROW_SPEED * Math.cos(angleRad),
      vy: -ARROW_SPEED * Math.sin(angleRad),
      fromPlayer1: player === 1,
      active: true,
    };

    state.arrows.push(arrow);
    if (player === 1) state.shootCooldown1 = COOLDOWN_FRAMES;
    else state.shootCooldown2 = COOLDOWN_FRAMES;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key);
    const state = stateRef.current;
    if (state.phase !== 'playing') return;

    // Player 1 controls: W/S to aim, Space to shoot
    if (e.key === 'w' || e.key === 'W') { adjustAim(1, -3); e.preventDefault(); }
    if (e.key === 's' || e.key === 'S') { adjustAim(1, 3); e.preventDefault(); }
    if (e.key === ' ') { shootArrow(1); e.preventDefault(); }

    // Player 2 controls (two-player mode): Up/Down to aim, Enter to shoot
    if (state.mode === 'two-player') {
      if (e.key === 'ArrowUp') { adjustAim(2, -3); e.preventDefault(); }
      if (e.key === 'ArrowDown') { adjustAim(2, 3); e.preventDefault(); }
      if (e.key === 'Enter') { shootArrow(2); e.preventDefault(); }
    }
  }, [adjustAim, shootArrow]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key);
  }, []);

  // Game tick — called from the canvas component's animation loop
  const tick = useCallback(() => {
    const state = stateRef.current;
    if (state.phase !== 'playing') return;

    // Cooldowns
    if (state.shootCooldown1 > 0) state.shootCooldown1--;
    if (state.shootCooldown2 > 0) state.shootCooldown2--;

    // AI logic
    if (state.mode === 'single') {
      aiTimerRef.current++;
      if (aiTimerRef.current >= AI_SHOOT_DELAY && state.shootCooldown2 === 0) {
        // AI aims with slight randomness
        const dx = state.archer1.x - state.archer2.x;
        const dy = state.archer1.y - state.archer2.y;
        const dist = Math.abs(dx);
        // Simple ballistic estimate
        const optimalAngle = Math.max(10, Math.min(70, 45 + (Math.random() - 0.5) * 20));
        state.archer2.aimAngle = optimalAngle;
        setAim2(optimalAngle);
        void dist; void dy;
        shootArrow(2);
        aiTimerRef.current = 0;
      }
    }

    // Update arrows
    for (const arrow of state.arrows) {
      if (!arrow.active) continue;
      arrow.x += arrow.vx;
      arrow.y += arrow.vy;
      arrow.vy += GRAVITY;

      // Out of bounds
      if (arrow.x < -20 || arrow.x > CANVAS_W + 20 || arrow.y > CANVAS_H + 20) {
        arrow.active = false;
        continue;
      }

      // Hit ground
      if (arrow.y >= GROUND_Y - 5) {
        arrow.active = false;
        continue;
      }

      // Collision with archers
      if (arrow.fromPlayer1) {
        const a2 = state.archer2;
        const dist = Math.hypot(arrow.x - a2.x, arrow.y - (a2.y - 20));
        if (dist < HIT_RADIUS) {
          arrow.active = false;
          a2.health = Math.max(0, a2.health - 25);
          setHealth2(a2.health);
          if (a2.health <= 0) {
            state.phase = 'gameover';
            state.winner = 1;
            setPhase('gameover');
            setWinner(1);
          }
        }
      } else {
        const a1 = state.archer1;
        const dist = Math.hypot(arrow.x - a1.x, arrow.y - (a1.y - 20));
        if (dist < HIT_RADIUS) {
          arrow.active = false;
          a1.health = Math.max(0, a1.health - 25);
          setHealth1(a1.health);
          if (a1.health <= 0) {
            state.phase = 'gameover';
            state.winner = 2;
            setPhase('gameover');
            setWinner(2);
          }
        }
      }
    }

    // Remove inactive arrows
    state.arrows = state.arrows.filter((a) => a.active);
  }, [shootArrow]);

  return {
    stateRef,
    phase,
    winner,
    mode,
    aim1,
    aim2,
    health1,
    health2,
    turn,
    startGame,
    restartGame,
    adjustAim,
    shootArrow,
    handleKeyDown,
    handleKeyUp,
    tick,
    CANVAS_W,
    CANVAS_H,
    GROUND_Y,
    ARCHER_HEALTH,
  };
}
