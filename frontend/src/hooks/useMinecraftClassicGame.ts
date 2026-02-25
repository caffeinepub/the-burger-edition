import { useRef, useCallback } from 'react';

export type BlockType = 0 | 1 | 2 | 3 | 4; // 0=air, 1=dirt, 2=stone, 3=wood, 4=leaves

export interface MinecraftGameState {
  world: BlockType[][];
  playerX: number;
  playerY: number;
  playerVX: number;
  playerVY: number;
  onGround: boolean;
  selectedBlock: BlockType;
  hotbar: BlockType[];
  hotbarIndex: number;
  cameraX: number;
  cameraY: number;
  worldW: number;
  worldH: number;
}

const TILE = 32;
const WORLD_W = 80;
const WORLD_H = 40;
const GRAVITY = 0.4;
const JUMP_FORCE = -9;
const MOVE_SPEED = 3;
const PLAYER_W = 1.5;
const PLAYER_H = 2;

const BLOCK_COLORS: Record<BlockType, string[]> = {
  0: ['transparent', 'transparent'],
  1: ['#8B5E3C', '#6B4423'],
  2: ['#888', '#666'],
  3: ['#8B6914', '#6B4F10'],
  4: ['#2d7a2d', '#1d5a1d'],
};

function generateWorld(): BlockType[][] {
  const world: BlockType[][] = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(0) as BlockType[]);

  // Ground layers
  const groundLevel = 25;
  for (let x = 0; x < WORLD_W; x++) {
    // Surface dirt
    for (let y = groundLevel; y < groundLevel + 3; y++) {
      world[y][x] = 1;
    }
    // Stone below
    for (let y = groundLevel + 3; y < WORLD_H; y++) {
      world[y][x] = 2;
    }
    // Terrain variation
    const height = groundLevel - Math.floor(Math.sin(x * 0.3) * 2 + Math.sin(x * 0.1) * 3);
    for (let y = height; y < groundLevel; y++) {
      world[y][x] = 1;
    }
  }

  // Trees
  const treePositions = [8, 18, 30, 45, 58, 70];
  for (const tx of treePositions) {
    const base = groundLevel - 1;
    // Trunk
    for (let y = base - 4; y <= base; y++) {
      if (y >= 0 && y < WORLD_H) world[y][tx] = 3;
    }
    // Leaves
    for (let dy = -6; dy <= -3; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const lx = tx + dx, ly = base + dy;
        if (lx >= 0 && lx < WORLD_W && ly >= 0 && ly < WORLD_H && world[ly][lx] === 0) {
          world[ly][lx] = 4;
        }
      }
    }
  }

  return world;
}

export function useMinecraftClassicGame() {
  const worldRef = useRef<BlockType[][]>(generateWorld());
  const stateRef = useRef<MinecraftGameState>({
    world: worldRef.current,
    playerX: 5,
    playerY: 20,
    playerVX: 0,
    playerVY: 0,
    onGround: false,
    selectedBlock: 1,
    hotbar: [1, 2, 3, 4, 0, 0, 0, 0, 0],
    hotbarIndex: 0,
    cameraX: 0,
    cameraY: 0,
    worldW: WORLD_W,
    worldH: WORLD_H,
  });

  const keysRef = useRef<Set<string>>(new Set());

  const getState = useCallback(() => stateRef.current, []);
  const pressKey = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey = useCallback((key: string) => keysRef.current.delete(key), []);

  const selectHotbar = useCallback((index: number) => {
    const s = stateRef.current;
    s.hotbarIndex = index;
    s.selectedBlock = s.hotbar[index];
  }, []);

  const mineBlock = useCallback((canvasX: number, canvasY: number, canvasW: number, canvasH: number) => {
    const s = stateRef.current;
    const tileX = Math.floor((canvasX + s.cameraX * TILE) / TILE);
    const tileY = Math.floor((canvasY + s.cameraY * TILE) / TILE);
    if (tileX >= 0 && tileX < WORLD_W && tileY >= 0 && tileY < WORLD_H) {
      s.world[tileY][tileX] = 0;
    }
  }, []);

  const placeBlock = useCallback((canvasX: number, canvasY: number) => {
    const s = stateRef.current;
    if (s.selectedBlock === 0) return;
    const tileX = Math.floor((canvasX + s.cameraX * TILE) / TILE);
    const tileY = Math.floor((canvasY + s.cameraY * TILE) / TILE);
    if (tileX >= 0 && tileX < WORLD_W && tileY >= 0 && tileY < WORLD_H) {
      // Don't place on player
      const px = Math.floor(s.playerX), py = Math.floor(s.playerY);
      if ((tileX === px || tileX === px + 1) && (tileY === py || tileY === py + 1)) return;
      s.world[tileY][tileX] = s.selectedBlock;
    }
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    const keys = keysRef.current;
    const world = s.world;

    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const jump = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || keys.has(' ');

    if (left) s.playerVX = -MOVE_SPEED / TILE;
    else if (right) s.playerVX = MOVE_SPEED / TILE;
    else s.playerVX *= 0.7;

    if (jump && s.onGround) {
      s.playerVY = JUMP_FORCE / TILE;
      s.onGround = false;
    }

    s.playerVY += GRAVITY / TILE;

    // Move X
    s.playerX += s.playerVX;
    s.playerX = Math.max(0, Math.min(WORLD_W - PLAYER_W, s.playerX));

    // X collision
    const checkX = (px: number, py: number) => {
      for (let dy = 0; dy < Math.ceil(PLAYER_H); dy++) {
        const ty = Math.floor(py + dy);
        if (ty < 0 || ty >= WORLD_H) continue;
        const txLeft = Math.floor(px);
        const txRight = Math.floor(px + PLAYER_W - 0.01);
        if (txLeft >= 0 && txLeft < WORLD_W && world[ty][txLeft] !== 0) {
          return Math.ceil(px) - PLAYER_W + 0.01;
        }
        if (txRight >= 0 && txRight < WORLD_W && world[ty][txRight] !== 0) {
          return txRight - PLAYER_W + 0.01;
        }
      }
      return px;
    };
    s.playerX = checkX(s.playerX, s.playerY);

    // Move Y
    s.playerY += s.playerVY;
    s.onGround = false;

    // Y collision
    if (s.playerVY > 0) {
      const bottomY = s.playerY + PLAYER_H;
      const ty = Math.floor(bottomY);
      for (let dx = 0; dx < Math.ceil(PLAYER_W); dx++) {
        const tx = Math.floor(s.playerX + dx);
        if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H && world[ty][tx] !== 0) {
          s.playerY = ty - PLAYER_H;
          s.playerVY = 0;
          s.onGround = true;
          break;
        }
      }
    } else if (s.playerVY < 0) {
      const ty = Math.floor(s.playerY);
      for (let dx = 0; dx < Math.ceil(PLAYER_W); dx++) {
        const tx = Math.floor(s.playerX + dx);
        if (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H && world[ty][tx] !== 0) {
          s.playerY = ty + 1;
          s.playerVY = 0;
          break;
        }
      }
    }

    // Clamp
    if (s.playerY > WORLD_H) { s.playerY = 5; s.playerVY = 0; }

    // Camera
    s.cameraX = Math.max(0, Math.min(WORLD_W - 25, s.playerX - 12));
    s.cameraY = Math.max(0, Math.min(WORLD_H - 15, s.playerY - 7));
  }, []);

  return { getState, pressKey, releaseKey, selectHotbar, mineBlock, placeBlock, update, TILE, BLOCK_COLORS };
}
