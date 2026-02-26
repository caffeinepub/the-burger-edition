import { useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  moving?: boolean;
  moveAxis?: 'x' | 'y';
  moveRange?: number;
  moveSpeed?: number;
}

export interface Hazard {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Portal {
  x: number;
  y: number;
  w: number;
  h: number;
  targetX?: number;
  targetY?: number;
  targetLevel?: number;
  angle: number;
  pulse: number;
}

export interface Exit {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Level {
  width: number;
  height: number;
  platforms: Platform[];
  hazards: Hazard[];
  portals: Portal[];
  exit: Exit;
  spawnX: number;
  spawnY: number;
  bgColor: string;
  platformColor: string;
  accentColor: string;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  grounded: boolean;
  onWallLeft: boolean;
  onWallRight: boolean;
  sliding: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  facingRight: boolean;
  dead: boolean;
}

export interface GameState {
  phase: 'idle' | 'playing' | 'dead' | 'levelComplete' | 'gameComplete';
  currentLevel: number;
  elapsedMs: number;
  totalMs: number;
  cameraX: number;
  cameraY: number;
  player: Player;
  levels: Level[];
  movingPlatformOffsets: number[];
  portalCooldown: number;
}

// ─── Level Definitions ───────────────────────────────────────────────────────

function makeLevels(): Level[] {
  return [
    // Level 1 – Tutorial: simple flat run
    {
      width: 2400, height: 600,
      spawnX: 80, spawnY: 480,
      bgColor: '#0a0a1a', platformColor: '#22c55e', accentColor: '#4ade80',
      platforms: [
        { x: 0,    y: 520, w: 300, h: 20 },
        { x: 340,  y: 520, w: 200, h: 20 },
        { x: 580,  y: 480, w: 160, h: 20 },
        { x: 780,  y: 440, w: 160, h: 20 },
        { x: 980,  y: 520, w: 200, h: 20 },
        { x: 1220, y: 480, w: 160, h: 20 },
        { x: 1420, y: 440, w: 160, h: 20 },
        { x: 1620, y: 520, w: 200, h: 20 },
        { x: 1860, y: 520, w: 200, h: 20 },
        { x: 2100, y: 520, w: 260, h: 20 },
      ],
      hazards: [
        { x: 340, y: 510, w: 30, h: 10 },
        { x: 980, y: 510, w: 30, h: 10 },
      ],
      portals: [],
      exit: { x: 2300, y: 480, w: 40, h: 40 },
    },
    // Level 2 – Vertical climb
    {
      width: 1200, height: 1400,
      spawnX: 80, spawnY: 1340,
      bgColor: '#0a0a1a', platformColor: '#3b82f6', accentColor: '#60a5fa',
      platforms: [
        { x: 0,   y: 1380, w: 200, h: 20 },
        { x: 240, y: 1300, w: 160, h: 20 },
        { x: 60,  y: 1220, w: 160, h: 20 },
        { x: 280, y: 1140, w: 160, h: 20 },
        { x: 60,  y: 1060, w: 160, h: 20 },
        { x: 280, y: 980,  w: 160, h: 20 },
        { x: 60,  y: 900,  w: 160, h: 20 },
        { x: 280, y: 820,  w: 160, h: 20 },
        { x: 60,  y: 740,  w: 160, h: 20 },
        { x: 280, y: 660,  w: 160, h: 20 },
        { x: 60,  y: 580,  w: 160, h: 20 },
        { x: 280, y: 500,  w: 160, h: 20 },
        { x: 60,  y: 420,  w: 160, h: 20 },
        { x: 200, y: 340,  w: 200, h: 20 },
        { x: 0,   y: 260,  w: 200, h: 20 },
        { x: 200, y: 180,  w: 300, h: 20 },
      ],
      hazards: [
        { x: 240, y: 1290, w: 20, h: 10 },
        { x: 280, y: 1130, w: 20, h: 10 },
        { x: 280, y: 970,  w: 20, h: 10 },
      ],
      portals: [
        { x: 280, y: 640, w: 36, h: 36, targetX: 80, targetY: 1340, angle: 0, pulse: 0 },
      ],
      exit: { x: 380, y: 140, w: 40, h: 40 },
    },
    // Level 3 – Moving platforms
    {
      width: 2800, height: 600,
      spawnX: 80, spawnY: 480,
      bgColor: '#0a0a1a', platformColor: '#a855f7', accentColor: '#c084fc',
      platforms: [
        { x: 0,    y: 520, w: 200, h: 20 },
        { x: 260,  y: 480, w: 120, h: 20, moving: true, moveAxis: 'x', moveRange: 80, moveSpeed: 1.2 },
        { x: 500,  y: 440, w: 120, h: 20, moving: true, moveAxis: 'y', moveRange: 60, moveSpeed: 1.0 },
        { x: 720,  y: 480, w: 120, h: 20, moving: true, moveAxis: 'x', moveRange: 100, moveSpeed: 1.5 },
        { x: 960,  y: 440, w: 120, h: 20 },
        { x: 1140, y: 400, w: 120, h: 20, moving: true, moveAxis: 'x', moveRange: 120, moveSpeed: 1.8 },
        { x: 1400, y: 460, w: 120, h: 20, moving: true, moveAxis: 'y', moveRange: 80, moveSpeed: 1.2 },
        { x: 1620, y: 420, w: 120, h: 20 },
        { x: 1800, y: 380, w: 120, h: 20, moving: true, moveAxis: 'x', moveRange: 140, moveSpeed: 2.0 },
        { x: 2060, y: 440, w: 120, h: 20, moving: true, moveAxis: 'y', moveRange: 100, moveSpeed: 1.4 },
        { x: 2280, y: 480, w: 120, h: 20 },
        { x: 2460, y: 520, w: 300, h: 20 },
      ],
      hazards: [
        { x: 960, y: 430, w: 30, h: 10 },
        { x: 1620, y: 410, w: 30, h: 10 },
      ],
      portals: [],
      exit: { x: 2680, y: 480, w: 40, h: 40 },
    },
    // Level 4 – Wall jumps
    {
      width: 1600, height: 1200,
      spawnX: 80, spawnY: 1140,
      bgColor: '#0a0a1a', platformColor: '#f59e0b', accentColor: '#fbbf24',
      platforms: [
        { x: 0,    y: 1180, w: 200, h: 20 },
        { x: 300,  y: 1180, w: 20,  h: 300 },
        { x: 400,  y: 1180, w: 20,  h: 300 },
        { x: 300,  y: 1000, w: 120, h: 20 },
        { x: 500,  y: 900,  w: 20,  h: 300 },
        { x: 600,  y: 900,  w: 20,  h: 300 },
        { x: 500,  y: 720,  w: 120, h: 20 },
        { x: 700,  y: 620,  w: 20,  h: 300 },
        { x: 800,  y: 620,  w: 20,  h: 300 },
        { x: 700,  y: 440,  w: 120, h: 20 },
        { x: 900,  y: 340,  w: 20,  h: 300 },
        { x: 1000, y: 340,  w: 20,  h: 300 },
        { x: 900,  y: 160,  w: 200, h: 20 },
        { x: 1200, y: 160,  w: 360, h: 20 },
      ],
      hazards: [
        { x: 300, y: 990, w: 120, h: 10 },
        { x: 500, y: 710, w: 120, h: 10 },
      ],
      portals: [],
      exit: { x: 1480, y: 120, w: 40, h: 40 },
    },
    // Level 5 – Hazard gauntlet
    {
      width: 3000, height: 600,
      spawnX: 80, spawnY: 480,
      bgColor: '#0a0a1a', platformColor: '#ef4444', accentColor: '#f87171',
      platforms: [
        { x: 0,    y: 520, w: 200, h: 20 },
        { x: 240,  y: 520, w: 80,  h: 20 },
        { x: 360,  y: 520, w: 80,  h: 20 },
        { x: 480,  y: 520, w: 80,  h: 20 },
        { x: 600,  y: 480, w: 120, h: 20 },
        { x: 760,  y: 440, w: 120, h: 20 },
        { x: 920,  y: 400, w: 120, h: 20 },
        { x: 1080, y: 440, w: 120, h: 20 },
        { x: 1240, y: 480, w: 120, h: 20 },
        { x: 1400, y: 520, w: 80,  h: 20 },
        { x: 1520, y: 520, w: 80,  h: 20 },
        { x: 1640, y: 520, w: 80,  h: 20 },
        { x: 1760, y: 480, w: 120, h: 20 },
        { x: 1920, y: 440, w: 120, h: 20 },
        { x: 2080, y: 400, w: 120, h: 20 },
        { x: 2240, y: 440, w: 120, h: 20 },
        { x: 2400, y: 480, w: 120, h: 20 },
        { x: 2560, y: 520, w: 400, h: 20 },
      ],
      hazards: [
        { x: 240,  y: 510, w: 80, h: 10 },
        { x: 360,  y: 510, w: 80, h: 10 },
        { x: 480,  y: 510, w: 80, h: 10 },
        { x: 760,  y: 430, w: 30, h: 10 },
        { x: 920,  y: 390, w: 30, h: 10 },
        { x: 1400, y: 510, w: 80, h: 10 },
        { x: 1520, y: 510, w: 80, h: 10 },
        { x: 1640, y: 510, w: 80, h: 10 },
        { x: 1920, y: 430, w: 30, h: 10 },
        { x: 2080, y: 390, w: 30, h: 10 },
      ],
      portals: [
        { x: 1400, y: 440, w: 36, h: 36, targetX: 80, targetY: 480, angle: 0, pulse: 0 },
      ],
      exit: { x: 2880, y: 480, w: 40, h: 40 },
    },
    // Level 6 – Portal maze
    {
      width: 2000, height: 800,
      spawnX: 80, spawnY: 720,
      bgColor: '#0a0a1a', platformColor: '#06b6d4', accentColor: '#22d3ee',
      platforms: [
        { x: 0,    y: 760, w: 200, h: 20 },
        { x: 300,  y: 700, w: 160, h: 20 },
        { x: 560,  y: 640, w: 160, h: 20 },
        { x: 820,  y: 580, w: 160, h: 20 },
        { x: 1080, y: 520, w: 160, h: 20 },
        { x: 1340, y: 460, w: 160, h: 20 },
        { x: 1600, y: 400, w: 160, h: 20 },
        { x: 1800, y: 340, w: 160, h: 20 },
        { x: 300,  y: 400, w: 160, h: 20 },
        { x: 560,  y: 340, w: 160, h: 20 },
        { x: 820,  y: 280, w: 160, h: 20 },
        { x: 1080, y: 220, w: 160, h: 20 },
        { x: 1340, y: 160, w: 160, h: 20 },
        { x: 1600, y: 100, w: 360, h: 20 },
      ],
      hazards: [
        { x: 820,  y: 570, w: 30, h: 10 },
        { x: 1340, y: 450, w: 30, h: 10 },
      ],
      portals: [
        { x: 1800, y: 300, w: 36, h: 36, targetX: 300, targetY: 360, angle: 0, pulse: 0 },
        { x: 1340, y: 120, w: 36, h: 36, targetX: 820, targetY: 240, angle: 0, pulse: 0 },
      ],
      exit: { x: 1880, y: 60, w: 40, h: 40 },
    },
    // Level 7 – Speed run (wide gaps)
    {
      width: 3600, height: 600,
      spawnX: 80, spawnY: 480,
      bgColor: '#0a0a1a', platformColor: '#10b981', accentColor: '#34d399',
      platforms: [
        { x: 0,    y: 520, w: 200, h: 20 },
        { x: 300,  y: 500, w: 100, h: 20 },
        { x: 500,  y: 480, w: 100, h: 20 },
        { x: 700,  y: 460, w: 100, h: 20 },
        { x: 900,  y: 440, w: 100, h: 20 },
        { x: 1100, y: 420, w: 100, h: 20 },
        { x: 1300, y: 440, w: 100, h: 20 },
        { x: 1500, y: 460, w: 100, h: 20 },
        { x: 1700, y: 480, w: 100, h: 20 },
        { x: 1900, y: 460, w: 100, h: 20, moving: true, moveAxis: 'x', moveRange: 80, moveSpeed: 2.0 },
        { x: 2100, y: 440, w: 100, h: 20 },
        { x: 2300, y: 420, w: 100, h: 20, moving: true, moveAxis: 'y', moveRange: 60, moveSpeed: 1.5 },
        { x: 2500, y: 440, w: 100, h: 20 },
        { x: 2700, y: 460, w: 100, h: 20 },
        { x: 2900, y: 480, w: 100, h: 20, moving: true, moveAxis: 'x', moveRange: 100, moveSpeed: 2.5 },
        { x: 3100, y: 460, w: 100, h: 20 },
        { x: 3300, y: 520, w: 260, h: 20 },
      ],
      hazards: [
        { x: 900,  y: 430, w: 30, h: 10 },
        { x: 1100, y: 410, w: 30, h: 10 },
        { x: 2100, y: 430, w: 30, h: 10 },
        { x: 2700, y: 450, w: 30, h: 10 },
      ],
      portals: [],
      exit: { x: 3480, y: 480, w: 40, h: 40 },
    },
    // Level 8 – Descent
    {
      width: 1200, height: 2400,
      spawnX: 80, spawnY: 80,
      bgColor: '#0a0a1a', platformColor: '#8b5cf6', accentColor: '#a78bfa',
      platforms: [
        { x: 0,   y: 120,  w: 200, h: 20 },
        { x: 240, y: 240,  w: 160, h: 20 },
        { x: 60,  y: 360,  w: 160, h: 20 },
        { x: 280, y: 480,  w: 160, h: 20 },
        { x: 60,  y: 600,  w: 160, h: 20 },
        { x: 280, y: 720,  w: 160, h: 20 },
        { x: 60,  y: 840,  w: 160, h: 20 },
        { x: 280, y: 960,  w: 160, h: 20 },
        { x: 60,  y: 1080, w: 160, h: 20 },
        { x: 280, y: 1200, w: 160, h: 20 },
        { x: 60,  y: 1320, w: 160, h: 20 },
        { x: 280, y: 1440, w: 160, h: 20 },
        { x: 60,  y: 1560, w: 160, h: 20 },
        { x: 280, y: 1680, w: 160, h: 20 },
        { x: 60,  y: 1800, w: 160, h: 20 },
        { x: 280, y: 1920, w: 160, h: 20 },
        { x: 60,  y: 2040, w: 160, h: 20 },
        { x: 200, y: 2160, w: 300, h: 20 },
        { x: 0,   y: 2280, w: 500, h: 20 },
        { x: 600, y: 2280, w: 560, h: 20 },
      ],
      hazards: [
        { x: 240, y: 230,  w: 30, h: 10 },
        { x: 280, y: 470,  w: 30, h: 10 },
        { x: 280, y: 950,  w: 30, h: 10 },
        { x: 280, y: 1430, w: 30, h: 10 },
        { x: 280, y: 1910, w: 30, h: 10 },
      ],
      portals: [
        { x: 600, y: 2240, w: 36, h: 36, targetX: 80, targetY: 80, angle: 0, pulse: 0 },
      ],
      exit: { x: 1100, y: 2240, w: 40, h: 40 },
    },
    // Level 9 – Mixed chaos
    {
      width: 3200, height: 800,
      spawnX: 80, spawnY: 720,
      bgColor: '#0a0a1a', platformColor: '#f97316', accentColor: '#fb923c',
      platforms: [
        { x: 0,    y: 760, w: 200, h: 20 },
        { x: 260,  y: 700, w: 100, h: 20, moving: true, moveAxis: 'y', moveRange: 80,  moveSpeed: 1.5 },
        { x: 420,  y: 640, w: 100, h: 20 },
        { x: 580,  y: 580, w: 100, h: 20, moving: true, moveAxis: 'x', moveRange: 80,  moveSpeed: 2.0 },
        { x: 740,  y: 520, w: 100, h: 20 },
        { x: 900,  y: 460, w: 100, h: 20, moving: true, moveAxis: 'y', moveRange: 100, moveSpeed: 1.8 },
        { x: 1060, y: 400, w: 100, h: 20 },
        { x: 1220, y: 340, w: 100, h: 20, moving: true, moveAxis: 'x', moveRange: 120, moveSpeed: 2.2 },
        { x: 1380, y: 400, w: 100, h: 20 },
        { x: 1540, y: 460, w: 100, h: 20 },
        { x: 1700, y: 520, w: 100, h: 20, moving: true, moveAxis: 'y', moveRange: 80,  moveSpeed: 1.6 },
        { x: 1860, y: 460, w: 100, h: 20 },
        { x: 2020, y: 400, w: 100, h: 20, moving: true, moveAxis: 'x', moveRange: 100, moveSpeed: 2.4 },
        { x: 2180, y: 340, w: 100, h: 20 },
        { x: 2340, y: 280, w: 100, h: 20, moving: true, moveAxis: 'y', moveRange: 120, moveSpeed: 2.0 },
        { x: 2500, y: 340, w: 100, h: 20 },
        { x: 2660, y: 400, w: 100, h: 20 },
        { x: 2820, y: 460, w: 100, h: 20 },
        { x: 2980, y: 520, w: 180, h: 20 },
      ],
      hazards: [
        { x: 420,  y: 630, w: 30, h: 10 },
        { x: 740,  y: 510, w: 30, h: 10 },
        { x: 1060, y: 390, w: 30, h: 10 },
        { x: 1380, y: 390, w: 30, h: 10 },
        { x: 1860, y: 450, w: 30, h: 10 },
        { x: 2180, y: 330, w: 30, h: 10 },
        { x: 2660, y: 390, w: 30, h: 10 },
      ],
      portals: [
        { x: 1380, y: 360, w: 36, h: 36, targetX: 80, targetY: 720, angle: 0, pulse: 0 },
      ],
      exit: { x: 3080, y: 480, w: 40, h: 40 },
    },
    // Level 10 – Final boss run
    {
      width: 4000, height: 800,
      spawnX: 80, spawnY: 720,
      bgColor: '#0a0a1a', platformColor: '#ec4899', accentColor: '#f472b6',
      platforms: [
        { x: 0,    y: 760, w: 200, h: 20 },
        { x: 260,  y: 700, w: 80,  h: 20 },
        { x: 400,  y: 640, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 60,  moveSpeed: 2.5 },
        { x: 540,  y: 580, w: 80,  h: 20 },
        { x: 680,  y: 520, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 80,  moveSpeed: 2.0 },
        { x: 820,  y: 460, w: 80,  h: 20 },
        { x: 960,  y: 400, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 100, moveSpeed: 3.0 },
        { x: 1100, y: 340, w: 80,  h: 20 },
        { x: 1240, y: 280, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 120, moveSpeed: 2.5 },
        { x: 1380, y: 340, w: 80,  h: 20 },
        { x: 1520, y: 400, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 80,  moveSpeed: 3.5 },
        { x: 1660, y: 460, w: 80,  h: 20 },
        { x: 1800, y: 400, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 100, moveSpeed: 2.8 },
        { x: 1940, y: 340, w: 80,  h: 20 },
        { x: 2080, y: 280, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 120, moveSpeed: 3.2 },
        { x: 2220, y: 220, w: 80,  h: 20 },
        { x: 2360, y: 160, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 140, moveSpeed: 3.0 },
        { x: 2500, y: 220, w: 80,  h: 20 },
        { x: 2640, y: 280, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 100, moveSpeed: 3.8 },
        { x: 2780, y: 340, w: 80,  h: 20 },
        { x: 2920, y: 400, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 80,  moveSpeed: 2.5 },
        { x: 3060, y: 460, w: 80,  h: 20 },
        { x: 3200, y: 400, w: 80,  h: 20, moving: true, moveAxis: 'x', moveRange: 120, moveSpeed: 4.0 },
        { x: 3340, y: 340, w: 80,  h: 20 },
        { x: 3480, y: 280, w: 80,  h: 20, moving: true, moveAxis: 'y', moveRange: 100, moveSpeed: 3.5 },
        { x: 3620, y: 340, w: 80,  h: 20 },
        { x: 3760, y: 520, w: 200, h: 20 },
      ],
      hazards: [
        { x: 260,  y: 690, w: 30, h: 10 },
        { x: 540,  y: 570, w: 30, h: 10 },
        { x: 820,  y: 450, w: 30, h: 10 },
        { x: 1100, y: 330, w: 30, h: 10 },
        { x: 1380, y: 330, w: 30, h: 10 },
        { x: 1660, y: 450, w: 30, h: 10 },
        { x: 1940, y: 330, w: 30, h: 10 },
        { x: 2220, y: 210, w: 30, h: 10 },
        { x: 2500, y: 210, w: 30, h: 10 },
        { x: 2780, y: 330, w: 30, h: 10 },
        { x: 3060, y: 450, w: 30, h: 10 },
        { x: 3340, y: 330, w: 30, h: 10 },
        { x: 3620, y: 330, w: 30, h: 10 },
      ],
      portals: [
        { x: 2220, y: 180, w: 36, h: 36, targetX: 80, targetY: 720, angle: 0, pulse: 0 },
      ],
      exit: { x: 3880, y: 480, w: 40, h: 40 },
    },
  ];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GRAVITY = 0.55;
const MAX_FALL = 18;
const JUMP_FORCE = -13;
const WALL_JUMP_VX = 7;
const WALL_JUMP_VY = -11;
const RUN_ACCEL = 1.2;
const RUN_MAX = 7;
const FRICTION = 0.82;
const WALL_SLIDE_FRICTION = 0.88;
const COYOTE_FRAMES = 8;
const JUMP_BUFFER_FRAMES = 10;
const PLAYER_W = 28;
const PLAYER_H = 36;
export const CANVAS_W = 800;
export const CANVAS_H = 500;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useOvoGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState>({
    phase: 'idle',
    currentLevel: 0,
    elapsedMs: 0,
    totalMs: 0,
    cameraX: 0,
    cameraY: 0,
    player: createPlayer(80, 480),
    levels: makeLevels(),
    movingPlatformOffsets: [],
    portalCooldown: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const onPhaseChange = useRef<((phase: string, data?: { totalMs: number }) => void) | null>(null);

  function createPlayer(x: number, y: number): Player {
    return {
      x, y, w: PLAYER_W, h: PLAYER_H,
      vx: 0, vy: 0,
      grounded: false,
      onWallLeft: false,
      onWallRight: false,
      sliding: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      facingRight: true,
      dead: false,
    };
  }

  function initLevel(levelIdx: number) {
    const gs = stateRef.current;
    const level = gs.levels[levelIdx];
    gs.currentLevel = levelIdx;
    gs.player = createPlayer(level.spawnX, level.spawnY);
    gs.cameraX = 0;
    gs.cameraY = 0;
    gs.portalCooldown = 0;
    gs.movingPlatformOffsets = level.platforms.map(() => 0);
    level.portals.forEach(p => { p.angle = 0; p.pulse = 0; });
  }

  const startGame = useCallback(() => {
    const gs = stateRef.current;
    gs.phase = 'playing';
    gs.elapsedMs = 0;
    gs.totalMs = 0;
    gs.levels = makeLevels();
    initLevel(0);
    onPhaseChange.current?.('playing');
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // ─── Collision helpers ──────────────────────────────────────────────────────

  function getEffectivePlatforms(gs: GameState): Platform[] {
    const level = gs.levels[gs.currentLevel];
    return level.platforms.map((p, i) => {
      if (!p.moving) return p;
      const offset = gs.movingPlatformOffsets[i] ?? 0;
      if (p.moveAxis === 'x') return { ...p, x: p.x + offset };
      if (p.moveAxis === 'y') return { ...p, y: p.y + offset };
      return p;
    });
  }

  function rectOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function resolvePlayerPlatforms(player: Player, platforms: Platform[]) {
    player.grounded = false;
    player.onWallLeft = false;
    player.onWallRight = false;

    for (const p of platforms) {
      if (!rectOverlap(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) continue;

      const overlapLeft   = (player.x + player.w) - p.x;
      const overlapRight  = (p.x + p.w) - player.x;
      const overlapTop    = (player.y + player.h) - p.y;
      const overlapBottom = (p.y + p.h) - player.y;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (minOverlap === overlapBottom && player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      } else if (minOverlap === overlapLeft && player.vx > 0) {
        player.x = p.x - player.w;
        player.vx = 0;
        player.onWallRight = true;
      } else if (minOverlap === overlapRight && player.vx < 0) {
        player.x = p.x + p.w;
        player.vx = 0;
        player.onWallLeft = true;
      }
    }
  }

  // ─── Game loop ──────────────────────────────────────────────────────────────

  function gameLoop(timestamp: number) {
    const gs = stateRef.current;
    if (gs.phase !== 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const dt = Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;
    gs.elapsedMs += dt;

    const level = gs.levels[gs.currentLevel];
    const player = gs.player;
    const keys = keysRef.current;

    // ── Update moving platforms ──
    level.platforms.forEach((p, i) => {
      if (!p.moving || !p.moveRange || !p.moveSpeed) return;
      const t = gs.elapsedMs / 1000;
      gs.movingPlatformOffsets[i] = Math.sin(t * p.moveSpeed) * p.moveRange;
    });

    const platforms = getEffectivePlatforms(gs);

    // ── Horizontal input ──
    const left  = keys.has('ArrowLeft')  || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const jumpPressed = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');

    if (left)  { player.vx -= RUN_ACCEL; player.facingRight = false; }
    if (right) { player.vx += RUN_ACCEL; player.facingRight = true; }
    if (!left && !right) player.vx *= FRICTION;
    player.vx = Math.max(-RUN_MAX, Math.min(RUN_MAX, player.vx));

    // ── Gravity ──
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    // ── Wall slide ──
    player.sliding = false;
    if ((player.onWallLeft || player.onWallRight) && !player.grounded && player.vy > 0) {
      player.vy *= WALL_SLIDE_FRICTION;
      player.sliding = true;
    }

    // ── Coyote time ──
    if (player.grounded) {
      player.coyoteTimer = COYOTE_FRAMES;
    } else {
      player.coyoteTimer = Math.max(0, player.coyoteTimer - 1);
    }

    // ── Jump buffer ──
    if (jumpPressed) {
      player.jumpBufferTimer = JUMP_BUFFER_FRAMES;
    } else {
      player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - 1);
    }

    // ── Jump logic ──
    if (player.jumpBufferTimer > 0) {
      if (player.coyoteTimer > 0) {
        player.vy = JUMP_FORCE;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
      } else if (player.onWallLeft) {
        player.vy = WALL_JUMP_VY;
        player.vx = WALL_JUMP_VX;
        player.jumpBufferTimer = 0;
      } else if (player.onWallRight) {
        player.vy = WALL_JUMP_VY;
        player.vx = -WALL_JUMP_VX;
        player.jumpBufferTimer = 0;
      }
    }

    // ── Move & resolve ──
    player.x += player.vx;
    player.y += player.vy;
    resolvePlayerPlatforms(player, platforms);

    // ── World bounds ──
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x + player.w > level.width) { player.x = level.width - player.w; player.vx = 0; }

    // ── Death by falling ──
    if (player.y > level.height + 100) {
      player.dead = true;
      gs.phase = 'dead';
      onPhaseChange.current?.('dead');
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // ── Hazard collision ──
    for (const h of level.hazards) {
      if (rectOverlap(player.x, player.y, player.w, player.h, h.x, h.y, h.w, h.h)) {
        player.dead = true;
        gs.phase = 'dead';
        onPhaseChange.current?.('dead');
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }
    }

    // ── Portal collision ──
    if (gs.portalCooldown > 0) gs.portalCooldown--;
    if (gs.portalCooldown === 0) {
      for (const portal of level.portals) {
        if (rectOverlap(player.x, player.y, player.w, player.h, portal.x, portal.y, portal.w, portal.h)) {
          if (portal.targetLevel !== undefined) {
            gs.totalMs += gs.elapsedMs;
            gs.elapsedMs = 0;
            initLevel(portal.targetLevel);
            gs.portalCooldown = 60;
          } else if (portal.targetX !== undefined && portal.targetY !== undefined) {
            player.x = portal.targetX;
            player.y = portal.targetY;
            player.vx = 0;
            player.vy = 0;
            gs.portalCooldown = 60;
          }
          break;
        }
      }
    }

    // ── Exit collision ──
    const exit = level.exit;
    if (rectOverlap(player.x, player.y, player.w, player.h, exit.x, exit.y, exit.w, exit.h)) {
      gs.totalMs += gs.elapsedMs;
      gs.elapsedMs = 0;
      if (gs.currentLevel >= gs.levels.length - 1) {
        gs.phase = 'gameComplete';
        onPhaseChange.current?.('gameComplete', { totalMs: gs.totalMs });
      } else {
        gs.phase = 'levelComplete';
        onPhaseChange.current?.('levelComplete');
        setTimeout(() => {
          if (stateRef.current.phase === 'levelComplete') {
            initLevel(gs.currentLevel + 1);
            stateRef.current.phase = 'playing';
            onPhaseChange.current?.('playing');
          }
        }, 800);
      }
    }

    // ── Portal animation ──
    for (const portal of level.portals) {
      portal.angle = (portal.angle + 2) % 360;
      portal.pulse = (portal.pulse + 0.05) % (Math.PI * 2);
    }

    // ── Camera ──
    const targetCX = player.x + player.w / 2 - CANVAS_W / 2;
    const targetCY = player.y + player.h / 2 - CANVAS_H / 2;
    gs.cameraX += (targetCX - gs.cameraX) * 0.12;
    gs.cameraY += (targetCY - gs.cameraY) * 0.12;
    gs.cameraX = Math.max(0, Math.min(level.width - CANVAS_W, gs.cameraX));
    gs.cameraY = Math.max(0, Math.min(level.height - CANVAS_H, gs.cameraY));

    // ── Render ──
    render(gs, platforms);

    rafRef.current = requestAnimationFrame(gameLoop);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  function render(gs: GameState, platforms: Platform[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const level = gs.levels[gs.currentLevel];
    const { cameraX, cameraY, player } = gs;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + gs.currentLevel * 31) % level.width - cameraX * 0.3) % CANVAS_W;
      const sy = ((i * 97  + gs.currentLevel * 17) % level.height - cameraY * 0.3) % CANVAS_H;
      if (sx >= 0 && sy >= 0) ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Platforms
    for (const p of platforms) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(p.x + 4, p.y + 4, p.w, p.h);
      ctx.fillStyle = level.platformColor;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = level.accentColor;
      ctx.fillRect(p.x, p.y, p.w, 3);
    }

    // Hazards (spikes)
    for (const h of level.hazards) {
      ctx.fillStyle = '#ff2244';
      const spikeCount = Math.floor(h.w / 10);
      for (let i = 0; i < spikeCount; i++) {
        ctx.beginPath();
        ctx.moveTo(h.x + i * 10, h.y + h.h);
        ctx.lineTo(h.x + i * 10 + 5, h.y);
        ctx.lineTo(h.x + i * 10 + 10, h.y + h.h);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Portals
    for (const portal of level.portals) {
      const cx = portal.x + portal.w / 2;
      const cy = portal.y + portal.h / 2;
      const r  = portal.w / 2;
      const pulseScale = 1 + Math.sin(portal.pulse) * 0.15;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * pulseScale * 1.8);
      grad.addColorStop(0, 'rgba(120, 80, 255, 0.8)');
      grad.addColorStop(0.5, 'rgba(80, 40, 200, 0.4)');
      grad.addColorStop(1, 'rgba(40, 0, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulseScale * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Spinning ring dots
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((portal.angle * Math.PI) / 180);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = Math.cos(angle) * r * pulseScale;
        const py = Math.sin(angle) * r * pulseScale;
        ctx.fillStyle = i % 2 === 0 ? '#a855f7' : '#7c3aed';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Inner circle
      ctx.fillStyle = '#1a0040';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.6 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PORTAL', cx, cy + r * 2.2);
    }

    // Exit
    const exit = level.exit;
    const exitPulse = Math.sin(gs.elapsedMs / 300) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 220, 0, ${exitPulse})`;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★', exit.x + exit.w / 2, exit.y + exit.h / 2 + 6);

    // Player
    if (!player.dead) {
      drawPlayer(ctx, player);
    }

    ctx.restore();

    // HUD
    drawHUD(ctx, gs);
  }

  function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    const { x, y, w, h, facingRight, sliding, grounded } = player;
    const cx = x + w / 2;

    ctx.save();
    ctx.translate(cx, y + h / 2);
    if (!facingRight) ctx.scale(-1, 1);

    // Body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Eyes
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(4, -h / 2 + 6, 6, 6);
    ctx.fillRect(12, -h / 2 + 6, 6, 6);

    // Mouth
    if (sliding) {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(4, -h / 2 + 18, 14, 4);
    } else {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(6, -h / 2 + 18, 10, 3);
    }

    // Legs
    if (grounded) {
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(-w / 2, h / 2 - 8, 10, 8);
      ctx.fillRect(w / 2 - 10, h / 2 - 8, 10, 8);
    }

    ctx.restore();
  }

  function drawHUD(ctx: CanvasRenderingContext2D, gs: GameState) {
    const totalLevels = gs.levels.length;
    const currentLevel = gs.currentLevel + 1;
    const elapsed = gs.elapsedMs + gs.totalMs;
    const secs = (elapsed / 1000).toFixed(2);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${currentLevel}/${totalLevels}`, 12, 22);

    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${secs}s`, CANVAS_W - 12, 22);

    const barW = CANVAS_W - 24;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(12, 28, barW, 4);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(12, 28, barW * ((currentLevel - 1) / totalLevels), 4);
  }

  // ─── Setup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);

    // Draw idle screen
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OVO', CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText('Press START to play', CANVAS_W / 2, CANVAS_H / 2 + 20);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    stateRef,
    startGame,
    restartGame,
    onPhaseChange,
    CANVAS_W,
    CANVAS_H,
  };
}
