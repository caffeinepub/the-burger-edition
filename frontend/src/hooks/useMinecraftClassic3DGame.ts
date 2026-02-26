import { useRef, useCallback, useState } from 'react';
import * as THREE from 'three';

// ─── Block Types ────────────────────────────────────────────────────────────
export type BlockType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
// 0=air, 1=grass, 2=dirt, 3=stone, 4=wood/log, 5=sand, 6=bedrock, 7=diamond

export interface BlockDef {
  name: string;
  color: string;
  emissive: string;
  emissiveIntensity: number;
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  0: { name: 'AIR',     color: '#000000', emissive: '#000000', emissiveIntensity: 0 },
  1: { name: 'GRASS',   color: '#2d8a4e', emissive: '#00ff88', emissiveIntensity: 0.05 },
  2: { name: 'DIRT',    color: '#7a4f2e', emissive: '#8b4513', emissiveIntensity: 0.02 },
  3: { name: 'STONE',   color: '#6b6b6b', emissive: '#888888', emissiveIntensity: 0.02 },
  4: { name: 'WOOD',    color: '#8b5e1a', emissive: '#d2691e', emissiveIntensity: 0.04 },
  5: { name: 'SAND',    color: '#c8a84b', emissive: '#f4a460', emissiveIntensity: 0.03 },
  6: { name: 'BEDROCK', color: '#1a1a2e', emissive: '#00ffff', emissiveIntensity: 0.08 },
  7: { name: 'DIAMOND', color: '#00e5ff', emissive: '#00e5ff', emissiveIntensity: 0.3 },
};

export const HOTBAR_BLOCKS: BlockType[] = [1, 2, 3, 4, 5, 6, 7];

// ─── World Dimensions ───────────────────────────────────────────────────────
export const WORLD_X = 48;
export const WORLD_Y = 24;
export const WORLD_Z = 48;

// ─── Mob Types ───────────────────────────────────────────────────────────────
export type MobType = 'zombie' | 'skeleton' | 'spider';

export interface Mob {
  id: number;
  type: MobType;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  alive: boolean;
  attackCooldown: number;
  velocity: THREE.Vector3;
}

export interface Arrow {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alive: boolean;
  age: number;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  isFood?: boolean;
  hungerRestore?: number;
  isTool?: boolean;
  toolType?: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  ingredients: { itemId: string; count: number }[];
  result: { itemId: string; count: number };
  description: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    ingredients: [{ itemId: 'wood', count: 3 }],
    result: { itemId: 'wooden_pickaxe', count: 1 },
    description: 'Mine stone faster',
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    ingredients: [{ itemId: 'stone', count: 3 }, { itemId: 'wood', count: 2 }],
    result: { itemId: 'stone_pickaxe', count: 1 },
    description: 'Mine diamond blocks',
  },
  {
    id: 'bread',
    name: 'Bread',
    ingredients: [{ itemId: 'wood', count: 2 }],
    result: { itemId: 'bread', count: 1 },
    description: 'Restores 6 hunger',
  },
  {
    id: 'cooked_meat',
    name: 'Cooked Meat',
    ingredients: [{ itemId: 'raw_meat', count: 1 }, { itemId: 'wood', count: 1 }],
    result: { itemId: 'cooked_meat', count: 1 },
    description: 'Restores 8 hunger',
  },
  {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    ingredients: [{ itemId: 'wood', count: 2 }],
    result: { itemId: 'wooden_sword', count: 1 },
    description: 'Deal more damage to mobs',
  },
];

// ─── Terrain Generation ─────────────────────────────────────────────────────
function noise2d(x: number, z: number): number {
  const s  = Math.sin(x * 0.31 + z * 0.17) * 43758.5453;
  const s2 = Math.sin(x * 0.13 + z * 0.41) * 12345.6789;
  const s3 = Math.sin(x * 0.07 + z * 0.23) * 98765.4321;
  return (
    (s  - Math.floor(s))  * 0.5 +
    (s2 - Math.floor(s2)) * 0.3 +
    (s3 - Math.floor(s3)) * 0.2
  );
}

