import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WeaponType = 'sniper' | 'shotgun' | 'pistol' | 'machinegun';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type GamePhase = 'idle' | 'playing' | 'gameover';
export type StructureType = 'wall' | 'floor' | 'ramp';

export interface WeaponStats {
  name: string;
  maxAmmo: number;
  reloadTime: number; // ms
  damage: number;
  fireRate: number; // ms between shots
  pellets: number;
  spread: number;
  projectileSpeed: number;
  color: string;
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  sniper: {
    name: 'SNIPER',
    maxAmmo: 1,
    reloadTime: 2500,
    damage: 80,
    fireRate: 0,
    pellets: 1,
    spread: 0.01,
    projectileSpeed: 80,
    color: '#ffff00',
  },
  shotgun: {
    name: 'SHOTGUN',
    maxAmmo: 5,
    reloadTime: 1500,
    damage: 15,
    fireRate: 600,
    pellets: 6,
    spread: 0.18,
    projectileSpeed: 40,
    color: '#ff8800',
  },
  pistol: {
    name: 'PISTOL',
    maxAmmo: 20,
    reloadTime: 800,
    damage: 25,
    fireRate: 250,
    pellets: 1,
    spread: 0.04,
    projectileSpeed: 55,
    color: '#00ffff',
  },
  machinegun: {
    name: 'MACHINE GUN',
    maxAmmo: 25,
    reloadTime: 1200,
    damage: 12,
    fireRate: 100,
    pellets: 1,
    spread: 0.08,
    projectileSpeed: 60,
    color: '#ff00ff',
  },
};

export interface DifficultyConfig {
  label: string;
  reactionTime: number; // ms
  accuracy: number; // 0-1
  moveSpeed: number;
  color: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'EASY', reactionTime: 1500, accuracy: 0.4, moveSpeed: 3, color: '#00ff88' },
  medium: { label: 'MEDIUM', reactionTime: 800, accuracy: 0.6, moveSpeed: 5, color: '#ffcc00' },
  hard: { label: 'HARD', reactionTime: 350, accuracy: 0.8, moveSpeed: 7, color: '#ff8800' },
  extreme: { label: 'EXTREME', reactionTime: 80, accuracy: 0.95, moveSpeed: 9, color: '#ff0044' },
};

export interface Projectile {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  fromPlayer: boolean;
  damage: number;
  weapon: WeaponType;
  life: number; // seconds remaining
}

export interface CombatantState {
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  ammo: number;
  isReloading: boolean;
  reloadProgress: number; // 0-1
  lastFireTime: number;
}

// Structure dimensions: wall 2x3x0.3, floor 3x0.3x3, ramp 2x1.5x2
export const STRUCTURE_DIMS: Record<StructureType, [number, number, number]> = {
  wall: [2, 3, 0.3],
  floor: [3, 0.3, 3],
  ramp: [2, 1.5, 2],
};

export interface PlacedStructure {
  id: number;
  type: StructureType;
  position: THREE.Vector3;
  rotationY: number; // radians, for ramp facing direction
}

export interface GameState {
  phase: GamePhase;
  player: CombatantState;
  bot: CombatantState;
  projectiles: Projectile[];
  difficulty: Difficulty;
  score: number;
  playerWon: boolean;
  // Build mode
  buildMode: boolean;
  selectedStructure: StructureType;
  placedStructures: PlacedStructure[];
  ghostPosition: THREE.Vector3 | null;
  ghostRotationY: number;
}

