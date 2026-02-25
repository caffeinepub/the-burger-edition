import { useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Vec2 { x: number; y: number; }

export interface Platform {
  x: number; y: number;
  w: number; h: number;
  type: 'solid' | 'hazard';
}

export interface LevelExit {
  x: number; y: number;
  w: number; h: number;
}

export interface LevelData {
  platforms: Platform[];
  exit: LevelExit;
  spawnX: number;
  spawnY: number;
  width: number;   // total level scroll width
  bgColor: string;
}

export type PlayerState = 'running' | 'jumping' | 'falling' | 'sliding' | 'dead';

export interface Player {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  state: PlayerState;
  onGround: boolean;
  onWall: number;   // -1 left wall, 1 right wall, 0 none
  slideTimer: number;
  coyoteTime: number;
  jumpBuffer: number;
  facingRight: boolean;
}

export interface OvoGameState {
  player: Player;
  level: number;
  levelTime: number;       // seconds for current level
  totalTime: number;       // accumulated seconds from previous levels
  phase: 'idle' | 'playing' | 'levelComplete' | 'gameComplete' | 'dead';
  cameraX: number;
  deathTimer: number;
}

// ─── Level Definitions ────────────────────────────────────────────────────────

const CANVAS_H = 400;
const GROUND_Y = CANVAS_H - 40;

export const LEVELS: LevelData[] = [
  // ── Level 1: Introduction ──────────────────────────────────────────────────
  {
    spawnX: 60, spawnY: GROUND_Y - 48,
    width: 2400,
    bgColor: '#0a0a0f',
    exit: { x: 2320, y: GROUND_Y - 80, w: 40, h: 80 },
    platforms: [
      // Ground segments (gaps between them)
      { x: 0,    y: GROUND_Y, w: 300,  h: 40, type: 'solid' },
      { x: 340,  y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 580,  y: GROUND_Y, w: 160,  h: 40, type: 'solid' },
      { x: 780,  y: GROUND_Y, w: 300,  h: 40, type: 'solid' },
      { x: 1120, y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 1360, y: GROUND_Y, w: 300,  h: 40, type: 'solid' },
      { x: 1700, y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 1940, y: GROUND_Y, w: 460,  h: 40, type: 'solid' },
      // Floating platforms
      { x: 320,  y: GROUND_Y - 100, w: 80,  h: 16, type: 'solid' },
      { x: 560,  y: GROUND_Y - 80,  w: 80,  h: 16, type: 'solid' },
      { x: 1080, y: GROUND_Y - 100, w: 80,  h: 16, type: 'solid' },
      { x: 1660, y: GROUND_Y - 100, w: 80,  h: 16, type: 'solid' },
      // Low ceiling (slide under)
      { x: 900,  y: GROUND_Y - 56,  w: 180, h: 16, type: 'solid' },
      // Hazard spikes
      { x: 420,  y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 1200, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 1800, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      // Wall for wall-jump
      { x: 1300, y: GROUND_Y - 200, w: 20,  h: 200, type: 'solid' },
    ],
  },

  // ── Level 2: Intermediate ──────────────────────────────────────────────────
  {
    spawnX: 60, spawnY: GROUND_Y - 48,
    width: 2800,
    bgColor: '#080810',
    exit: { x: 2720, y: GROUND_Y - 80, w: 40, h: 80 },
    platforms: [
      // Ground
      { x: 0,    y: GROUND_Y, w: 260,  h: 40, type: 'solid' },
      { x: 300,  y: GROUND_Y, w: 160,  h: 40, type: 'solid' },
      { x: 520,  y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 700,  y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 960,  y: GROUND_Y, w: 160,  h: 40, type: 'solid' },
      { x: 1180, y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 1440, y: GROUND_Y, w: 160,  h: 40, type: 'solid' },
      { x: 1660, y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 1920, y: GROUND_Y, w: 160,  h: 40, type: 'solid' },
      { x: 2140, y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 2400, y: GROUND_Y, w: 400,  h: 40, type: 'solid' },
      // Staircase platforms
      { x: 280,  y: GROUND_Y - 80,  w: 80, h: 16, type: 'solid' },
      { x: 500,  y: GROUND_Y - 140, w: 80, h: 16, type: 'solid' },
      { x: 680,  y: GROUND_Y - 80,  w: 80, h: 16, type: 'solid' },
      { x: 940,  y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 1160, y: GROUND_Y - 80,  w: 80, h: 16, type: 'solid' },
      { x: 1420, y: GROUND_Y - 140, w: 80, h: 16, type: 'solid' },
      { x: 1640, y: GROUND_Y - 80,  w: 80, h: 16, type: 'solid' },
      { x: 1900, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 2120, y: GROUND_Y - 80,  w: 80, h: 16, type: 'solid' },
      { x: 2380, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      // Low ceilings (slide sections)
      { x: 700,  y: GROUND_Y - 56,  w: 220, h: 16, type: 'solid' },
      { x: 1660, y: GROUND_Y - 56,  w: 220, h: 16, type: 'solid' },
      // Hazards
      { x: 380,  y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 760,  y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 1060, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 1540, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 1760, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 2020, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      { x: 2300, y: GROUND_Y - 16,  w: 60,  h: 16, type: 'hazard' },
      // Wall-jump walls
      { x: 1380, y: GROUND_Y - 220, w: 20, h: 220, type: 'solid' },
      { x: 2100, y: GROUND_Y - 220, w: 20, h: 220, type: 'solid' },
    ],
  },

  // ── Level 3: Expert ────────────────────────────────────────────────────────
  {
    spawnX: 60, spawnY: GROUND_Y - 48,
    width: 3200,
    bgColor: '#060608',
    exit: { x: 3120, y: GROUND_Y - 80, w: 40, h: 80 },
    platforms: [
      // Ground with many gaps
      { x: 0,    y: GROUND_Y, w: 200,  h: 40, type: 'solid' },
      { x: 240,  y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 420,  y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 580,  y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 760,  y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 920,  y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 1100, y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 1260, y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 1440, y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 1600, y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 1780, y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 1940, y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 2120, y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 2280, y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 2460, y: GROUND_Y, w: 100,  h: 40, type: 'solid' },
      { x: 2620, y: GROUND_Y, w: 120,  h: 40, type: 'solid' },
      { x: 2800, y: GROUND_Y, w: 400,  h: 40, type: 'solid' },
      // High platforms (double-jump style)
      { x: 220,  y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 400,  y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 560,  y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 740,  y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 900,  y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 1080, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 1240, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 1420, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 1580, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 1760, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 1920, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 2100, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 2260, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 2440, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      { x: 2600, y: GROUND_Y - 120, w: 80, h: 16, type: 'solid' },
      { x: 2780, y: GROUND_Y - 160, w: 80, h: 16, type: 'solid' },
      // Slide tunnels
      { x: 760,  y: GROUND_Y - 56,  w: 120, h: 16, type: 'solid' },
      { x: 1440, y: GROUND_Y - 56,  w: 120, h: 16, type: 'solid' },
      { x: 2120, y: GROUND_Y - 56,  w: 120, h: 16, type: 'solid' },
      // Dense hazards
      { x: 300,  y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 500,  y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 660,  y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 840,  y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1000, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1160, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1320, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1500, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1660, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 1840, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 2000, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 2180, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 2340, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 2520, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      { x: 2680, y: GROUND_Y - 16,  w: 40,  h: 16, type: 'hazard' },
      // Wall-jump walls
      { x: 1200, y: GROUND_Y - 240, w: 20, h: 240, type: 'solid' },
      { x: 1880, y: GROUND_Y - 240, w: 20, h: 240, type: 'solid' },
      { x: 2560, y: GROUND_Y - 240, w: 20, h: 240, type: 'solid' },
    ],
  },
];

// ─── Physics constants ────────────────────────────────────────────────────────

const GRAVITY       = 1400;   // px/s²
const JUMP_VY       = -520;
const WALL_JUMP_VX  = 280;
const WALL_JUMP_VY  = -460;
const RUN_SPEED     = 260;
const SLIDE_SPEED   = 340;
const SLIDE_DURATION = 0.38;  // seconds
const COYOTE_TIME   = 0.1;
const JUMP_BUFFER   = 0.12;
const PLAYER_W      = 22;
const PLAYER_H      = 40;
const SLIDE_H       = 22;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface OvoGameControls {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameStateRef: React.MutableRefObject<OvoGameState>;
  startGame: () => void;
  restartLevel: () => void;
  keysRef: React.MutableRefObject<Set<string>>;
}

function makePlayer(level: LevelData): Player {
  return {
    x: level.spawnX,
    y: level.spawnY,
    vx: 0, vy: 0,
    w: PLAYER_W, h: PLAYER_H,
    state: 'running',
    onGround: false,
    onWall: 0,
    slideTimer: 0,
    coyoteTime: 0,
    jumpBuffer: 0,
    facingRight: true,
  };
}

function makeState(levelIdx: number, totalTime: number): OvoGameState {
  const level = LEVELS[levelIdx];
  return {
    player: makePlayer(level),
    level: levelIdx,
    levelTime: 0,
    totalTime,
    phase: 'playing',
    cameraX: 0,
    deathTimer: 0,
  };
}

export function useOvoGame(): OvoGameControls {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const gameStateRef = useRef<OvoGameState>({
    player: makePlayer(LEVELS[0]),
    level: 0,
    levelTime: 0,
    totalTime: 0,
    phase: 'idle',
    cameraX: 0,
    deathTimer: 0,
  });

  // ── Collision helpers ──────────────────────────────────────────────────────

  const resolveCollisions = useCallback((p: Player, platforms: Platform[], dt: number) => {
    const sliding = p.slideTimer > 0;
    const ph = sliding ? SLIDE_H : PLAYER_H;
    // Adjust y when transitioning from slide to stand
    if (!sliding && p.h === SLIDE_H) {
      p.y -= (PLAYER_H - SLIDE_H);
    }
    p.h = ph;

    p.onGround = false;
    p.onWall = 0;

    // Horizontal move
    p.x += p.vx * dt;

    for (const plat of platforms) {
      if (plat.type === 'hazard') continue;
      const overlapX = p.x + p.w > plat.x && p.x < plat.x + plat.w;
      const overlapY = p.y + p.h > plat.y && p.y < plat.y + plat.h;
      if (!overlapX || !overlapY) continue;

      const fromLeft  = (p.x + p.w) - plat.x;
      const fromRight = (plat.x + plat.w) - p.x;
      const fromTop   = (p.y + p.h) - plat.y;
      const fromBot   = (plat.y + plat.h) - p.y;

      const minH = Math.min(fromLeft, fromRight);
      const minV = Math.min(fromTop, fromBot);

      if (minH < minV) {
        // Horizontal push
        if (fromLeft < fromRight) {
          p.x = plat.x - p.w;
          if (p.vx > 0) { p.vx = 0; p.onWall = 1; }
        } else {
          p.x = plat.x + plat.w;
          if (p.vx < 0) { p.vx = 0; p.onWall = -1; }
        }
      }
    }

    // Vertical move
    p.y += p.vy * dt;

    for (const plat of platforms) {
      if (plat.type === 'hazard') continue;
      const overlapX = p.x + p.w > plat.x && p.x < plat.x + plat.w;
      const overlapY = p.y + p.h > plat.y && p.y < plat.y + plat.h;
      if (!overlapX || !overlapY) continue;

      const fromTop = (p.y + p.h) - plat.y;
      const fromBot = (plat.y + plat.h) - p.y;

      if (fromTop < fromBot) {
        // Landing on top
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else {
        // Hitting ceiling
        p.y = plat.y + plat.h;
        if (p.vy < 0) p.vy = 0;
      }
    }
  }, []);

  const checkHazards = useCallback((p: Player, platforms: Platform[]): boolean => {
    for (const plat of platforms) {
      if (plat.type !== 'hazard') continue;
      if (
        p.x + p.w > plat.x && p.x < plat.x + plat.w &&
        p.y + p.h > plat.y && p.y < plat.y + plat.h
      ) return true;
    }
    return false;
  }, []);

  const checkExit = useCallback((p: Player, exit: LevelExit): boolean => {
    return (
      p.x + p.w > exit.x && p.x < exit.x + exit.w &&
      p.y + p.h > exit.y && p.y < exit.y + exit.h
    );
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gs = gameStateRef.current;
    const level = LEVELS[gs.level];
    const p = gs.player;
    const cam = gs.cameraX;

    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = 'rgba(0, 255, 200, 0.04)';
    for (let gx = 0; gx < W; gx += 32) {
      for (let gy = 0; gy < H; gy += 32) {
        ctx.fillRect(gx, gy, 2, 2);
      }
    }

    ctx.save();
    ctx.translate(-cam, 0);

    // Platforms
    for (const plat of level.platforms) {
      if (plat.type === 'hazard') {
        // Spikes
        ctx.fillStyle = '#ff2d78';
        ctx.shadowColor = '#ff2d78';
        ctx.shadowBlur = 8;
        const spikeW = 12;
        const count = Math.floor(plat.w / spikeW);
        for (let i = 0; i < count; i++) {
          const sx = plat.x + i * spikeW;
          ctx.beginPath();
          ctx.moveTo(sx, plat.y + plat.h);
          ctx.lineTo(sx + spikeW / 2, plat.y);
          ctx.lineTo(sx + spikeW, plat.y + plat.h);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        // Solid platform
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        // Top edge glow
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.fillRect(plat.x, plat.y, plat.w, 3);
        ctx.shadowBlur = 0;
      }
    }

    // Exit portal
    const ex = level.exit;
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 300);
    ctx.fillStyle = `rgba(57, 255, 20, ${0.15 * pulse})`;
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.strokeStyle = `rgba(57, 255, 20, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 12 * pulse;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
    ctx.shadowBlur = 0;
    // EXIT label
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ex.x + ex.w / 2, ex.y - 6);

    // Player (stickman)
    const px = p.x + p.w / 2;
    const py = p.y;
    const ph = p.h;
    const sliding = p.slideTimer > 0;
    const dir = p.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(px, py);

    const bodyColor = '#00e5ff';
    ctx.strokeStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    if (sliding) {
      // Slide pose
      const headR = 7;
      ctx.beginPath();
      ctx.arc(dir * 8, 6, headR, 0, Math.PI * 2);
      ctx.stroke();
      // Body horizontal
      ctx.beginPath();
      ctx.moveTo(dir * 8, 13);
      ctx.lineTo(-dir * 8, 13);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(-dir * 8, 13);
      ctx.lineTo(-dir * 14, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 13);
      ctx.lineTo(dir * 4, 20);
      ctx.stroke();
      // Arms
      ctx.beginPath();
      ctx.moveTo(dir * 2, 13);
      ctx.lineTo(dir * 14, 8);
      ctx.stroke();
    } else {
      // Standing/jumping pose
      const headR = 7;
      const headY = 7;
      const bodyTop = headY + headR;
      const bodyBot = ph - 4;
      const midY = bodyTop + (bodyBot - bodyTop) * 0.45;

      // Head
      ctx.beginPath();
      ctx.arc(0, headY, headR, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(0, bodyTop);
      ctx.lineTo(0, bodyBot);
      ctx.stroke();

      // Arms (animated run swing)
      const armSwing = p.onGround ? Math.sin(Date.now() / 120) * 12 : 0;
      ctx.beginPath();
      ctx.moveTo(0, midY - 4);
      ctx.lineTo(dir * 12 + armSwing, midY + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, midY - 4);
      ctx.lineTo(-dir * 12 - armSwing, midY + 6);
      ctx.stroke();

      // Legs (animated)
      const legSwing = p.onGround ? Math.sin(Date.now() / 120) * 10 : 0;
      ctx.beginPath();
      ctx.moveTo(0, bodyBot);
      ctx.lineTo(dir * 8 + legSwing, bodyBot + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, bodyBot);
      ctx.lineTo(-dir * 8 - legSwing, bodyBot + 10);
      ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;

    ctx.restore(); // camera

    // HUD
    const elapsed = gs.levelTime;
    const mins = Math.floor(elapsed / 60);
    const secs = (elapsed % 60).toFixed(2).padStart(5, '0');
    const timeStr = `${mins}:${secs}`;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, 36);

    ctx.fillStyle = '#00e5ff';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LVL ${gs.level + 1}/3`, 12, 22);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 6;
    ctx.fillText(`TIME: ${timeStr}`, W / 2, 22);
    ctx.shadowBlur = 0;

    const totalStr = `TOTAL: ${formatTime(gs.totalTime + gs.levelTime)}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffea00';
    ctx.fillText(totalStr, W - 12, 22);

    // Death flash
    if (gs.phase === 'dead' && gs.deathTimer > 0) {
      const alpha = Math.min(0.7, gs.deathTimer * 2);
      ctx.fillStyle = `rgba(255, 45, 120, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  }, []);

  // ── Update ─────────────────────────────────────────────────────────────────

  const update = useCallback((dt: number) => {
    const gs = gameStateRef.current;
    if (gs.phase !== 'playing' && gs.phase !== 'dead') return;

    const level = LEVELS[gs.level];
    const p = gs.player;
    const keys = keysRef.current;

    if (gs.phase === 'dead') {
      gs.deathTimer -= dt;
      if (gs.deathTimer <= 0) {
        // Restart level
        const newGs = makeState(gs.level, gs.totalTime);
        Object.assign(gs, newGs);
      }
      return;
    }

    // Timer
    gs.levelTime += dt;

    // Input
    const left  = keys.has('ArrowLeft')  || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const jump  = keys.has('ArrowUp')    || keys.has('w') || keys.has('W') || keys.has(' ');
    const slide = keys.has('ArrowDown')  || keys.has('s') || keys.has('S');

    // Slide
    if (slide && p.onGround && p.slideTimer <= 0) {
      p.slideTimer = SLIDE_DURATION;
    }
    if (p.slideTimer > 0) {
      p.slideTimer -= dt;
      if (p.slideTimer < 0) p.slideTimer = 0;
    }

    const isSliding = p.slideTimer > 0;

    // Horizontal movement
    if (!isSliding) {
      if (left)  { p.vx = -RUN_SPEED; p.facingRight = false; }
      else if (right) { p.vx = RUN_SPEED; p.facingRight = true; }
      else {
        // Friction
        p.vx *= Math.pow(0.01, dt);
        if (Math.abs(p.vx) < 5) p.vx = 0;
      }
    } else {
      // Slide momentum
      p.vx = p.facingRight ? SLIDE_SPEED : -SLIDE_SPEED;
    }

    // Coyote time
    if (p.onGround) {
      p.coyoteTime = COYOTE_TIME;
    } else {
      p.coyoteTime = Math.max(0, p.coyoteTime - dt);
    }

    // Jump buffer
    if (jump) {
      p.jumpBuffer = JUMP_BUFFER;
    } else {
      p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    }

    // Jump execution
    if (p.jumpBuffer > 0) {
      if (p.coyoteTime > 0 && !isSliding) {
        // Normal jump
        p.vy = JUMP_VY;
        p.coyoteTime = 0;
        p.jumpBuffer = 0;
        p.onGround = false;
      } else if (p.onWall !== 0 && !p.onGround && !isSliding) {
        // Wall jump
        p.vy = WALL_JUMP_VY;
        p.vx = -p.onWall * WALL_JUMP_VX;
        p.facingRight = p.onWall < 0;
        p.jumpBuffer = 0;
        p.onWall = 0;
      }
    }

    // Gravity
    p.vy += GRAVITY * dt;
    if (p.vy > 900) p.vy = 900; // terminal velocity

    // Resolve collisions
    resolveCollisions(p, level.platforms, dt);

    // Hazard check
    if (checkHazards(p, level.platforms)) {
      gs.phase = 'dead';
      gs.deathTimer = 0.6;
      return;
    }

    // Fall off screen
    if (p.y > CANVAS_H + 60) {
      gs.phase = 'dead';
      gs.deathTimer = 0.4;
      return;
    }

    // Exit check
    if (checkExit(p, level.exit)) {
      if (gs.level < LEVELS.length - 1) {
        gs.totalTime += gs.levelTime;
        gs.phase = 'levelComplete';
      } else {
        gs.totalTime += gs.levelTime;
        gs.phase = 'gameComplete';
      }
      return;
    }

    // Camera follow
    const targetCam = p.x - 200;
    const maxCam = level.width - (canvasRef.current?.width ?? 800);
    gs.cameraX = Math.max(0, Math.min(maxCam, targetCam));

    // Update state
    if (isSliding) {
      p.state = 'sliding';
    } else if (!p.onGround) {
      p.state = p.vy < 0 ? 'jumping' : 'falling';
    } else {
      p.state = 'running';
    }
  }, [resolveCollisions, checkHazards, checkExit]);

  // ── Game loop ──────────────────────────────────────────────────────────────

  const loop = useCallback((timestamp: number) => {
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    update(dt);
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [update, render]);

  const startGame = useCallback(() => {
    const gs = gameStateRef.current;
    Object.assign(gs, makeState(0, 0));
    gs.phase = 'playing';
  }, []);

  const restartLevel = useCallback(() => {
    const gs = gameStateRef.current;
    const newGs = makeState(gs.level, gs.totalTime);
    Object.assign(gs, newGs);
  }, []);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
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
  }, []);

  return { canvasRef, gameStateRef, startGame, restartLevel, keysRef };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}
