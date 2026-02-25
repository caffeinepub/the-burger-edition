import { useRef, useCallback } from 'react';

export interface Character {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  onGround: boolean;
  facingRight: boolean;
  isPlayer: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  active: boolean;
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LolGameState {
  player: Character;
  ai: Character;
  projectiles: Projectile[];
  walls: Wall[];
  gameOver: boolean;
  playerWon: boolean;
  wins: number;
  aiShootCooldown: number;
  aiMoveCooldown: number;
}

const CANVAS_W = 800;
const CANVAS_H = 450;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const BULLET_SPEED = 8;
const GROUND_Y = 400;
const CHAR_W = 30;
const CHAR_H = 40;

const GROUND_PLATFORMS = [
  { x: 0, y: GROUND_Y, w: CANVAS_W, h: 50 },
  { x: 150, y: 300, w: 120, h: 15 },
  { x: 350, y: 250, w: 100, h: 15 },
  { x: 530, y: 300, w: 120, h: 15 },
];

function makePlayer(): Character {
  return { x: 80, y: GROUND_Y - CHAR_H, vx: 0, vy: 0, hp: 100, maxHp: 100, onGround: false, facingRight: true, isPlayer: true };
}
function makeAI(): Character {
  return { x: CANVAS_W - 110, y: GROUND_Y - CHAR_H, vx: 0, vy: 0, hp: 100, maxHp: 100, onGround: false, facingRight: false, isPlayer: false };
}

function resolveCollisions(char: Character, walls: Wall[]) {
  char.onGround = false;
  for (const w of walls) {
    const overlapX = char.x + CHAR_W > w.x && char.x < w.x + w.w;
    const overlapY = char.y + CHAR_H > w.y && char.y < w.y + w.h;
    if (overlapX && overlapY) {
      const fromTop = (char.y + CHAR_H) - w.y;
      const fromBottom = (w.y + w.h) - char.y;
      const fromLeft = (char.x + CHAR_W) - w.x;
      const fromRight = (w.x + w.w) - char.x;
      const min = Math.min(fromTop, fromBottom, fromLeft, fromRight);
      if (min === fromTop && char.vy >= 0) {
        char.y = w.y - CHAR_H;
        char.vy = 0;
        char.onGround = true;
      } else if (min === fromBottom && char.vy < 0) {
        char.y = w.y + w.h;
        char.vy = 0;
      } else if (min === fromLeft) {
        char.x = w.x - CHAR_W;
        char.vx = 0;
      } else if (min === fromRight) {
        char.x = w.x + w.w;
        char.vx = 0;
      }
    }
  }
}

export function use1v1LolGame() {
  const stateRef = useRef<LolGameState>({
    player: makePlayer(),
    ai: makeAI(),
    projectiles: [],
    walls: [...GROUND_PLATFORMS],
    gameOver: false,
    playerWon: false,
    wins: 0,
    aiShootCooldown: 0,
    aiMoveCooldown: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const shootCooldownRef = useRef(0);
  const placeCooldownRef = useRef(0);

  const getState = useCallback(() => stateRef.current, []);
  const pressKey = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey = useCallback((key: string) => keysRef.current.delete(key), []);

  const shoot = useCallback(() => {
    if (shootCooldownRef.current > 0) return;
    const s = stateRef.current;
    const p = s.player;
    const vx = p.facingRight ? BULLET_SPEED : -BULLET_SPEED;
    s.projectiles.push({
      x: p.x + (p.facingRight ? CHAR_W : 0),
      y: p.y + CHAR_H / 2,
      vx, vy: 0,
      fromPlayer: true,
      active: true,
    });
    shootCooldownRef.current = 20;
  }, []);

  const placeWall = useCallback(() => {
    if (placeCooldownRef.current > 0) return;
    const s = stateRef.current;
    const p = s.player;
    const wx = p.facingRight ? p.x + CHAR_W + 5 : p.x - 25;
    s.walls.push({ x: wx, y: p.y - 60, w: 20, h: 80 });
    placeCooldownRef.current = 60;
  }, []);

  const restart = useCallback(() => {
    const wins = stateRef.current.wins;
    stateRef.current = {
      player: makePlayer(),
      ai: makeAI(),
      projectiles: [],
      walls: [...GROUND_PLATFORMS],
      gameOver: false,
      playerWon: false,
      wins,
      aiShootCooldown: 0,
      aiMoveCooldown: 0,
    };
    shootCooldownRef.current = 0;
    placeCooldownRef.current = 0;
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;

    const keys = keysRef.current;
    const p = s.player;
    const ai = s.ai;

    // Player movement
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
      p.vx = -MOVE_SPEED;
      p.facingRight = false;
    } else if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
      p.vx = MOVE_SPEED;
      p.facingRight = true;
    } else {
      p.vx *= 0.8;
    }

    if ((keys.has('ArrowUp') || keys.has('w') || keys.has('W')) && p.onGround) {
      p.vy = JUMP_FORCE;
    }

    // Cooldowns
    if (shootCooldownRef.current > 0) shootCooldownRef.current--;
    if (placeCooldownRef.current > 0) placeCooldownRef.current--;

    // Apply gravity and move
    p.vy += GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.x = Math.max(0, Math.min(CANVAS_W - CHAR_W, p.x));
    resolveCollisions(p, s.walls);

    // AI logic
    s.aiShootCooldown = Math.max(0, s.aiShootCooldown - 1);
    s.aiMoveCooldown = Math.max(0, s.aiMoveCooldown - 1);

    if (s.aiMoveCooldown <= 0) {
      const dx = p.x - ai.x;
      const targetDist = 200;
      if (Math.abs(dx) > targetDist + 30) {
        ai.vx = dx > 0 ? MOVE_SPEED * 0.7 : -MOVE_SPEED * 0.7;
        ai.facingRight = dx > 0;
      } else if (Math.abs(dx) < targetDist - 30) {
        ai.vx = dx > 0 ? -MOVE_SPEED * 0.5 : MOVE_SPEED * 0.5;
      } else {
        ai.vx *= 0.8;
      }
      ai.facingRight = dx > 0;
      if (Math.random() < 0.02 && ai.onGround) ai.vy = JUMP_FORCE;
      s.aiMoveCooldown = 5;
    }

    ai.vy += GRAVITY;
    ai.x += ai.vx;
    ai.y += ai.vy;
    ai.x = Math.max(0, Math.min(CANVAS_W - CHAR_W, ai.x));
    resolveCollisions(ai, s.walls);

    // AI shoot
    if (s.aiShootCooldown <= 0) {
      const dx = p.x - ai.x;
      if (Math.abs(dx) < 350) {
        const vx = dx > 0 ? BULLET_SPEED * 0.8 : -BULLET_SPEED * 0.8;
        s.projectiles.push({
          x: ai.x + (dx > 0 ? CHAR_W : 0),
          y: ai.y + CHAR_H / 2,
          vx, vy: 0,
          fromPlayer: false,
          active: true,
        });
        s.aiShootCooldown = 60 + Math.random() * 40;
      }
    }

    // Update projectiles
    for (const proj of s.projectiles) {
      if (!proj.active) continue;
      proj.x += proj.vx;
      proj.y += proj.vy;

      if (proj.x < 0 || proj.x > CANVAS_W || proj.y < 0 || proj.y > CANVAS_H) {
        proj.active = false;
        continue;
      }

      // Wall collision
      for (const w of s.walls) {
        if (proj.x > w.x && proj.x < w.x + w.w && proj.y > w.y && proj.y < w.y + w.h) {
          proj.active = false;
          break;
        }
      }

      // Hit player
      if (proj.fromPlayer === false) {
        if (proj.x > p.x && proj.x < p.x + CHAR_W && proj.y > p.y && proj.y < p.y + CHAR_H) {
          p.hp -= 10;
          proj.active = false;
          if (p.hp <= 0) { s.gameOver = true; s.playerWon = false; }
        }
      } else {
        if (proj.x > ai.x && proj.x < ai.x + CHAR_W && proj.y > ai.y && proj.y < ai.y + CHAR_H) {
          ai.hp -= 10;
          proj.active = false;
          if (ai.hp <= 0) { s.gameOver = true; s.playerWon = true; s.wins++; }
        }
      }
    }

    s.projectiles = s.projectiles.filter(p => p.active);
  }, []);

  return { getState, pressKey, releaseKey, shoot, placeWall, update, restart };
}