// ─── Arena constants ──────────────────────────────────────────────────────────
const ARENA_SIZE = 40;
const PLAYER_HEIGHT = 1.7;
const BOT_HEIGHT = 1.7;
const HIT_RADIUS = 1.2;
const PROJECTILE_LIFE = 4; // seconds
const GRAVITY = -18;
const JUMP_VELOCITY = 9;
const GHOST_DISTANCE = 4; // units in front of player

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function use1v1Lol3DGame() {
  const [gameState, setGameState] = useState<GameState>(() => makeInitialState('easy'));
  const stateRef = useRef<GameState>(makeInitialState('easy'));
  const projectileIdRef = useRef(0);
  const structureIdRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // AI timing refs
  const aiReactionTimerRef = useRef<number>(0);
  const aiFireTimerRef = useRef<number>(0);
  const aiReloadTimerRef = useRef<number>(0);
  const playerReloadTimerRef = useRef<number>(0);
  const playerLastFireRef = useRef<number>(0);

  // Jump state refs
  const playerVelocityYRef = useRef<number>(0);
  const playerJumpCountRef = useRef<number>(0); // 0 = can jump, 1 = used first jump, 2 = used double jump
  const playerIsGroundedRef = useRef<boolean>(true);
  const jumpPressedRef = useRef<boolean>(false); // track edge trigger

  // AI build timer
  const aiBuildTimerRef = useRef<number>(0);
  const aiBuildIntervalRef = useRef<number>(7000); // ms between AI builds

  // Input refs (set from outside)
  const keysRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef<THREE.Camera | null>(null);

  function makeInitialState(diff: Difficulty): GameState {
    return {
      phase: 'idle',
      difficulty: diff,
      score: 0,
      playerWon: false,
      buildMode: false,
      selectedStructure: 'wall',
      placedStructures: [],
      ghostPosition: null,
      ghostRotationY: 0,
      player: {
        position: new THREE.Vector3(0, PLAYER_HEIGHT, 10),
        hp: 100,
        maxHp: 100,
        weapon: 'pistol',
        ammo: WEAPONS.pistol.maxAmmo,
        isReloading: false,
        reloadProgress: 0,
        lastFireTime: 0,
      },
      bot: {
        position: new THREE.Vector3(0, BOT_HEIGHT, -10),
        hp: 100,
        maxHp: 100,
        weapon: 'pistol',
        ammo: WEAPONS.pistol.maxAmmo,
        isReloading: false,
        reloadProgress: 0,
        lastFireTime: 0,
      },
      projectiles: [],
    };
  }

  const syncState = useCallback(() => {
    setGameState({ ...stateRef.current });
  }, []);

  // ─── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback((diff: Difficulty) => {
    const fresh = makeInitialState(diff);
    fresh.phase = 'playing';
    stateRef.current = fresh;
    aiReactionTimerRef.current = 0;
    aiFireTimerRef.current = 0;
    aiReloadTimerRef.current = 0;
    playerReloadTimerRef.current = 0;
    playerLastFireRef.current = 0;
    lastTimeRef.current = 0;
    playerVelocityYRef.current = 0;
    playerJumpCountRef.current = 0;
    playerIsGroundedRef.current = true;
    jumpPressedRef.current = false;
    aiBuildTimerRef.current = 0;
    aiBuildIntervalRef.current = 7000 + Math.random() * 3000;
    syncState();
  }, [syncState]);

  // ─── Reset to idle ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    const diff = stateRef.current.difficulty;
    const fresh = makeInitialState(diff);
    stateRef.current = fresh;
    aiReactionTimerRef.current = 0;
    aiFireTimerRef.current = 0;
    aiReloadTimerRef.current = 0;
    playerReloadTimerRef.current = 0;
    playerLastFireRef.current = 0;
    lastTimeRef.current = 0;
    playerVelocityYRef.current = 0;
    playerJumpCountRef.current = 0;
    playerIsGroundedRef.current = true;
    jumpPressedRef.current = false;
    aiBuildTimerRef.current = 0;
    syncState();
  }, [syncState]);

  // ─── Switch weapon ───────────────────────────────────────────────────────────
  const switchWeapon = useCallback((weapon: WeaponType) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    if (s.player.weapon === weapon) return;
    s.player.weapon = weapon;
    s.player.ammo = WEAPONS[weapon].maxAmmo;
    s.player.isReloading = false;
    s.player.reloadProgress = 0;
    playerReloadTimerRef.current = 0;
    syncState();
  }, [syncState]);

  // ─── Toggle build mode ───────────────────────────────────────────────────────
  const toggleBuildMode = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    s.buildMode = !s.buildMode;
    if (!s.buildMode) {
      s.ghostPosition = null;
    }
    syncState();
  }, [syncState]);

  // ─── Select structure ────────────────────────────────────────────────────────
  const selectStructure = useCallback((type: StructureType) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    s.selectedStructure = type;
    syncState();
  }, [syncState]);

  // ─── Place structure ─────────────────────────────────────────────────────────
  const placeStructure = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || !s.buildMode || !s.ghostPosition) return;
    s.placedStructures = [
      ...s.placedStructures,
      {
        id: ++structureIdRef.current,
        type: s.selectedStructure,
        position: s.ghostPosition.clone(),
        rotationY: s.ghostRotationY,
      },
    ];
    syncState();
  }, [syncState]);

  // ─── Fire (player) ───────────────────────────────────────────────────────────
  const firePlayer = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    if (s.buildMode) {
      // In build mode, left click places structure
      placeStructure();
      return;
    }
    const p = s.player;
    if (p.isReloading || p.ammo <= 0) return;
    const now = performance.now();
    const weapon = WEAPONS[p.weapon];
    if (now - playerLastFireRef.current < weapon.fireRate) return;
    playerLastFireRef.current = now;

    const cam = cameraRef.current;
    if (!cam) return;

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);

    const newProjectiles: Projectile[] = [];
    for (let i = 0; i < weapon.pellets; i++) {
      const spread = weapon.spread;
      const vel = dir.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * spread * 2,
          (Math.random() - 0.5) * spread * 2,
          (Math.random() - 0.5) * spread * 2
        )
      ).normalize().multiplyScalar(weapon.projectileSpeed);

      newProjectiles.push({
        id: ++projectileIdRef.current,
        position: p.position.clone().add(new THREE.Vector3(0, 0.2, 0)),
        velocity: vel,
        fromPlayer: true,
        damage: weapon.damage,
        weapon: p.weapon,
        life: PROJECTILE_LIFE,
      });
    }

    p.ammo -= 1;
    s.projectiles = [...s.projectiles, ...newProjectiles];

    if (p.ammo <= 0) {
      p.isReloading = true;
      p.reloadProgress = 0;
      playerReloadTimerRef.current = 0;
    }

    syncState();
  }, [syncState, placeStructure]);

  // ─── AI weapon selection ─────────────────────────────────────────────────────
  function selectAiWeapon(dist: number): WeaponType {
    if (dist > 25) return 'sniper';
    if (dist < 8) return 'shotgun';
    if (dist < 18) return 'machinegun';
    return 'pistol';
  }

  // ─── Structure collision helpers ─────────────────────────────────────────────
  // Returns true if a point (x, z) is blocked by a placed structure (for horizontal movement)
  function checkStructureCollision(
    newPos: THREE.Vector3,
    structures: PlacedStructure[],
    radius: number
  ): THREE.Vector3 {
    const result = newPos.clone();
    for (const struct of structures) {
      const dims = STRUCTURE_DIMS[struct.type];
      const hw = dims[0] / 2 + radius;
      const hd = dims[2] / 2 + radius;
      const structTop = struct.position.y + dims[1] / 2;
      const structBottom = struct.position.y - dims[1] / 2;

      // Only collide horizontally if we're within the vertical range of the structure
      if (result.y > structTop + 0.1 || result.y < structBottom - 0.5) continue;

      const dx = result.x - struct.position.x;
      const dz = result.z - struct.position.z;

      if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
        // Push out on the axis with less overlap
        const overlapX = hw - Math.abs(dx);
        const overlapZ = hd - Math.abs(dz);
        if (overlapX < overlapZ) {
          result.x += dx > 0 ? overlapX : -overlapX;
        } else {
          result.z += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
    return result;
  }

  // Returns the highest surface Y at a given (x, z) from placed structures
  function getStructureSurfaceY(x: number, z: number, structures: PlacedStructure[]): number {
    let maxY = 0; // ground level
    for (const struct of structures) {
      const dims = STRUCTURE_DIMS[struct.type];
      const hw = dims[0] / 2;
      const hd = dims[2] / 2;
      const dx = Math.abs(x - struct.position.x);
      const dz = Math.abs(z - struct.position.z);
      if (dx < hw && dz < hd) {
        const top = struct.position.y + dims[1] / 2;
        if (top > maxY) maxY = top;
      }
    }
    return maxY;
  }

  // ─── Game loop ───────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    const delta = lastTimeRef.current === 0 ? 0.016 : Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    const player = s.player;
    const bot = s.bot;
    const diff = DIFFICULTY_CONFIGS[s.difficulty];

    // ── Player movement (WASD via camera direction) ──────────────────────────
    const cam = cameraRef.current;
    if (cam && delta > 0) {
      const speed = 8;
      const forward = new THREE.Vector3();
      cam.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (keysRef.current.has('w') || keysRef.current.has('W')) move.add(forward);
      if (keysRef.current.has('s') || keysRef.current.has('S')) move.sub(forward);
      if (keysRef.current.has('a') || keysRef.current.has('A')) move.sub(right);
      if (keysRef.current.has('d') || keysRef.current.has('D')) move.add(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * delta);
        const newPos = player.position.clone().add(move);
        // Clamp to arena
        const half = ARENA_SIZE / 2 - 1.5;
        newPos.x = Math.max(-half, Math.min(half, newPos.x));
        newPos.z = Math.max(-half, Math.min(half, newPos.z));
        // Structure collision (horizontal)
        const corrected = checkStructureCollision(newPos, s.placedStructures, 0.5);
        player.position.x = corrected.x;
        player.position.z = corrected.z;
      }

      // ── Double jump / gravity ──────────────────────────────────────────────
      const spacePressed = keysRef.current.has(' ');
      const groundY = getStructureSurfaceY(player.position.x, player.position.z, s.placedStructures);
      const floorY = groundY + PLAYER_HEIGHT;

      // Jump on leading edge of space press
      if (spacePressed && !jumpPressedRef.current) {
        jumpPressedRef.current = true;
        if (playerJumpCountRef.current < 2) {
          playerVelocityYRef.current = JUMP_VELOCITY;
          playerJumpCountRef.current += 1;
          playerIsGroundedRef.current = false;
        }
      }
      if (!spacePressed) {
        jumpPressedRef.current = false;
      }

      // Apply gravity
      if (!playerIsGroundedRef.current || player.position.y > floorY + 0.05) {
        playerVelocityYRef.current += GRAVITY * delta;
        player.position.y += playerVelocityYRef.current * delta;
      }

      // Land on floor
      if (player.position.y <= floorY) {
        player.position.y = floorY;
        playerVelocityYRef.current = 0;
        playerIsGroundedRef.current = true;
        playerJumpCountRef.current = 0;
      }

      // Sync camera position
      cam.position.copy(player.position);

      // ── Ghost preview for build mode ───────────────────────────────────────
      if (s.buildMode) {
        const fwd = new THREE.Vector3();
        cam.getWorldDirection(fwd);
        fwd.y = 0;
        fwd.normalize();
        const ghostPos = player.position.clone().add(fwd.multiplyScalar(GHOST_DISTANCE));
        // Snap to ground or structure surface
        const ghostGroundY = getStructureSurfaceY(ghostPos.x, ghostPos.z, s.placedStructures);
        const dims = STRUCTURE_DIMS[s.selectedStructure];
        ghostPos.y = ghostGroundY + dims[1] / 2;
        // Clamp ghost to arena
        const half = ARENA_SIZE / 2 - 1;
        ghostPos.x = Math.max(-half, Math.min(half, ghostPos.x));
        ghostPos.z = Math.max(-half, Math.min(half, ghostPos.z));
        s.ghostPosition = ghostPos;
        // Rotation: face toward player
        s.ghostRotationY = Math.atan2(
          player.position.x - ghostPos.x,
          player.position.z - ghostPos.z
        );
      } else {
        s.ghostPosition = null;
      }
    }

    // ── Player reload ────────────────────────────────────────────────────────
    if (player.isReloading) {
      playerReloadTimerRef.current += delta * 1000;
      const reloadTime = WEAPONS[player.weapon].reloadTime;
      player.reloadProgress = Math.min(playerReloadTimerRef.current / reloadTime, 1);
      if (playerReloadTimerRef.current >= reloadTime) {
        player.isReloading = false;
        player.reloadProgress = 0;
        player.ammo = WEAPONS[player.weapon].maxAmmo;
        playerReloadTimerRef.current = 0;
      }
    }

    // ── AI logic ─────────────────────────────────────────────────────────────
    const distToPlayer = bot.position.distanceTo(player.position);

    // AI weapon selection
    const idealWeapon = selectAiWeapon(distToPlayer);
    if (!bot.isReloading && bot.weapon !== idealWeapon) {
      bot.weapon = idealWeapon;
      bot.ammo = WEAPONS[idealWeapon].maxAmmo;
    }

    // AI reload
    if (bot.isReloading) {
      aiReloadTimerRef.current += delta * 1000;
      const reloadTime = WEAPONS[bot.weapon].reloadTime;
      bot.reloadProgress = Math.min(aiReloadTimerRef.current / reloadTime, 1);
      if (aiReloadTimerRef.current >= reloadTime) {
        bot.isReloading = false;
        bot.reloadProgress = 0;
        bot.ammo = WEAPONS[bot.weapon].maxAmmo;
        aiReloadTimerRef.current = 0;
      }
    }

    // AI movement — strafe and approach/retreat, avoid structures
    {
      const toPlayer = player.position.clone().sub(bot.position);
      toPlayer.y = 0;
      const dist2d = toPlayer.length();
      const idealDist = bot.weapon === 'sniper' ? 28 : bot.weapon === 'shotgun' ? 6 : 15;

      let moveDir = new THREE.Vector3();
      if (dist2d > 0.1) {
        const normalized = toPlayer.clone().normalize();
        if (dist2d > idealDist + 2) {
          moveDir.add(normalized);
        } else if (dist2d < idealDist - 2) {
          moveDir.sub(normalized);
        }
        // Strafe
        const strafe = new THREE.Vector3(-normalized.z, 0, normalized.x);
        const strafeDir = Math.sin(timestamp * 0.001) > 0 ? 1 : -1;
        moveDir.add(strafe.multiplyScalar(strafeDir * 0.5));
      }

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().multiplyScalar(diff.moveSpeed * delta);
        const newBotPos = bot.position.clone().add(moveDir);
        const half = ARENA_SIZE / 2 - 1.5;
        newBotPos.x = Math.max(-half, Math.min(half, newBotPos.x));
        newBotPos.z = Math.max(-half, Math.min(half, newBotPos.z));
        // Structure collision for bot
        const correctedBot = checkStructureCollision(newBotPos, s.placedStructures, 0.5);
        bot.position.x = correctedBot.x;
        bot.position.z = correctedBot.z;
        // Bot stands on structures
        const botGroundY = getStructureSurfaceY(bot.position.x, bot.position.z, s.placedStructures);
        bot.position.y = botGroundY + BOT_HEIGHT;
      }
    }

    // AI fire
    aiReactionTimerRef.current += delta * 1000;
    if (aiReactionTimerRef.current >= diff.reactionTime && !bot.isReloading && bot.ammo > 0) {
      aiFireTimerRef.current += delta * 1000;
      const fireRate = WEAPONS[bot.weapon].fireRate;
      if (aiFireTimerRef.current >= Math.max(fireRate, 200)) {
        aiFireTimerRef.current = 0;
        aiReactionTimerRef.current = 0;

        // Aim at player with accuracy offset
        const toPlayer = player.position.clone().sub(bot.position).normalize();
        const inaccuracy = (1 - diff.accuracy) * 0.4;
        const weapon = WEAPONS[bot.weapon];

        for (let i = 0; i < weapon.pellets; i++) {
          const vel = toPlayer.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * inaccuracy * 2,
              (Math.random() - 0.5) * inaccuracy * 2,
              (Math.random() - 0.5) * inaccuracy * 2
            )
          ).normalize().multiplyScalar(weapon.projectileSpeed);

          s.projectiles.push({
            id: ++projectileIdRef.current,
            position: bot.position.clone().add(new THREE.Vector3(0, 0.2, 0)),
            velocity: vel,
            fromPlayer: false,
            damage: weapon.damage,
            weapon: bot.weapon,
            life: PROJECTILE_LIFE,
          });
        }

        bot.ammo -= 1;
        if (bot.ammo <= 0) {
          bot.isReloading = true;
          bot.reloadProgress = 0;
          aiReloadTimerRef.current = 0;
        }
      }
    }

    // AI building (Hard/Extreme only)
    if (s.difficulty === 'hard' || s.difficulty === 'extreme') {
      aiBuildTimerRef.current += delta * 1000;
      if (aiBuildTimerRef.current >= aiBuildIntervalRef.current) {
        aiBuildTimerRef.current = 0;
        aiBuildIntervalRef.current = 5000 + Math.random() * 5000;
        // Place a wall or ramp in front of the bot facing the player
        const toPlayer = player.position.clone().sub(bot.position);
        toPlayer.y = 0;
        toPlayer.normalize();
        const buildPos = bot.position.clone().add(toPlayer.multiplyScalar(2));
        const botGroundY = getStructureSurfaceY(buildPos.x, buildPos.z, s.placedStructures);
        const structType: StructureType = Math.random() > 0.5 ? 'wall' : 'ramp';
        const dims = STRUCTURE_DIMS[structType];
        buildPos.y = botGroundY + dims[1] / 2;
        const half = ARENA_SIZE / 2 - 1;
        buildPos.x = Math.max(-half, Math.min(half, buildPos.x));
        buildPos.z = Math.max(-half, Math.min(half, buildPos.z));
        s.placedStructures = [
          ...s.placedStructures,
          {
            id: ++structureIdRef.current,
            type: structType,
            position: buildPos,
            rotationY: Math.atan2(
              bot.position.x - buildPos.x,
              bot.position.z - buildPos.z
            ),
          },
        ];
      }
    }

    // ── Projectile update & collision ────────────────────────────────────────
    const surviving: Projectile[] = [];
    for (const proj of s.projectiles) {
      proj.life -= delta;
      if (proj.life <= 0) continue;

      proj.position.addScaledVector(proj.velocity, delta);

      // Arena bounds check
      const half = ARENA_SIZE / 2;
      if (
        Math.abs(proj.position.x) > half ||
        Math.abs(proj.position.z) > half ||
        proj.position.y < 0 ||
        proj.position.y > 12
      ) continue;

      // Check if projectile hit a placed structure
      let hitStructure = false;
      for (const struct of s.placedStructures) {
        const dims = STRUCTURE_DIMS[struct.type];
        const hw = dims[0] / 2 + 0.1;
        const hh = dims[1] / 2 + 0.1;
        const hd = dims[2] / 2 + 0.1;
        const dx = Math.abs(proj.position.x - struct.position.x);
        const dy = Math.abs(proj.position.y - struct.position.y);
        const dz = Math.abs(proj.position.z - struct.position.z);
        if (dx < hw && dy < hh && dz < hd) {
          hitStructure = true;
          break;
        }
      }
      if (hitStructure) continue;

      // Hit detection
      let hit = false;
      if (proj.fromPlayer) {
        const dist = proj.position.distanceTo(bot.position);
        if (dist < HIT_RADIUS) {
          bot.hp = Math.max(0, bot.hp - proj.damage);
          hit = true;
        }
      } else {
        const dist = proj.position.distanceTo(player.position);
        if (dist < HIT_RADIUS) {
          player.hp = Math.max(0, player.hp - proj.damage);
          hit = true;
        }
      }

      if (!hit) surviving.push(proj);
    }
    s.projectiles = surviving;

    // ── Check game over ──────────────────────────────────────────────────────
    if (player.hp <= 0 || bot.hp <= 0) {
      const playerWon = bot.hp <= 0 && player.hp > 0;
      s.phase = 'gameover';
      s.playerWon = playerWon;
      s.score = playerWon ? Math.round(player.hp) : 0;
      syncState();
      return;
    }

    syncState();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [syncState]);

  // ─── Start/stop loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.phase === 'playing') {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState.phase, gameLoop]);

  return {
    gameState,
    startGame,
    reset,
    switchWeapon,
    firePlayer,
    toggleBuildMode,
    selectStructure,
    placeStructure,
    keysRef,
    cameraRef,
  };
}