function generateWorld(): Uint8Array {
  const world = new Uint8Array(WORLD_X * WORLD_Y * WORLD_Z);
  const idx = (x: number, y: number, z: number) =>
    y * WORLD_X * WORLD_Z + z * WORLD_X + x;

  for (let x = 0; x < WORLD_X; x++) {
    for (let z = 0; z < WORLD_Z; z++) {
      const n = noise2d(x, z);
      const surfaceY = Math.floor(12 + n * 5); // 12–17

      for (let y = 0; y < WORLD_Y; y++) {
        if (y === 0) {
          world[idx(x, y, z)] = 6; // bedrock
        } else if (y < surfaceY - 4) {
          // Occasionally place diamond deep underground
          const diamondNoise = noise2d(x * 7.3 + 100, z * 5.1 + 200);
          world[idx(x, y, z)] = (y < 5 && diamondNoise > 0.88) ? 7 : 3; // diamond or stone
        } else if (y < surfaceY) {
          world[idx(x, y, z)] = 2; // dirt
        } else if (y === surfaceY) {
          const isSand =
            (x < 4 || x > WORLD_X - 5 || z < 4 || z > WORLD_Z - 5) && n < 0.35;
          world[idx(x, y, z)] = isSand ? 5 : 1; // grass or sand
        }
      }

      // Trees
      const treeNoise = noise2d(x * 3.7, z * 2.9);
      if (
        treeNoise > 0.82 &&
        x > 3 && x < WORLD_X - 4 &&
        z > 3 && z < WORLD_Z - 4
      ) {
        const base = surfaceY + 1;
        for (let ty = base; ty < base + 4 && ty < WORLD_Y - 1; ty++) {
          world[idx(x, ty, z)] = 4; // wood
        }
        const leafTop = base + 4;
        for (let ly = leafTop - 1; ly <= leafTop + 1 && ly < WORLD_Y - 1; ly++) {
          const radius = ly === leafTop ? 1 : 2;
          for (let lx = x - radius; lx <= x + radius; lx++) {
            for (let lz = z - radius; lz <= z + radius; lz++) {
              if (lx >= 0 && lx < WORLD_X && lz >= 0 && lz < WORLD_Z) {
                if (world[idx(lx, ly, lz)] === 0) {
                  world[idx(lx, ly, lz)] = 1;
                }
              }
            }
          }
        }
      }
    }
  }

  return world;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBlock(world: Uint8Array, x: number, y: number, z: number): BlockType {
  if (x < 0 || x >= WORLD_X || y < 0 || y >= WORLD_Y || z < 0 || z >= WORLD_Z) return 0;
  return world[y * WORLD_X * WORLD_Z + z * WORLD_X + x] as BlockType;
}

function setBlock(
  world: Uint8Array,
  x: number,
  y: number,
  z: number,
  type: BlockType
): void {
  if (x < 0 || x >= WORLD_X || y < 0 || y >= WORLD_Y || z < 0 || z >= WORLD_Z) return;
  world[y * WORLD_X * WORLD_Z + z * WORLD_X + x] = type;
}

// ─── DDA Raycasting ──────────────────────────────────────────────────────────
export interface RaycastResult {
  blockPos: THREE.Vector3 | null;
  faceNormal: THREE.Vector3 | null;
  placePos: THREE.Vector3 | null;
}

function raycastWorld(
  world: Uint8Array,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  maxDist = 6
): RaycastResult {
  const dx = direction.x, dy = direction.y, dz = direction.z;
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const stepZ = dz > 0 ? 1 : -1;

  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);

  let tMaxX = dx === 0 ? Infinity : (dx > 0 ? (x + 1 - origin.x) : (origin.x - x)) / Math.abs(dx);
  let tMaxY = dy === 0 ? Infinity : (dy > 0 ? (y + 1 - origin.y) : (origin.y - y)) / Math.abs(dy);
  let tMaxZ = dz === 0 ? Infinity : (dz > 0 ? (z + 1 - origin.z) : (origin.z - z)) / Math.abs(dz);

  let lastFaceX = 0, lastFaceY = 0, lastFaceZ = 0;
  let dist = 0;

  while (dist < maxDist) {
    const block = getBlock(world, x, y, z);
    if (block !== 0) {
      return {
        blockPos: new THREE.Vector3(x, y, z),
        faceNormal: new THREE.Vector3(lastFaceX, lastFaceY, lastFaceZ),
        placePos: new THREE.Vector3(x + lastFaceX, y + lastFaceY, z + lastFaceZ),
      };
    }

    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      dist = tMaxX;
      tMaxX += tDeltaX;
      x += stepX;
      lastFaceX = -stepX; lastFaceY = 0; lastFaceZ = 0;
    } else if (tMaxY < tMaxZ) {
      dist = tMaxY;
      tMaxY += tDeltaY;
      y += stepY;
      lastFaceX = 0; lastFaceY = -stepY; lastFaceZ = 0;
    } else {
      dist = tMaxZ;
      tMaxZ += tDeltaZ;
      z += stepZ;
      lastFaceX = 0; lastFaceY = 0; lastFaceZ = -stepZ;
    }
  }

  return { blockPos: null, faceNormal: null, placePos: null };
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  onGround: boolean;
  yaw: number;
  pitch: number;
}

