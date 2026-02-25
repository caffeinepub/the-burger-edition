import { useRef, useCallback } from 'react';

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  alive: boolean;
}

export interface Coin {
  x: number;
  y: number;
  r: number;
  collected: boolean;
}

export interface MarioGameState {
  playerX: number;
  playerY: number;
  playerVX: number;
  playerVY: number;
  onGround: boolean;
  score: number;
  gameOver: boolean;
  won: boolean;
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  cameraX: number;
  worldWidth: number;
}

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const PLAYER_W = 28;
const PLAYER_H = 36;
const GROUND_Y = 380;
const CANVAS_H = 420;

function buildLevel(): { platforms: Platform[]; enemies: Enemy[]; coins: Coin[] } {
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, w: 400, h: 40 },
    { x: 450, y: GROUND_Y, w: 300, h: 40 },
    { x: 800, y: GROUND_Y, w: 400, h: 40 },
    { x: 1250, y: GROUND_Y, w: 500, h: 40 },
    { x: 1800, y: GROUND_Y, w: 600, h: 40 },
    { x: 2450, y: GROUND_Y, w: 400, h: 40 },
    { x: 2900, y: GROUND_Y, w: 800, h: 40 },
    // Elevated platforms
    { x: 200, y: 300, w: 120, h: 20 },
    { x: 500, y: 260, w: 100, h: 20 },
    { x: 700, y: 220, w: 120, h: 20 },
    { x: 900, y: 280, w: 100, h: 20 },
    { x: 1100, y: 240, w: 140, h: 20 },
    { x: 1400, y: 300, w: 100, h: 20 },
    { x: 1600, y: 250, w: 120, h: 20 },
    { x: 1900, y: 280, w: 100, h: 20 },
    { x: 2100, y: 230, w: 140, h: 20 },
    { x: 2300, y: 290, w: 100, h: 20 },
    { x: 2600, y: 260, w: 120, h: 20 },
    { x: 2800, y: 220, w: 100, h: 20 },
    { x: 3000, y: 270, w: 140, h: 20 },
    { x: 3200, y: 300, w: 100, h: 20 },
    { x: 3400, y: 250, w: 120, h: 20 },
    { x: 3500, y: GROUND_Y, w: 200, h: 40 },
  ];

  const enemies: Enemy[] = [
    { x: 300, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 600, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
    { x: 900, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 1100, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
    { x: 1400, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 1700, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
    { x: 2000, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 2300, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
    { x: 2600, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 2900, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
    { x: 3100, y: GROUND_Y - 30, w: 28, h: 28, vx: -1.5, alive: true },
    { x: 3300, y: GROUND_Y - 30, w: 28, h: 28, vx: 1.5, alive: true },
  ];

  const coins: Coin[] = [];
  const coinPositions = [
    [220, 270], [240, 270], [260, 270],
    [520, 230], [540, 230],
    [720, 190], [740, 190], [760, 190],
    [920, 250], [940, 250],
    [1120, 210], [1140, 210], [1160, 210],
    [1420, 270], [1440, 270],
    [1620, 220], [1640, 220], [1660, 220],
    [1920, 250], [1940, 250],
    [2120, 200], [2140, 200], [2160, 200],
    [2320, 260], [2340, 260],
    [2620, 230], [2640, 230], [2660, 230],
    [2820, 190], [2840, 190],
    [3020, 240], [3040, 240], [3060, 240],
    [3220, 270], [3240, 270],
    [3420, 220], [3440, 220], [3460, 220],
  ];
  for (const [cx, cy] of coinPositions) {
    coins.push({ x: cx, y: cy, r: 8, collected: false });
  }

  return { platforms, enemies, coins };
}

export function useSuperMarioGame() {
  const stateRef = useRef<MarioGameState>({
    playerX: 60,
    playerY: GROUND_Y - PLAYER_H,
    playerVX: 0,
    playerVY: 0,
    onGround: false,
    score: 0,
    gameOver: false,
    won: false,
    cameraX: 0,
    worldWidth: 3700,
    ...buildLevel(),
  });

  const keysRef = useRef<Set<string>>(new Set());

  const getState = useCallback(() => stateRef.current, []);

  const pressKey = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey = useCallback((key: string) => keysRef.current.delete(key), []);

  const restart = useCallback(() => {
    stateRef.current = {
      playerX: 60,
      playerY: GROUND_Y - PLAYER_H,
      playerVX: 0,
      playerVY: 0,
      onGround: false,
      score: 0,
      gameOver: false,
      won: false,
      cameraX: 0,
      worldWidth: 3700,
      ...buildLevel(),
    };
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.won) return;

    const keys = keysRef.current;
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const jump = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has(' ');

    // Horizontal movement
    if (left) s.playerVX = -MOVE_SPEED;
    else if (right) s.playerVX = MOVE_SPEED;
    else s.playerVX *= 0.8;

    // Jump
    if (jump && s.onGround) {
      s.playerVY = JUMP_FORCE;
      s.onGround = false;
    }

    // Gravity
    s.playerVY += GRAVITY;

    // Move player
    s.playerX += s.playerVX;
    s.playerY += s.playerVY;

    // Clamp left
    if (s.playerX < 0) s.playerX = 0;

    // Platform collision
    s.onGround = false;
    for (const p of s.platforms) {
      const px = s.playerX, py = s.playerY;
      const overlapX = px + PLAYER_W > p.x && px < p.x + p.w;
      const overlapY = py + PLAYER_H > p.y && py < p.y + p.h;
      if (overlapX && overlapY) {
        const fromTop = (py + PLAYER_H) - p.y;
        const fromBottom = (p.y + p.h) - py;
        const fromLeft = (px + PLAYER_W) - p.x;
        const fromRight = (p.x + p.w) - px;
        const minOverlap = Math.min(fromTop, fromBottom, fromLeft, fromRight);
        if (minOverlap === fromTop && s.playerVY >= 0) {
          s.playerY = p.y - PLAYER_H;
          s.playerVY = 0;
          s.onGround = true;
        } else if (minOverlap === fromBottom && s.playerVY < 0) {
          s.playerY = p.y + p.h;
          s.playerVY = 0;
        } else if (minOverlap === fromLeft) {
          s.playerX = p.x - PLAYER_W;
          s.playerVX = 0;
        } else if (minOverlap === fromRight) {
          s.playerX = p.x + p.w;
          s.playerVX = 0;
        }
      }
    }

    // Enemy movement and collision
    for (const e of s.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      // Bounce off platforms
      let onPlatform = false;
      for (const p of s.platforms) {
        if (e.x + e.w > p.x && e.x < p.x + p.w && Math.abs((e.y + e.h) - p.y) < 4) {
          onPlatform = true;
          break;
        }
      }
      if (!onPlatform) e.vx *= -1;

      // Player stomps enemy
      const px = s.playerX, py = s.playerY;
      const ex = e.x, ey = e.y;
      const overlapX = px + PLAYER_W > ex && px < ex + e.w;
      const overlapY = py + PLAYER_H > ey && py < ey + e.h;
      if (overlapX && overlapY) {
        const stompFromTop = (py + PLAYER_H) - ey;
        if (stompFromTop < 20 && s.playerVY > 0) {
          e.alive = false;
          s.score += 100;
          s.playerVY = -8;
        } else {
          s.gameOver = true;
        }
      }
    }

    // Coin collection
    for (const c of s.coins) {
      if (c.collected) continue;
      const dx = (s.playerX + PLAYER_W / 2) - c.x;
      const dy = (s.playerY + PLAYER_H / 2) - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < c.r + 14) {
        c.collected = true;
        s.score += 50;
      }
    }

    // Fall off screen
    if (s.playerY > CANVAS_H + 100) {
      s.gameOver = true;
    }

    // Win condition: reach end of world
    if (s.playerX > s.worldWidth - 100) {
      s.won = true;
      s.score += 1000;
    }

    // Camera follow
    const targetCam = s.playerX - 300;
    s.cameraX = Math.max(0, Math.min(targetCam, s.worldWidth - 800));
  }, []);

  return { getState, pressKey, releaseKey, update, restart };
}
