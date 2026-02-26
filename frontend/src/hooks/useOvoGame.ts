import { RefObject, useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────
export const CANVAS_W = 800;
export const CANVAS_H = 450;

const GRAVITY = 0.55;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4.5;
const MAX_FALL = 18;
const WALL_JUMP_X = 5;
const WALL_JUMP_Y = -11;
const COYOTE_FRAMES = 8;
const JUMP_BUFFER_FRAMES = 10;

const LS_KEY = 'ovo_completed_levels';

function loadCompletedLevels(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr as number[]);
  } catch {
    // ignore
  }
  return new Set();
}

function saveCompletedLevels(set: Set<number>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Platform {
  x: number; y: number; w: number; h: number;
  moving?: boolean; moveAxis?: 'x' | 'y';
  moveMin?: number; moveMax?: number; moveSpeed?: number;
  _pos?: number; _dir?: number;
}
interface Hazard { x: number; y: number; w: number; h: number; }
interface Portal { x: number; y: number; r: number; targetX: number; targetY: number; color: string; }
interface Exit { x: number; y: number; w: number; h: number; }
interface Level {
  platforms: Platform[];
  hazards: Hazard[];
  portals: Portal[];
  exit: Exit;
  startX: number;
  startY: number;
  bgColor: string;
  accentColor: string;
}

interface Player {
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  onGround: boolean;
  onWallLeft: boolean;
  onWallRight: boolean;
  coyoteTimer: number;
  jumpBuffer: number;
  facingRight: boolean;
  portalCooldown: number;
}

type Phase = 'idle' | 'playing' | 'dead' | 'levelComplete' | 'gameComplete';

interface GameState {
  phase: Phase;
  currentLevel: number;
  totalTime: number;
  levelTime: number;
  deathCount: number;
  player: Player;
  platforms: Platform[];
  hazards: Hazard[];
  portals: Portal[];
  exit: Exit;
  bgColor: string;
  accentColor: string;
  cameraX: number;
  cameraY: number;
}

// ─── Level Definitions ───────────────────────────────────────────────────────
const LEVELS: Level[] = [
  // Level 1 – Tutorial
  {
    bgColor: '#0a0a1a', accentColor: '#00ff88',
    startX: 60, startY: 340,
    exit: { x: 720, y: 340, w: 40, h: 60 },
    portals: [],
    hazards: [],
    platforms: [
      { x: 0, y: 400, w: 800, h: 50 },
      { x: 200, y: 320, w: 120, h: 16 },
      { x: 400, y: 260, w: 120, h: 16 },
      { x: 580, y: 320, w: 160, h: 16 },
    ],
  },
  // Level 2 – Gaps
  {
    bgColor: '#0a0a1a', accentColor: '#00ccff',
    startX: 40, startY: 340,
    exit: { x: 730, y: 300, w: 40, h: 60 },
    portals: [],
    hazards: [
      { x: 200, y: 390, w: 60, h: 10 },
      { x: 420, y: 390, w: 60, h: 10 },
    ],
    platforms: [
      { x: 0, y: 400, w: 160, h: 50 },
      { x: 280, y: 400, w: 120, h: 50 },
      { x: 500, y: 400, w: 120, h: 50 },
      { x: 680, y: 360, w: 120, h: 50 },
      { x: 150, y: 300, w: 80, h: 16 },
      { x: 350, y: 250, w: 80, h: 16 },
    ],
  },
  // Level 3 – Moving platforms
  {
    bgColor: '#0d0a1a', accentColor: '#ff00cc',
    startX: 40, startY: 340,
    exit: { x: 720, y: 180, w: 40, h: 60 },
    portals: [],
    hazards: [{ x: 0, y: 420, w: 800, h: 10 }],
    platforms: [
      { x: 0, y: 400, w: 120, h: 50 },
      { x: 200, y: 350, w: 100, h: 16, moving: true, moveAxis: 'x', moveMin: 200, moveMax: 380, moveSpeed: 2 },
      { x: 420, y: 300, w: 100, h: 16, moving: true, moveAxis: 'y', moveMin: 250, moveMax: 350, moveSpeed: 1.5 },
      { x: 580, y: 250, w: 100, h: 16, moving: true, moveAxis: 'x', moveMin: 560, moveMax: 700, moveSpeed: 2.5 },
      { x: 680, y: 180, w: 120, h: 16 },
    ],
  },
  // Level 4 – Portals intro
  {
    bgColor: '#0a1a0a', accentColor: '#88ff00',
    startX: 40, startY: 340,
    exit: { x: 720, y: 340, w: 40, h: 60 },
    hazards: [{ x: 300, y: 390, w: 200, h: 10 }],
    portals: [
      { x: 160, y: 370, r: 22, targetX: 560, targetY: 340, color: '#ff6600' },
      { x: 580, y: 370, r: 22, targetX: 160, targetY: 340, color: '#0066ff' },
    ],
    platforms: [
      { x: 0, y: 400, w: 200, h: 50 },
      { x: 540, y: 400, w: 260, h: 50 },
      { x: 250, y: 280, w: 100, h: 16 },
    ],
  },
  // Level 5 – Wall jumps
  {
    bgColor: '#1a0a0a', accentColor: '#ff4400',
    startX: 40, startY: 380,
    exit: { x: 720, y: 80, w: 40, h: 60 },
    portals: [],
    hazards: [{ x: 0, y: 430, w: 800, h: 20 }],
    platforms: [
      { x: 0, y: 400, w: 100, h: 50 },
      { x: 0, y: 0, w: 16, h: 400 },
      { x: 150, y: 0, w: 16, h: 300 },
      { x: 300, y: 100, w: 16, h: 330 },
      { x: 450, y: 0, w: 16, h: 300 },
      { x: 600, y: 100, w: 16, h: 330 },
      { x: 700, y: 0, w: 100, h: 140 },
    ],
  },
  // Level 6 – Precision jumps
  {
    bgColor: '#0a0a1a', accentColor: '#ffcc00',
    startX: 30, startY: 360,
    exit: { x: 740, y: 120, w: 40, h: 60 },
    portals: [],
    hazards: [{ x: 0, y: 420, w: 800, h: 30 }],
    platforms: [
      { x: 0, y: 400, w: 80, h: 50 },
      { x: 120, y: 370, w: 50, h: 16 },
      { x: 220, y: 330, w: 50, h: 16 },
      { x: 320, y: 290, w: 50, h: 16 },
      { x: 420, y: 250, w: 50, h: 16 },
      { x: 520, y: 210, w: 50, h: 16 },
      { x: 620, y: 170, w: 50, h: 16 },
      { x: 720, y: 130, w: 80, h: 16 },
    ],
  },
  // Level 7 – Portal maze
  {
    bgColor: '#0d0d0a', accentColor: '#cc00ff',
    startX: 40, startY: 340,
    exit: { x: 720, y: 80, w: 40, h: 60 },
    hazards: [
      { x: 0, y: 420, w: 800, h: 30 },
      { x: 200, y: 200, w: 200, h: 10 },
    ],
    portals: [
      { x: 100, y: 370, r: 22, targetX: 500, targetY: 150, color: '#ff6600' },
      { x: 520, y: 180, r: 22, targetX: 300, targetY: 80, color: '#00ff88' },
      { x: 320, y: 110, r: 22, targetX: 680, targetY: 100, color: '#ff00cc' },
    ],
    platforms: [
      { x: 0, y: 400, w: 160, h: 50 },
      { x: 460, y: 200, w: 120, h: 16 },
      { x: 260, y: 130, w: 100, h: 16 },
      { x: 640, y: 130, w: 120, h: 16 },
    ],
  },
  // Level 8 – Moving + hazards
  {
    bgColor: '#0a1a1a', accentColor: '#00ffcc',
    startX: 40, startY: 340,
    exit: { x: 720, y: 200, w: 40, h: 60 },
    portals: [],
    hazards: [
      { x: 0, y: 420, w: 800, h: 30 },
      { x: 300, y: 300, w: 80, h: 10 },
      { x: 500, y: 250, w: 80, h: 10 },
    ],
    platforms: [
      { x: 0, y: 400, w: 120, h: 50 },
      { x: 160, y: 360, w: 100, h: 16, moving: true, moveAxis: 'x', moveMin: 160, moveMax: 300, moveSpeed: 2 },
      { x: 350, y: 320, w: 100, h: 16, moving: true, moveAxis: 'y', moveMin: 280, moveMax: 360, moveSpeed: 1.8 },
      { x: 500, y: 280, w: 100, h: 16, moving: true, moveAxis: 'x', moveMin: 480, moveMax: 640, moveSpeed: 2.2 },
      { x: 660, y: 220, w: 120, h: 16 },
    ],
  },
  // Level 9 – The gauntlet
  {
    bgColor: '#1a0a1a', accentColor: '#ff0088',
    startX: 30, startY: 380,
    exit: { x: 740, y: 60, w: 40, h: 60 },
    hazards: [
      { x: 0, y: 420, w: 800, h: 30 },
      { x: 100, y: 300, w: 30, h: 10 },
      { x: 250, y: 250, w: 30, h: 10 },
      { x: 400, y: 200, w: 30, h: 10 },
      { x: 550, y: 150, w: 30, h: 10 },
    ],
    portals: [
      { x: 80, y: 370, r: 20, targetX: 680, targetY: 80, color: '#ffcc00' },
      { x: 700, y: 110, r: 20, targetX: 200, targetY: 280, color: '#00ccff' },
    ],
    platforms: [
      { x: 0, y: 400, w: 100, h: 50 },
      { x: 140, y: 360, w: 60, h: 16, moving: true, moveAxis: 'x', moveMin: 140, moveMax: 240, moveSpeed: 3 },
      { x: 290, y: 310, w: 60, h: 16, moving: true, moveAxis: 'y', moveMin: 270, moveMax: 340, moveSpeed: 2.5 },
      { x: 440, y: 260, w: 60, h: 16, moving: true, moveAxis: 'x', moveMin: 420, moveMax: 540, moveSpeed: 3 },
      { x: 590, y: 200, w: 60, h: 16, moving: true, moveAxis: 'y', moveMin: 160, moveMax: 230, moveSpeed: 2 },
      { x: 680, y: 120, w: 100, h: 16 },
    ],
  },
  // Level 10 – Final
  {
    bgColor: '#0a0a0a', accentColor: '#ffffff',
    startX: 30, startY: 380,
    exit: { x: 740, y: 40, w: 40, h: 60 },
    hazards: [
      { x: 0, y: 420, w: 800, h: 30 },
      { x: 150, y: 320, w: 50, h: 10 },
      { x: 350, y: 260, w: 50, h: 10 },
      { x: 550, y: 200, w: 50, h: 10 },
      { x: 650, y: 140, w: 50, h: 10 },
    ],
    portals: [
      { x: 100, y: 370, r: 20, targetX: 400, targetY: 240, color: '#ff6600' },
      { x: 420, y: 270, r: 20, targetX: 600, targetY: 180, color: '#00ff88' },
      { x: 620, y: 210, r: 20, targetX: 700, targetY: 60, color: '#cc00ff' },
    ],
    platforms: [
      { x: 0, y: 400, w: 120, h: 50 },
      { x: 160, y: 360, w: 70, h: 16, moving: true, moveAxis: 'x', moveMin: 160, moveMax: 280, moveSpeed: 3.5 },
      { x: 320, y: 300, w: 70, h: 16, moving: true, moveAxis: 'y', moveMin: 260, moveMax: 330, moveSpeed: 3 },
      { x: 480, y: 240, w: 70, h: 16, moving: true, moveAxis: 'x', moveMin: 460, moveMax: 580, moveSpeed: 3.5 },
      { x: 640, y: 160, w: 70, h: 16, moving: true, moveAxis: 'y', moveMin: 120, moveMax: 190, moveSpeed: 2.5 },
      { x: 700, y: 80, w: 80, h: 16 },
    ],
  },
];

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useOvoGame(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const stateRef = useRef<GameState>({
    phase: 'idle',
    currentLevel: 0,
    totalTime: 0,
    levelTime: 0,
    deathCount: 0,
    player: createPlayer(LEVELS[0]),
    platforms: initPlatforms(LEVELS[0]),
    hazards: LEVELS[0].hazards,
    portals: LEVELS[0].portals,
    exit: LEVELS[0].exit,
    bgColor: LEVELS[0].bgColor,
    accentColor: LEVELS[0].accentColor,
    cameraX: 0,
    cameraY: 0,
  });

  const onPhaseChange = useRef<(phase: Phase, state: GameState) => void>(() => {});
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const portalAnimRef = useRef<number>(0);

  // Completed levels state – persisted to localStorage
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(() => loadCompletedLevels());
  const completedLevelsRef = useRef<Set<number>>(completedLevels);

  // Keep ref in sync with state
  useEffect(() => {
    completedLevelsRef.current = completedLevels;
  }, [completedLevels]);

  const markLevelComplete = useCallback((levelIndex: number) => {
    setCompletedLevels(prev => {
      if (prev.has(levelIndex)) return prev;
      const next = new Set(prev);
      next.add(levelIndex);
      saveCompletedLevels(next);
      return next;
    });
  }, []);

  function createPlayer(level: Level): Player {
    return {
      x: level.startX, y: level.startY,
      w: 28, h: 28,
      vx: 0, vy: 0,
      onGround: false,
      onWallLeft: false,
      onWallRight: false,
      coyoteTimer: 0,
      jumpBuffer: 0,
      facingRight: true,
      portalCooldown: 0,
    };
  }

  function initPlatforms(level: Level): Platform[] {
    return level.platforms.map(p => ({
      ...p,
      _pos: p.moveAxis === 'x' ? p.x : p.y,
      _dir: 1,
    }));
  }

  function loadLevel(index: number, gs: GameState) {
    const level = LEVELS[index];
    gs.currentLevel = index;
    gs.player = createPlayer(level);
    gs.platforms = initPlatforms(level);
    gs.hazards = level.hazards;
    gs.portals = level.portals.map(p => ({ ...p }));
    gs.exit = level.exit;
    gs.bgColor = level.bgColor;
    gs.accentColor = level.accentColor;
    gs.levelTime = 0;
    gs.cameraX = 0;
    gs.cameraY = 0;
  }

  function rectOverlap(ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function resolvePlayerPlatforms(p: Player, platforms: Platform[]) {
    p.onGround = false;
    p.onWallLeft = false;
    p.onWallRight = false;

    for (const plat of platforms) {
      if (!rectOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) continue;

      const overlapLeft = (p.x + p.w) - plat.x;
      const overlapRight = (plat.x + plat.w) - p.x;
      const overlapTop = (p.y + p.h) - plat.y;
      const overlapBottom = (plat.y + plat.h) - p.y;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapTop && p.vy >= 0) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else if (minOverlap === overlapBottom && p.vy < 0) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      } else if (minOverlap === overlapLeft) {
        p.x = plat.x - p.w;
        p.vx = 0;
        p.onWallRight = true;
      } else if (minOverlap === overlapRight) {
        p.x = plat.x + plat.w;
        p.vx = 0;
        p.onWallLeft = true;
      }
    }
  }

  function updateMovingPlatforms(platforms: Platform[]) {
    for (const plat of platforms) {
      if (!plat.moving) continue;
      const speed = plat.moveSpeed ?? 2;
      const dir = plat._dir ?? 1;
      if (plat.moveAxis === 'x') {
        plat.x += speed * dir;
        if (plat.x <= (plat.moveMin ?? 0) || plat.x + plat.w >= (plat.moveMax ?? CANVAS_W)) {
          plat._dir = -dir;
        }
      } else {
        plat.y += speed * dir;
        if (plat.y <= (plat.moveMin ?? 0) || plat.y + plat.h >= (plat.moveMax ?? CANVAS_H)) {
          plat._dir = -dir;
        }
      }
    }
  }

  function gameLoop() {
    const gs = stateRef.current;
    if (gs.phase !== 'playing') return;

    const keys = keysRef.current;
    const p = gs.player;

    // Timers
    gs.totalTime += 1 / 60;
    gs.levelTime += 1 / 60;

    // Moving platforms
    updateMovingPlatforms(gs.platforms);

    // Input
    const left = keys.has('ArrowLeft') || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const jump = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');

    if (left) { p.vx = -MOVE_SPEED; p.facingRight = false; }
    else if (right) { p.vx = MOVE_SPEED; p.facingRight = true; }
    else { p.vx *= 0.8; }

    // Jump buffer
    if (jump) p.jumpBuffer = JUMP_BUFFER_FRAMES;
    else if (p.jumpBuffer > 0) p.jumpBuffer--;

    // Coyote time
    if (p.onGround) p.coyoteTimer = COYOTE_FRAMES;
    else if (p.coyoteTimer > 0) p.coyoteTimer--;

    // Jump
    if (p.jumpBuffer > 0) {
      if (p.coyoteTimer > 0) {
        p.vy = JUMP_FORCE;
        p.coyoteTimer = 0;
        p.jumpBuffer = 0;
      } else if (p.onWallLeft) {
        p.vy = WALL_JUMP_Y;
        p.vx = WALL_JUMP_X;
        p.jumpBuffer = 0;
      } else if (p.onWallRight) {
        p.vy = WALL_JUMP_Y;
        p.vx = -WALL_JUMP_X;
        p.jumpBuffer = 0;
      }
    }

    // Gravity
    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);

    // Move
    p.x += p.vx;
    p.y += p.vy;

    // Collisions
    resolvePlayerPlatforms(p, gs.platforms);

    // Portal cooldown
    if (p.portalCooldown > 0) p.portalCooldown--;

    // Portal teleport
    if (p.portalCooldown === 0) {
      for (const portal of gs.portals) {
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        const dx = cx - portal.x;
        const dy = cy - portal.y;
        if (Math.sqrt(dx * dx + dy * dy) < portal.r) {
          p.x = portal.targetX - p.w / 2;
          p.y = portal.targetY - p.h / 2;
          p.portalCooldown = 30;
          break;
        }
      }
    }

    // Hazard collision
    for (const hz of gs.hazards) {
      if (rectOverlap(p.x, p.y, p.w, p.h, hz.x, hz.y, hz.w, hz.h)) {
        gs.deathCount++;
        gs.phase = 'dead';
        onPhaseChange.current('dead', gs);
        render(gs);
        return;
      }
    }

    // Out of bounds
    if (p.y > CANVAS_H + 100) {
      gs.deathCount++;
      gs.phase = 'dead';
      onPhaseChange.current('dead', gs);
      render(gs);
      return;
    }

    // Exit collision
    const ex = gs.exit;
    if (rectOverlap(p.x, p.y, p.w, p.h, ex.x, ex.y, ex.w, ex.h)) {
      const completedLevelIndex = gs.currentLevel;
      if (gs.currentLevel >= LEVELS.length - 1) {
        gs.phase = 'gameComplete';
        markLevelComplete(completedLevelIndex);
        onPhaseChange.current('gameComplete', gs);
      } else {
        gs.phase = 'levelComplete';
        markLevelComplete(completedLevelIndex);
        onPhaseChange.current('levelComplete', gs);
      }
      render(gs);
      return;
    }

    // Camera
    const targetCX = p.x + p.w / 2 - CANVAS_W / 2;
    const targetCY = p.y + p.h / 2 - CANVAS_H / 2;
    gs.cameraX += (targetCX - gs.cameraX) * 0.1;
    gs.cameraY += (targetCY - gs.cameraY) * 0.1;

    render(gs);
    rafRef.current = requestAnimationFrame(gameLoop);
  }

  function render(gs: GameState) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = gs.bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.translate(-gs.cameraX, -gs.cameraY);

    // Platforms
    for (const plat of gs.platforms) {
      ctx.fillStyle = gs.accentColor + '33';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = gs.accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    }

    // Hazards
    for (const hz of gs.hazards) {
      ctx.fillStyle = '#ff003388';
      ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 1;
      ctx.strokeRect(hz.x, hz.y, hz.w, hz.h);
    }

    // Portals
    const t = portalAnimRef.current;
    for (const portal of gs.portals) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.r + Math.sin(t * 0.05) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = portal.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = portal.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = portal.color + '44';
      ctx.fill();
      ctx.restore();
    }
    portalAnimRef.current++;

    // Exit
    const ex = gs.exit;
    ctx.save();
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
    // Door symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬛', ex.x + ex.w / 2, ex.y + ex.h / 2 + 8);
    ctx.restore();

    // Player
    const p = gs.player;
    ctx.save();
    ctx.fillStyle = gs.accentColor;
    ctx.shadowColor = gs.accentColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // Eyes
    ctx.fillStyle = gs.bgColor;
    ctx.shadowBlur = 0;
    const eyeX = p.facingRight ? p.x + p.w * 0.65 : p.x + p.w * 0.2;
    ctx.fillRect(eyeX, p.y + 6, 6, 6);
    ctx.restore();

    ctx.restore();
  }

  function startGame(levelIndex = 0) {
    const gs = stateRef.current;
    loadLevel(levelIndex, gs);
    gs.phase = 'playing';
    gs.deathCount = 0;
    gs.totalTime = 0;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }

  function restartGame() {
    const gs = stateRef.current;
    loadLevel(gs.currentLevel, gs);
    gs.phase = 'playing';
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }

  function nextLevel() {
    const gs = stateRef.current;
    const next = gs.currentLevel + 1;
    if (next < LEVELS.length) {
      loadLevel(next, gs);
      gs.phase = 'playing';
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    stateRef,
    startGame,
    restartGame,
    nextLevel,
    onPhaseChange,
    CANVAS_W,
    CANVAS_H,
    completedLevels,
  };
}