let mobIdCounter = 0;
let arrowIdCounter = 0;

export function useMinecraftClassic3DGame() {
  const worldRef = useRef<Uint8Array>(generateWorld());

  const playerRef = useRef<PlayerState>({
    position: new THREE.Vector3(WORLD_X / 2, 20, WORLD_Z / 2),
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    yaw: 0,
    pitch: 0,
  });

  const keysRef       = useRef<Set<string>>(new Set());
  const mouseDeltaRef = useRef({ x: 0, y: 0 });

  // ─── Survival Stats ─────────────────────────────────────────────────────
  const healthRef   = useRef(20);
  const hungerRef   = useRef(20);
  const staminaRef  = useRef(100);
  const xpRef       = useRef(0);
  const levelRef    = useRef(1);

  const [health,  setHealth]  = useState(20);
  const [hunger,  setHunger]  = useState(20);
  const [stamina, setStamina] = useState(100);
  const [xp,      setXp]      = useState(0);
  const [level,   setLevel]   = useState(1);
  const xpToNextLevel = 100;

  // ─── Inventory ──────────────────────────────────────────────────────────
  const inventoryRef = useRef<InventoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // ─── Mobs & Arrows ──────────────────────────────────────────────────────
  const mobsRef   = useRef<Mob[]>([]);
  const arrowsRef = useRef<Arrow[]>([]);
  const [mobs,   setMobs]   = useState<Mob[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // ─── Timers ─────────────────────────────────────────────────────────────
  const hungerTimerRef  = useRef(0);
  const spawnTimerRef   = useRef(0);
  const statsTimerRef   = useRef(0);
  const invincibleRef   = useRef(0); // invincibility frames after taking damage

  const [selectedSlot, setSelectedSlot] = useState(0);
  const [worldVersion, setWorldVersion] = useState(0);
  const [targetBlock, setTargetBlock]   = useState<THREE.Vector3 | null>(null);
  const [targetFace, setTargetFace]     = useState<THREE.Vector3 | null>(null);
  const [placePos, setPlacePos]         = useState<THREE.Vector3 | null>(null);
  const [isDead, setIsDead]             = useState(false);

  const hotbar: BlockType[] = HOTBAR_BLOCKS;

  const pressKey      = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey    = useCallback((key: string) => keysRef.current.delete(key), []);
  const addMouseDelta = useCallback((dx: number, dy: number) => {
    mouseDeltaRef.current.x += dx;
    mouseDeltaRef.current.y += dy;
  }, []);

  // ─── Inventory Helpers ──────────────────────────────────────────────────
  const addToInventory = useCallback((itemId: string, count: number = 1) => {
    const inv = inventoryRef.current;
    const existing = inv.find(i => i.id === itemId);
    if (existing) {
      existing.count += count;
    } else {
      const itemDefs: Record<string, Omit<InventoryItem, 'count'>> = {
        wood:          { id: 'wood',          name: 'Wood',          isFood: false },
        stone:         { id: 'stone',         name: 'Stone',         isFood: false },
        sand:          { id: 'sand',          name: 'Sand',          isFood: false },
        diamond:       { id: 'diamond',       name: 'Diamond',       isFood: false },
        apple:         { id: 'apple',         name: 'Apple',         isFood: true,  hungerRestore: 4 },
        raw_meat:      { id: 'raw_meat',      name: 'Raw Meat',      isFood: true,  hungerRestore: 2 },
        bread:         { id: 'bread',         name: 'Bread',         isFood: true,  hungerRestore: 6 },
        cooked_meat:   { id: 'cooked_meat',   name: 'Cooked Meat',   isFood: true,  hungerRestore: 8 },
        wooden_pickaxe:{ id: 'wooden_pickaxe',name: 'Wood Pickaxe',  isTool: true,  toolType: 'pickaxe_wood' },
        stone_pickaxe: { id: 'stone_pickaxe', name: 'Stone Pickaxe', isTool: true,  toolType: 'pickaxe_stone' },
        wooden_sword:  { id: 'wooden_sword',  name: 'Wood Sword',    isTool: true,  toolType: 'sword_wood' },
      };
      const def = itemDefs[itemId];
      if (def) inv.push({ ...def, count });
    }
    inventoryRef.current = [...inv];
    setInventory([...inventoryRef.current]);
  }, []);

  const removeFromInventory = useCallback((itemId: string, count: number = 1): boolean => {
    const inv = inventoryRef.current;
    const existing = inv.find(i => i.id === itemId);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) {
      inventoryRef.current = inv.filter(i => i.id !== itemId);
    } else {
      inventoryRef.current = [...inv];
    }
    setInventory([...inventoryRef.current]);
    return true;
  }, []);

  const getItemCount = useCallback((itemId: string): number => {
    return inventoryRef.current.find(i => i.id === itemId)?.count ?? 0;
  }, []);

  const hasTool = useCallback((toolType: string): boolean => {
    return inventoryRef.current.some(i => i.isTool && i.toolType === toolType);
  }, []);

  const craftItem = useCallback((recipeId: string) => {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    for (const ing of recipe.ingredients) {
      if (getItemCount(ing.itemId) < ing.count) return false;
    }
    for (const ing of recipe.ingredients) {
      removeFromInventory(ing.itemId, ing.count);
    }
    addToInventory(recipe.result.itemId, recipe.result.count);
    return true;
  }, [getItemCount, removeFromInventory, addToInventory]);

  const consumeFood = useCallback((itemId: string) => {
    const item = inventoryRef.current.find(i => i.id === itemId && i.isFood);
    if (!item) return false;
    const restore = item.hungerRestore ?? 4;
    hungerRef.current = Math.min(20, hungerRef.current + restore);
    setHunger(hungerRef.current);
    removeFromInventory(itemId, 1);
    return true;
  }, [removeFromInventory]);

  // ─── XP Helper ──────────────────────────────────────────────────────────
  const grantXP = useCallback((amount: number) => {
    xpRef.current += amount;
    if (xpRef.current >= 100) {
      xpRef.current -= 100;
      levelRef.current += 1;
      setLevel(levelRef.current);
    }
    setXp(xpRef.current);
  }, []);

  // ─── Respawn ─────────────────────────────────────────────────────────────
  const respawn = useCallback(() => {
    playerRef.current.position.set(WORLD_X / 2, 22, WORLD_Z / 2);
    playerRef.current.velocity.set(0, 0, 0);
    healthRef.current  = 20;
    hungerRef.current  = 20;
    staminaRef.current = 100;
    setHealth(20);
    setHunger(20);
    setStamina(100);
    inventoryRef.current = [];
    setInventory([]);
    mobsRef.current = [];
    setMobs([]);
    arrowsRef.current = [];
    setArrows([]);
    setIsDead(false);
    invincibleRef.current = 3;
  }, []);

  // ─── Mob Spawning ────────────────────────────────────────────────────────
  const spawnMob = useCallback(() => {
    const p = playerRef.current.position;
    const types: MobType[] = ['zombie', 'skeleton', 'spider'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Spawn 12-20 blocks away from player
    const angle = Math.random() * Math.PI * 2;
    const dist  = 12 + Math.random() * 8;
    const sx = Math.max(2, Math.min(WORLD_X - 2, p.x + Math.cos(angle) * dist));
    const sz = Math.max(2, Math.min(WORLD_Z - 2, p.z + Math.sin(angle) * dist));

    // Find surface Y
    let sy = 20;
    for (let y = WORLD_Y - 1; y >= 1; y--) {
      if (getBlock(worldRef.current, Math.floor(sx), y, Math.floor(sz)) !== 0) {
        sy = y + 1;
        break;
      }
    }

    const hpMap: Record<MobType, number> = { zombie: 20, skeleton: 15, spider: 12 };
    const hp = hpMap[type];

    const mob: Mob = {
      id: ++mobIdCounter,
      type,
      position: new THREE.Vector3(sx, sy, sz),
      hp,
      maxHp: hp,
      alive: true,
      attackCooldown: 0,
      velocity: new THREE.Vector3(0, 0, 0),
    };

    mobsRef.current = [...mobsRef.current, mob];
    setMobs([...mobsRef.current]);
  }, []);

  // ─── Raycast ─────────────────────────────────────────────────────────────
  const updateRaycast = useCallback(() => {
    const p = playerRef.current;
    const dir = new THREE.Vector3(
      -Math.sin(p.yaw) * Math.cos(p.pitch),
       Math.sin(p.pitch),
      -Math.cos(p.yaw) * Math.cos(p.pitch)
    ).normalize();
    const eyePos = p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const result = raycastWorld(worldRef.current, eyePos, dir);
    setTargetBlock(result.blockPos);
    setTargetFace(result.faceNormal);
    setPlacePos(result.placePos);
  }, []);

  // ─── Mine Block ──────────────────────────────────────────────────────────
  const mineBlock = useCallback(() => {
    const p = playerRef.current;
    const dir = new THREE.Vector3(
      -Math.sin(p.yaw) * Math.cos(p.pitch),
       Math.sin(p.pitch),
      -Math.cos(p.yaw) * Math.cos(p.pitch)
    ).normalize();
    const eyePos = p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const result = raycastWorld(worldRef.current, eyePos, dir);
    if (result.blockPos) {
      const { x, y, z } = result.blockPos;
      const blockType = getBlock(worldRef.current, x, y, z);
      if (blockType === 6) return; // can't mine bedrock

      // Tool requirements
      if (blockType === 3 && !hasTool('pickaxe_wood') && !hasTool('pickaxe_stone')) {
        // Stone mines very slowly without pickaxe — skip for now (instant but no drop)
        setBlock(worldRef.current, x, y, z, 0);
        setWorldVersion(v => v + 1);
        setTargetBlock(null);
        return;
      }
      if (blockType === 7 && !hasTool('pickaxe_stone')) {
        // Diamond requires stone pickaxe
        return;
      }

      setBlock(worldRef.current, x, y, z, 0);
      setWorldVersion(v => v + 1);
      setTargetBlock(null);

      // Drop items
      if (blockType === 4) addToInventory('wood', 1);
      else if (blockType === 3) addToInventory('stone', 1);
      else if (blockType === 5) addToInventory('sand', 1);
      else if (blockType === 7) {
        addToInventory('diamond', 1);
        grantXP(10);
      } else if (blockType === 1) {
        // Leaf/grass: small chance of apple
        if (Math.random() < 0.15) addToInventory('apple', 1);
      }

      // Stamina cost for attacking/mining
      staminaRef.current = Math.max(0, staminaRef.current - 5);
      setStamina(staminaRef.current);
    }
  }, [addToInventory, grantXP, hasTool]);

  // ─── Place Block ─────────────────────────────────────────────────────────
  const placeBlock = useCallback((slot: number) => {
    const p = playerRef.current;
    const dir = new THREE.Vector3(
      -Math.sin(p.yaw) * Math.cos(p.pitch),
       Math.sin(p.pitch),
      -Math.cos(p.yaw) * Math.cos(p.pitch)
    ).normalize();
    const eyePos = p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const result = raycastWorld(worldRef.current, eyePos, dir);
    if (result.placePos) {
      const { x, y, z } = result.placePos;
      const px = p.position.x, py = p.position.y, pz = p.position.z;
      const inPlayerX = x === Math.floor(px);
      const inPlayerZ = z === Math.floor(pz);
      const inPlayerY = y === Math.floor(py) || y === Math.floor(py + 1);
      if (inPlayerX && inPlayerY && inPlayerZ) return;
      const blockType = HOTBAR_BLOCKS[slot];
      setBlock(worldRef.current, x, y, z, blockType);
      setWorldVersion(v => v + 1);
    }
  }, []);

  // ─── Attack Mob (melee) ──────────────────────────────────────────────────
  const attackMob = useCallback(() => {
    const p = playerRef.current;
    const eyePos = p.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const dir = new THREE.Vector3(
      -Math.sin(p.yaw) * Math.cos(p.pitch),
       Math.sin(p.pitch),
      -Math.cos(p.yaw) * Math.cos(p.pitch)
    ).normalize();

    const hasSword = hasTool('sword_wood');
    const damage = hasSword ? 6 : 3;
    const range  = 3.5;

    let hit = false;
    const updatedMobs = mobsRef.current.map(mob => {
      if (!mob.alive || hit) return mob;
      const toMob = mob.position.clone().sub(eyePos);
      const dist  = toMob.length();
      if (dist > range) return mob;
      const dot = toMob.normalize().dot(dir);
      if (dot < 0.7) return mob; // ~45 degree cone
      hit = true;
      const newHp = mob.hp - damage;
      if (newHp <= 0) {
        // Grant XP for kill
        const xpMap: Record<MobType, number> = { zombie: 5, skeleton: 7, spider: 6 };
        grantXP(xpMap[mob.type]);
        // Chance to drop raw meat
        if (Math.random() < 0.5) addToInventory('raw_meat', 1);
        return { ...mob, hp: 0, alive: false };
      }
      return { ...mob, hp: newHp };
    });

    mobsRef.current = updatedMobs;
    setMobs([...mobsRef.current]);

    // Stamina cost
    staminaRef.current = Math.max(0, staminaRef.current - 10);
    setStamina(staminaRef.current);
  }, [grantXP, addToInventory, hasTool]);

  const GRAVITY      = 20;
  const JUMP_SPEED   = 8;
  const MOVE_SPEED   = 5;
  const SPRINT_SPEED = 8;
  const PLAYER_H     = 1.8;
  const PLAYER_R     = 0.3;
  const MOUSE_SENS   = 0.002;

  const update = useCallback((dt: number) => {
    const p    = playerRef.current;
    const keys = keysRef.current;
    const md   = mouseDeltaRef.current;

    if (isDead) return;

    // Mouse look
    p.yaw   -= md.x * MOUSE_SENS;
    p.pitch -= md.y * MOUSE_SENS;
    p.pitch  = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, p.pitch));
    mouseDeltaRef.current = { x: 0, y: 0 };

    // Sprint check
    const isSprinting = keys.has('ShiftLeft') || keys.has('Shift');
    const canSprint   = staminaRef.current > 0;
    const speed       = (isSprinting && canSprint) ? SPRINT_SPEED : MOVE_SPEED;

    // Movement
    const fwd  = keys.has('KeyW') || keys.has('w') || keys.has('W');
    const bwd  = keys.has('KeyS') || keys.has('s') || keys.has('S');
    const lft  = keys.has('KeyA') || keys.has('a') || keys.has('A');
    const rgt  = keys.has('KeyD') || keys.has('d') || keys.has('D');
    const jump = keys.has('Space') || keys.has(' ');

    const sinY = Math.sin(p.yaw);
    const cosY = Math.cos(p.yaw);

    let moveX = 0, moveZ = 0;
    if (fwd)  { moveX -= sinY; moveZ -= cosY; }
    if (bwd)  { moveX += sinY; moveZ += cosY; }
    if (lft)  { moveX -= cosY; moveZ += sinY; }
    if (rgt)  { moveX += cosY; moveZ -= sinY; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    p.velocity.x = moveX * speed;
    p.velocity.z = moveZ * speed;

    if (jump && p.onGround) {
      p.velocity.y = JUMP_SPEED;
      p.onGround   = false;
    }

    p.velocity.y -= GRAVITY * dt;

    const world = worldRef.current;
    const solid = (x: number, y: number, z: number) =>
      getBlock(world, Math.floor(x), Math.floor(y), Math.floor(z)) !== 0;

    // ── Move X ──
    p.position.x += p.velocity.x * dt;
    if (p.velocity.x !== 0) {
      const sign = p.velocity.x > 0 ? 1 : -1;
      const edgeX = p.position.x + sign * PLAYER_R;
      let hit = false;
      for (const dy of [0, 0.5, 1.0, PLAYER_H - 0.01]) {
        for (const dz of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
          if (solid(edgeX, p.position.y + dy, p.position.z + dz)) { hit = true; break; }
        }
        if (hit) break;
      }
      if (hit) {
        p.position.x = sign > 0
          ? Math.floor(edgeX) - PLAYER_R - 0.001
          : Math.ceil(edgeX)  + PLAYER_R + 0.001;
        p.velocity.x = 0;
      }
    }

    // ── Move Z ──
    p.position.z += p.velocity.z * dt;
    if (p.velocity.z !== 0) {
      const sign = p.velocity.z > 0 ? 1 : -1;
      const edgeZ = p.position.z + sign * PLAYER_R;
      let hit = false;
      for (const dy of [0, 0.5, 1.0, PLAYER_H - 0.01]) {
        for (const dx of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
          if (solid(p.position.x + dx, p.position.y + dy, edgeZ)) { hit = true; break; }
        }
        if (hit) break;
      }
      if (hit) {
        p.position.z = sign > 0
          ? Math.floor(edgeZ) - PLAYER_R - 0.001
          : Math.ceil(edgeZ)  + PLAYER_R + 0.001;
        p.velocity.z = 0;
      }
    }

    // ── Move Y ──
    p.position.y += p.velocity.y * dt;
    p.onGround = false;

    if (p.velocity.y <= 0) {
      const footY    = p.position.y;
      const floorTY  = Math.floor(footY);
      let hitFloor   = false;
      for (const dx of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
        for (const dz of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
          if (solid(p.position.x + dx, floorTY, p.position.z + dz)) {
            hitFloor = true; break;
          }
        }
        if (hitFloor) break;
      }
      if (hitFloor) {
        p.position.y = floorTY + 1;
        p.velocity.y = 0;
        p.onGround   = true;
      }
    } else {
      const headY   = p.position.y + PLAYER_H;
      const ceilTY  = Math.floor(headY);
      let hitCeil   = false;
      for (const dx of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
        for (const dz of [-PLAYER_R + 0.01, PLAYER_R - 0.01]) {
          if (solid(p.position.x + dx, ceilTY, p.position.z + dz)) {
            hitCeil = true; break;
          }
        }
        if (hitCeil) break;
      }
      if (hitCeil) {
        p.position.y = ceilTY - PLAYER_H - 0.001;
        p.velocity.y = 0;
      }
    }

    // World bounds & fall reset
    p.position.x = Math.max(PLAYER_R, Math.min(WORLD_X - PLAYER_R, p.position.x));
    p.position.z = Math.max(PLAYER_R, Math.min(WORLD_Z - PLAYER_R, p.position.z));
    if (p.position.y < -5) {
      p.position.set(WORLD_X / 2, 22, WORLD_Z / 2);
      p.velocity.set(0, 0, 0);
    }

    // ── Stamina ──
    const isMoving = len > 0;
    if (isSprinting && isMoving && canSprint) {
      staminaRef.current = Math.max(0, staminaRef.current - 15 * dt);
    } else if (!isSprinting || !isMoving) {
      staminaRef.current = Math.min(100, staminaRef.current + 12 * dt);
    }

    // ── Hunger drain ──
    hungerTimerRef.current += dt;
    if (hungerTimerRef.current >= 4) {
      hungerTimerRef.current = 0;
      hungerRef.current = Math.max(0, hungerRef.current - 1);
    }

    // ── Health drain from hunger ──
    if (hungerRef.current === 0) {
      statsTimerRef.current += dt;
      if (statsTimerRef.current >= 3) {
        statsTimerRef.current = 0;
        healthRef.current = Math.max(0, healthRef.current - 1);
      }
    } else {
      statsTimerRef.current = 0;
    }

    // ── Mob spawning ──
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= 8 && mobsRef.current.filter(m => m.alive).length < 8) {
      spawnTimerRef.current = 0;
      spawnMob();
    }

    // ── Mob AI ──
    let mobsChanged = false;
    const updatedMobs = mobsRef.current.map(mob => {
      if (!mob.alive) return mob;

      const toPlayer = p.position.clone().sub(mob.position);
      const distToPlayer = toPlayer.length();

      // Mob movement speed
      const mobSpeed = mob.type === 'spider' ? 4.5 : mob.type === 'skeleton' ? 2.5 : 3.0;

      // Chase player
      if (distToPlayer > 1.5) {
        const dir2d = new THREE.Vector3(toPlayer.x, 0, toPlayer.z).normalize();
        mob.position.x += dir2d.x * mobSpeed * dt;
        mob.position.z += dir2d.z * mobSpeed * dt;
        // Spider erratic movement
        if (mob.type === 'spider') {
          mob.position.x += (Math.random() - 0.5) * 2 * dt;
          mob.position.z += (Math.random() - 0.5) * 2 * dt;
        }
      }

      // Keep mob on surface
      const mx = Math.floor(mob.position.x);
      const mz = Math.floor(mob.position.z);
      for (let y = WORLD_Y - 1; y >= 1; y--) {
        if (getBlock(worldRef.current, mx, y, mz) !== 0) {
          mob.position.y = y + 1;
          break;
        }
      }

      // Clamp to world
      mob.position.x = Math.max(1, Math.min(WORLD_X - 1, mob.position.x));
      mob.position.z = Math.max(1, Math.min(WORLD_Z - 1, mob.position.z));

      // Attack cooldown
      mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);

      // Melee attack (zombie, spider)
      if ((mob.type === 'zombie' || mob.type === 'spider') && distToPlayer < 1.8 && mob.attackCooldown <= 0) {
        if (invincibleRef.current <= 0) {
          const dmg = mob.type === 'zombie' ? 3 : 2;
          healthRef.current = Math.max(0, healthRef.current - dmg);
          invincibleRef.current = 1.5;
          mobsChanged = true;
        }
        mob.attackCooldown = 1.5;
      }

      // Skeleton ranged attack
      if (mob.type === 'skeleton' && distToPlayer < 15 && mob.attackCooldown <= 0) {
        const dir = toPlayer.clone().normalize();
        const arrow: Arrow = {
          id: ++arrowIdCounter,
          position: mob.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
          velocity: dir.multiplyScalar(12),
          alive: true,
          age: 0,
        };
        arrowsRef.current = [...arrowsRef.current, arrow];
        setArrows([...arrowsRef.current]);
        mob.attackCooldown = 2.5;
      }

      return mob;
    });

    mobsRef.current = updatedMobs;

    // ── Arrow physics ──
    const updatedArrows = arrowsRef.current.map(arrow => {
      if (!arrow.alive) return arrow;
      arrow.position.x += arrow.velocity.x * dt;
      arrow.position.y += arrow.velocity.y * dt - 4.9 * dt * dt;
      arrow.position.z += arrow.velocity.z * dt;
      arrow.age += dt;

      // Check if arrow hits player
      const distToPlayer = arrow.position.distanceTo(p.position.clone().add(new THREE.Vector3(0, 1, 0)));
      if (distToPlayer < 0.8 && invincibleRef.current <= 0) {
        healthRef.current = Math.max(0, healthRef.current - 2);
        invincibleRef.current = 1.0;
        mobsChanged = true;
        return { ...arrow, alive: false };
      }

      // Check if arrow hits world
      const ax = Math.floor(arrow.position.x);
      const ay = Math.floor(arrow.position.y);
      const az = Math.floor(arrow.position.z);
      if (getBlock(worldRef.current, ax, ay, az) !== 0 || arrow.age > 5) {
        return { ...arrow, alive: false };
      }

      return arrow;
    }).filter(a => a.alive || a.age < 0.1);

    arrowsRef.current = updatedArrows;

    // ── Invincibility frames ──
    if (invincibleRef.current > 0) {
      invincibleRef.current = Math.max(0, invincibleRef.current - dt);
    }

    // ── Update React state periodically ──
    setMobs([...mobsRef.current]);
    setArrows([...arrowsRef.current]);
    setHealth(healthRef.current);
    setHunger(hungerRef.current);
    setStamina(Math.round(staminaRef.current));

    // ── Death check ──
    if (healthRef.current <= 0) {
      setIsDead(true);
    }

    updateRaycast();
  }, [isDead, updateRaycast, spawnMob]);

  return {
    worldRef,
    worldVersion,
    playerRef,
    hotbar,
    selectedSlot,
    setSelectedSlot,
    targetBlock,
    targetFace,
    placePos,
    pressKey,
    releaseKey,
    addMouseDelta,
    mineBlock,
    placeBlock,
    attackMob,
    update,
    // Survival
    health,
    hunger,
    stamina,
    xp,
    xpToNextLevel,
    level,
    isDead,
    respawn,
    // Mobs & Arrows
    mobs,
    arrows,
    // Inventory & Crafting
    inventory,
    craftingRecipes: CRAFTING_RECIPES,
    craftItem,
    consumeFood,
    getItemCount,
    hasTool,
  };
}
