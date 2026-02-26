import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  useMinecraftClassic3DGame,
  BLOCK_DEFS,
  HOTBAR_BLOCKS,
  WORLD_X,
  WORLD_Y,
  WORLD_Z,
  BlockType,
  PlayerState,
  Mob,
  Arrow,
  InventoryItem,
  CraftingRecipe,
} from '../hooks/useMinecraftClassic3DGame';

// ─── Block color constants (literal hex for Three.js) ────────────────────────
const BLOCK_COLOR_HEX: Record<BlockType, number> = {
  0: 0x000000,
  1: 0x2d8a4e,
  2: 0x7a4f2e,
  3: 0x6b6b6b,
  4: 0x8b5e1a,
  5: 0xc8a84b,
  6: 0x1a1a2e,
  7: 0x00e5ff,
};
const BLOCK_EMISSIVE_HEX: Record<BlockType, number> = {
  0: 0x000000,
  1: 0x00ff88,
  2: 0x8b4513,
  3: 0x888888,
  4: 0xd2691e,
  5: 0xf4a460,
  6: 0x00ffff,
  7: 0x00e5ff,
};
const BLOCK_EMISSIVE_INT: Record<BlockType, number> = {
  0: 0, 1: 0.06, 2: 0.02, 3: 0.02, 4: 0.04, 5: 0.04, 6: 0.1, 7: 0.4,
};

const HOTBAR_CSS_COLORS: Record<BlockType, string> = {
  0: 'transparent',
  1: '#2d8a4e',
  2: '#7a4f2e',
  3: '#6b6b6b',
  4: '#8b5e1a',
  5: '#c8a84b',
  6: '#1a1a2e',
  7: '#00e5ff',
};

// ─── Voxel World ─────────────────────────────────────────────────────────────
interface VoxelWorldProps {
  worldRef: React.MutableRefObject<Uint8Array>;
  worldVersion: number;
  targetBlock: THREE.Vector3 | null;
}

function VoxelWorld({ worldRef, worldVersion, targetBlock }: VoxelWorldProps) {
  const meshRefs = useRef<Record<number, THREE.InstancedMesh | null>>({});
  const dummy    = useMemo(() => new THREE.Object3D(), []);

  const maxCounts = useMemo(() => {
    const world  = worldRef.current;
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    for (let i = 0; i < world.length; i++) {
      const b = world[i];
      if (b > 0 && b <= 7) counts[b]++;
    }
    for (let i = 1; i <= 7; i++) counts[i] = counts[i] + 1000;
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const world   = worldRef.current;
    const indices: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    for (let y = 0; y < WORLD_Y; y++) {
      for (let z = 0; z < WORLD_Z; z++) {
        for (let x = 0; x < WORLD_X; x++) {
          const b = world[y * WORLD_X * WORLD_Z + z * WORLD_X + x] as BlockType;
          if (b === 0) continue;
          const mesh = meshRefs.current[b];
          if (!mesh) continue;
          const i = indices[b]++;
          if (i >= maxCounts[b]) continue;
          dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
      }
    }

    for (let bt = 1; bt <= 7; bt++) {
      const mesh = meshRefs.current[bt];
      if (mesh) {
        mesh.count = indices[bt] || 0;
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [worldVersion, worldRef, dummy, maxCounts]);

  const blockTypes = [1, 2, 3, 4, 5, 6, 7] as BlockType[];

  return (
    <group>
      {blockTypes.map((bt) => (
        <instancedMesh
          key={bt}
          ref={(el) => { meshRefs.current[bt] = el; }}
          args={[undefined, undefined, maxCounts[bt]]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={BLOCK_COLOR_HEX[bt]}
            emissive={BLOCK_EMISSIVE_HEX[bt]}
            emissiveIntensity={BLOCK_EMISSIVE_INT[bt]}
            roughness={0.85}
            metalness={bt === 7 ? 0.8 : 0.05}
          />
        </instancedMesh>
      ))}
      {targetBlock && (
        <mesh position={[targetBlock.x + 0.5, targetBlock.y + 0.5, targetBlock.z + 0.5]}>
          <boxGeometry args={[1.03, 1.03, 1.03]} />
          <meshBasicMaterial color={0x00ff88} wireframe transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

// ─── Mob Meshes ──────────────────────────────────────────────────────────────
interface MobMeshesProps {
  mobs: Mob[];
  arrows: Arrow[];
}

function MobMeshes({ mobs, arrows }: MobMeshesProps) {
  return (
    <group>
      {mobs.filter(m => m.alive).map(mob => (
        <MobMesh key={mob.id} mob={mob} />
      ))}
      {arrows.filter(a => a.alive).map(arrow => (
        <mesh key={arrow.id} position={[arrow.position.x, arrow.position.y, arrow.position.z]}>
          <boxGeometry args={[0.08, 0.08, 0.5]} />
          <meshStandardMaterial color={0xc8a84b} emissive={0xf4a460} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function MobMesh({ mob }: { mob: Mob }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(mob.position.x, mob.position.y, mob.position.z);
    }
  });

  if (mob.type === 'zombie') {
    return (
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.6, 0.8, 0.3]} />
          <meshStandardMaterial color={0x2d6e2d} emissive={0x1a4a1a} emissiveIntensity={0.2} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={0x3a7a3a} emissive={0x00ff44} emissiveIntensity={0.15} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.45, 0.9, 0.1]}>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={0x2d6e2d} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.45, 0.9, 0.1]}>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color={0x2d6e2d} />
        </mesh>
        {/* Left leg */}
        <mesh position={[-0.18, 0.25, 0]}>
          <boxGeometry args={[0.25, 0.5, 0.25]} />
          <meshStandardMaterial color={0x1a4a1a} />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.18, 0.25, 0]}>
          <boxGeometry args={[0.25, 0.5, 0.25]} />
          <meshStandardMaterial color={0x1a4a1a} />
        </mesh>
        {/* HP bar */}
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.05]} />
          <meshBasicMaterial color={0x333333} />
        </mesh>
        <mesh position={[-(0.3 - (mob.hp / mob.maxHp) * 0.3), 2.3, 0.01]}>
          <boxGeometry args={[(mob.hp / mob.maxHp) * 0.6, 0.08, 0.05]} />
          <meshBasicMaterial color={0xff2222} />
        </mesh>
      </group>
    );
  }

  if (mob.type === 'skeleton') {
    return (
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.45, 0.7, 0.2]} />
          <meshStandardMaterial color={0xd4d4d4} emissive={0xffffff} emissiveIntensity={0.1} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color={0xe8e8e8} emissive={0xffffff} emissiveIntensity={0.12} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.38, 0.9, 0]}>
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          <meshStandardMaterial color={0xd4d4d4} />
        </mesh>
        <mesh position={[0.38, 0.9, 0]}>
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          <meshStandardMaterial color={0xd4d4d4} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.14, 0.25, 0]}>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color={0xc0c0c0} />
        </mesh>
        <mesh position={[0.14, 0.25, 0]}>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color={0xc0c0c0} />
        </mesh>
        {/* HP bar */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.05]} />
          <meshBasicMaterial color={0x333333} />
        </mesh>
        <mesh position={[-(0.3 - (mob.hp / mob.maxHp) * 0.3), 2.2, 0.01]}>
          <boxGeometry args={[(mob.hp / mob.maxHp) * 0.6, 0.08, 0.05]} />
          <meshBasicMaterial color={0xff2222} />
        </mesh>
      </group>
    );
  }

  // Spider
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.5]} />
        <meshStandardMaterial color={0x2a1a2a} emissive={0xff0000} emissiveIntensity={0.15} />
      </mesh>
      {/* Head */}
      <mesh position={[0.5, 0.4, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color={0x1a0a1a} emissive={0xff0000} emissiveIntensity={0.3} />
      </mesh>
      {/* Legs */}
      {[-0.3, 0, 0.3].map((z, i) => (
        <group key={i}>
          <mesh position={[-0.65, 0.3, z]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
            <meshStandardMaterial color={0x2a1a2a} />
          </mesh>
          <mesh position={[0.65, 0.3, z]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
            <meshStandardMaterial color={0x2a1a2a} />
          </mesh>
        </group>
      ))}
      {/* HP bar */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.05]} />
        <meshBasicMaterial color={0x333333} />
      </mesh>
      <mesh position={[-(0.3 - (mob.hp / mob.maxHp) * 0.3), 0.9, 0.01]}>
        <boxGeometry args={[(mob.hp / mob.maxHp) * 0.6, 0.08, 0.05]} />
        <meshBasicMaterial color={0xff2222} />
      </mesh>
    </group>
  );
}

// ─── Lighting & Sky ──────────────────────────────────────────────────────────
function SceneLighting() {
  return (
    <>
      <color attach="background" args={['#050d1a']} />
      <fog attach="fog" args={['#050d1a', 24, 64]} />
      <ambientLight intensity={0.45} color="#334466" />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.3}
        color="#aaccff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} color="#2244aa" />
      <pointLight position={[WORLD_X / 2, 2, WORLD_Z / 2]} intensity={0.6} color="#00ff88" distance={35} />
    </>
  );
}

// ─── First-Person Controller ──────────────────────────────────────────────────
interface FPControllerProps {
  playerRef: React.MutableRefObject<PlayerState>;
  update: (dt: number) => void;
  pressKey: (key: string) => void;
  releaseKey: (key: string) => void;
  addMouseDelta: (dx: number, dy: number) => void;
  mineBlock: () => void;
  placeBlock: (slot: number) => void;
  attackMob: () => void;
  selectedSlotRef: React.MutableRefObject<number>;
  onLockChange: (locked: boolean) => void;
  craftingOpen: boolean;
}

function FPController({
  playerRef,
  update,
  pressKey,
  releaseKey,
  addMouseDelta,
  mineBlock,
  placeBlock,
  attackMob,
  selectedSlotRef,
  onLockChange,
  craftingOpen,
}: FPControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const p = playerRef.current;
    camera.position.set(p.position.x, p.position.y + 1.6, p.position.z);
    (camera as THREE.PerspectiveCamera).fov  = 75;
    (camera as THREE.PerspectiveCamera).near = 0.05;
    (camera as THREE.PerspectiveCamera).far  = 200;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera, playerRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (craftingOpen) return;
      pressKey(e.code);
      pressKey(e.key);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      releaseKey(e.code);
      releaseKey(e.key);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (controlsRef.current?.isLocked) {
        addMouseDelta(e.movementX, e.movementY);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!controlsRef.current?.isLocked || craftingOpen) return;
      if (e.button === 0) {
        mineBlock();
        attackMob();
      }
      if (e.button === 2) placeBlock(selectedSlotRef.current);
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('contextmenu', onContextMenu);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [pressKey, releaseKey, addMouseDelta, mineBlock, placeBlock, attackMob, selectedSlotRef, craftingOpen]);

  useFrame((_, delta) => {
    if (craftingOpen) return;
    const dt = Math.min(delta, 0.05);
    update(dt);

    const p = playerRef.current;
    camera.position.set(p.position.x, p.position.y + 1.6, p.position.z);
    const euler = new THREE.Euler(p.pitch, p.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => onLockChange(true)}
      onUnlock={() => onLockChange(false)}
      makeDefault={false}
    />
  );
}

// ─── Survival HUD ────────────────────────────────────────────────────────────
interface SurvivalHUDProps {
  health: number;
  hunger: number;
  stamina: number;
  xp: number;
  xpToNextLevel: number;
  level: number;
}

function SurvivalHUD({ health, hunger, stamina, xp, xpToNextLevel, level }: SurvivalHUDProps) {
  const bars = [
    { label: '❤️ HP',     value: health,  max: 20,          color: '#ff4444', glow: 'rgba(255,68,68,0.7)',   bg: 'rgba(255,68,68,0.15)' },
    { label: '🍖 Food',   value: hunger,  max: 20,          color: '#ff9900', glow: 'rgba(255,153,0,0.7)',   bg: 'rgba(255,153,0,0.15)' },
    { label: '⚡ Stamina',value: stamina, max: 100,         color: '#00ffcc', glow: 'rgba(0,255,204,0.7)',   bg: 'rgba(0,255,204,0.15)' },
    { label: `⭐ XP Lv${level}`, value: xp, max: xpToNextLevel, color: '#ffd700', glow: 'rgba(255,215,0,0.7)', bg: 'rgba(255,215,0,0.15)' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        zIndex: 20,
        pointerEvents: 'none',
        minWidth: '340px',
      }}
    >
      {bars.map(bar => (
        <div
          key={bar.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,0.65)',
            border: `1px solid ${bar.color}44`,
            borderRadius: '6px',
            padding: '4px 8px',
            boxShadow: `0 0 8px ${bar.glow}33`,
          }}
        >
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: bar.color,
            textShadow: `0 0 8px ${bar.glow}`,
            minWidth: '80px',
            whiteSpace: 'nowrap',
          }}>
            {bar.label}
          </span>
          <div style={{
            flex: 1,
            height: '10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '3px',
            border: `1px solid ${bar.color}33`,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(bar.value / bar.max) * 100}%`,
              background: bar.color,
              boxShadow: `0 0 6px ${bar.glow}`,
              borderRadius: '3px',
              transition: 'width 0.15s ease',
            }} />
          </div>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: bar.color,
            minWidth: '32px',
            textAlign: 'right',
          }}>
            {Math.round(bar.value)}/{bar.max}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Hotbar HUD ──────────────────────────────────────────────────────────────
interface HotbarHUDProps {
  selectedSlot: number;
  onSelect: (i: number) => void;
}

function HotbarHUD({ selectedSlot, onSelect }: HotbarHUDProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '5px',
        zIndex: 20,
        pointerEvents: 'auto',
      }}
    >
      {HOTBAR_BLOCKS.map((bt, i) => {
        const isSelected = i === selectedSlot;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              width: '50px',
              height: '50px',
              border: isSelected ? '2px solid #00ff88' : '2px solid rgba(255,255,255,0.18)',
              borderRadius: '6px',
              background: isSelected ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.65)',
              boxShadow: isSelected ? '0 0 14px rgba(0,255,136,0.7), 0 0 28px rgba(0,255,136,0.2)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.12s',
              padding: '4px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                background: HOTBAR_CSS_COLORS[bt],
                borderRadius: '3px',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: isSelected ? `0 0 10px ${HOTBAR_CSS_COLORS[bt]}` : 'none',
              }}
            />
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '6px',
              color: isSelected ? '#00ff88' : '#666',
              lineHeight: 1,
            }}>
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Crosshair ───────────────────────────────────────────────────────────────
function Crosshair() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 30,
      width: '22px',
      height: '22px',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.9)',
        transform: 'translateY(-50%)',
        boxShadow: '0 0 5px rgba(0,255,136,0.9)',
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '2px',
        background: 'rgba(255,255,255,0.9)',
        transform: 'translateX(-50%)',
        boxShadow: '0 0 5px rgba(0,255,136,0.9)',
      }} />
    </div>
  );
}

// ─── Inventory Panel ─────────────────────────────────────────────────────────
interface InventoryPanelProps {
  inventory: InventoryItem[];
  onConsume: (itemId: string) => void;
}

function InventoryPanel({ inventory, onConsume }: InventoryPanelProps) {
  if (inventory.length === 0) {
    return (
      <div style={{ color: '#555', fontFamily: '"Press Start 2P", monospace', fontSize: '8px', textAlign: 'center', padding: '16px' }}>
        No items yet.<br />Mine wood & stone to start!
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {inventory.map(item => (
        <div
          key={item.id}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: '60px',
          }}
        >
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ccc' }}>{item.name}</span>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#00ff88' }}>×{item.count}</span>
          {item.isFood && (
            <button
              onClick={() => onConsume(item.id)}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '6px',
                color: '#ff9900',
                background: 'rgba(255,153,0,0.15)',
                border: '1px solid #ff9900',
                borderRadius: '3px',
                padding: '2px 4px',
                cursor: 'pointer',
              }}
            >
              EAT
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Crafting Panel ──────────────────────────────────────────────────────────
interface CraftingPanelProps {
  inventory: InventoryItem[];
  recipes: CraftingRecipe[];
  onCraft: (recipeId: string) => void;
  onConsume: (itemId: string) => void;
  onClose: () => void;
}

function CraftingPanel({ inventory, recipes, onCraft, onConsume, onClose }: CraftingPanelProps) {
  const [tab, setTab] = useState<'craft' | 'inventory'>('craft');

  const getCount = (itemId: string) => inventory.find(i => i.id === itemId)?.count ?? 0;
  const canCraft = (recipe: CraftingRecipe) =>
    recipe.ingredients.every(ing => getCount(ing.itemId) >= ing.count);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        pointerEvents: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'rgba(0,8,18,0.97)',
          border: '2px solid #00ff88',
          borderRadius: '12px',
          padding: '24px',
          width: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 0 40px rgba(0,255,136,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#00ff88', textShadow: '0 0 12px rgba(0,255,136,0.8)' }}>
            ⚒ CRAFTING
          </span>
          <button
            onClick={onClose}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '10px',
              color: '#ff4444',
              background: 'rgba(255,68,68,0.1)',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['craft', 'inventory'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: tab === t ? '#00ff88' : '#555',
                background: tab === t ? 'rgba(0,255,136,0.1)' : 'transparent',
                border: `1px solid ${tab === t ? '#00ff88' : '#333'}`,
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {t === 'craft' ? '⚒ Craft' : '🎒 Inventory'}
            </button>
          ))}
        </div>

        {tab === 'craft' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipes.map(recipe => {
              const craftable = canCraft(recipe);
              return (
                <div
                  key={recipe.id}
                  style={{
                    background: craftable ? 'rgba(0,255,136,0.05)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${craftable ? '#00ff8844' : '#333'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: craftable ? '#00ff88' : '#888', marginBottom: '6px' }}>
                      {recipe.name}
                    </div>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#555', marginBottom: '6px' }}>
                      {recipe.description}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {recipe.ingredients.map(ing => {
                        const have = getCount(ing.itemId);
                        const enough = have >= ing.count;
                        return (
                          <span
                            key={ing.itemId}
                            style={{
                              fontFamily: '"Press Start 2P", monospace',
                              fontSize: '7px',
                              color: enough ? '#00ffcc' : '#ff4444',
                              background: 'rgba(0,0,0,0.4)',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              border: `1px solid ${enough ? '#00ffcc33' : '#ff444433'}`,
                            }}
                          >
                            {ing.itemId} {have}/{ing.count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => craftable && onCraft(recipe.id)}
                    disabled={!craftable}
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '8px',
                      color: craftable ? '#000' : '#444',
                      background: craftable ? '#00ff88' : '#222',
                      border: `1px solid ${craftable ? '#00ff88' : '#333'}`,
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: craftable ? 'pointer' : 'not-allowed',
                      boxShadow: craftable ? '0 0 12px rgba(0,255,136,0.5)' : 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    CRAFT
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'inventory' && (
          <InventoryPanel inventory={inventory} onConsume={onConsume} />
        )}

        <div style={{ marginTop: '16px', fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#333', textAlign: 'center' }}>
          Press E or ESC to close
        </div>
      </div>
    </div>
  );
}

// ─── Death Screen ─────────────────────────────────────────────────────────────
interface DeathScreenProps {
  onRespawn: () => void;
}

function DeathScreen({ onRespawn }: DeathScreenProps) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(80,0,0,0.85)',
      zIndex: 60,
      pointerEvents: 'auto',
    }}>
      <div style={{
        border: '2px solid #ff4444',
        borderRadius: '12px',
        padding: '40px 60px',
        background: 'rgba(0,0,0,0.9)',
        boxShadow: '0 0 60px rgba(255,68,68,0.5)',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '28px', color: '#ff4444', textShadow: '0 0 30px rgba(255,68,68,1)', marginBottom: '12px' }}>
          YOU DIED
        </div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#888', marginBottom: '32px' }}>
          All items lost. Start fresh.
        </div>
        <button
          onClick={onRespawn}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#000',
            background: '#ff4444',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 28px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255,68,68,0.7)',
          }}
        >
          ▶ RESPAWN
        </button>
      </div>
    </div>
  );
}

// ─── Pointer Lock Overlay ────────────────────────────────────────────────────
interface LockOverlayProps {
  onClickPlay: () => void;
}

function LockOverlay({ onClickPlay }: LockOverlayProps) {
  return (
    <div
      onClick={onClickPlay}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.78)',
        zIndex: 40,
        cursor: 'pointer',
      }}
    >
      <div style={{
        border: '2px solid #00ff88',
        borderRadius: '12px',
        padding: '28px 40px',
        background: 'rgba(0,8,18,0.92)',
        boxShadow: '0 0 40px rgba(0,255,136,0.35)',
        textAlign: 'center',
        maxWidth: '460px',
      }}>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '18px', color: '#00ff88', textShadow: '0 0 20px rgba(0,255,136,1)', marginBottom: '6px', letterSpacing: '2px' }}>
          MINECRAFT 3D
        </div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#555', marginBottom: '20px' }}>
          Survival Mode — No starting items!
        </div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#ffffff', marginBottom: '24px', textShadow: '0 0 8px rgba(255,255,255,0.5)' }}>
          ▶ CLICK TO PLAY
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 24px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          textAlign: 'left',
          marginBottom: '20px',
        }}>
          {[
            ['WASD',    'Move',           '#00ffff'],
            ['SHIFT',   'Sprint',         '#00ffff'],
            ['MOUSE',   'Look around',    '#00ffff'],
            ['SPACE',   'Jump',           '#00ffff'],
            ['LMB',     'Mine/Attack',    '#ff6b6b'],
            ['RMB',     'Place block',    '#ffd93d'],
            ['1–7',     'Select block',   '#00ffff'],
            ['E',       'Crafting menu',  '#00ff88'],
            ['ESC',     'Pause',          '#888'],
          ].map(([key, desc, col]) => (
            <>
              <span key={`k-${key}`} style={{ color: col }}>{key}</span>
              <span key={`d-${key}`} style={{ color: '#888' }}>{desc}</span>
            </>
          ))}
        </div>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ff9900', textAlign: 'center' }}>
          ⚠ Mine wood → craft tools → survive mobs!
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MinecraftClassicGame() {
  const navigate = useNavigate();
  const {
    worldRef,
    worldVersion,
    playerRef,
    selectedSlot,
    setSelectedSlot,
    targetBlock,
    pressKey,
    releaseKey,
    addMouseDelta,
    mineBlock,
    placeBlock,
    attackMob,
    update,
    health,
    hunger,
    stamina,
    xp,
    xpToNextLevel,
    level,
    isDead,
    respawn,
    mobs,
    arrows,
    inventory,
    craftingRecipes,
    craftItem,
    consumeFood,
  } = useMinecraftClassic3DGame();

  const [isLocked, setIsLocked]         = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const containerRef                    = useRef<HTMLDivElement>(null);

  const selectedSlotRef = useRef(selectedSlot);
  selectedSlotRef.current = selectedSlot;

  const handleLockChange = useCallback((locked: boolean) => {
    setIsLocked(locked);
  }, []);

  // Hotbar keyboard shortcuts + E for crafting
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        setCraftingOpen(prev => !prev);
        return;
      }
      if (e.key === 'Escape' && craftingOpen) {
        setCraftingOpen(false);
        return;
      }
      if (craftingOpen) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) setSelectedSlot(num - 1);
      if (e.key === ']') setSelectedSlot(s => Math.min(6, s + 1));
      if (e.key === '[') setSelectedSlot(s => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSelectedSlot, craftingOpen]);

  // Scroll wheel for hotbar
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isLocked && !craftingOpen) {
        if (e.deltaY > 0) setSelectedSlot(s => (s + 1) % 7);
        else              setSelectedSlot(s => (s + 6) % 7);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [isLocked, setSelectedSlot, craftingOpen]);

  const handleClickPlay = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) canvas.click();
  }, []);

  const handleCraft = useCallback((recipeId: string) => {
    craftItem(recipeId);
  }, [craftItem]);

  const handleConsume = useCallback((itemId: string) => {
    consumeFood(itemId);
  }, [consumeFood]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-neon-green/20 bg-arcade-card flex-shrink-0">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-arcade-muted hover:text-neon-green transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="font-pixel text-neon-green text-sm"
          style={{ textShadow: '0 0 10px rgba(0,255,136,0.8)' }}
        >
          MINECRAFT 3D — SURVIVAL
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-pixel text-xs" style={{ color: '#ff4444' }}>❤️ {health}/20</span>
          <span className="font-pixel text-xs" style={{ color: '#ff9900' }}>🍖 {hunger}/20</span>
          <span className="font-pixel text-xs" style={{ color: '#ffd700' }}>⭐ Lv{level}</span>
          <button
            onClick={() => setCraftingOpen(o => !o)}
            className="font-pixel text-xs px-3 py-1 rounded"
            style={{
              background: craftingOpen ? 'rgba(0,255,136,0.2)' : 'rgba(0,0,0,0.5)',
              border: '1px solid #00ff88',
              color: '#00ff88',
              cursor: 'pointer',
            }}
          >
            ⚒ CRAFT [E]
          </button>
        </div>
      </div>

      {/* Game area */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <Canvas
          shadows
          gl={{ antialias: true }}
          style={{ background: '#050d1a' }}
        >
          <SceneLighting />
          <VoxelWorld
            worldRef={worldRef}
            worldVersion={worldVersion}
            targetBlock={targetBlock}
          />
          <MobMeshes mobs={mobs} arrows={arrows} />
          <FPController
            playerRef={playerRef}
            update={update}
            pressKey={pressKey}
            releaseKey={releaseKey}
            addMouseDelta={addMouseDelta}
            mineBlock={mineBlock}
            placeBlock={placeBlock}
            attackMob={attackMob}
            selectedSlotRef={selectedSlotRef}
            onLockChange={handleLockChange}
            craftingOpen={craftingOpen}
          />
        </Canvas>

        {/* HUD overlays */}
        {isLocked && !isDead && (
          <>
            <Crosshair />
            <SurvivalHUD
              health={health}
              hunger={hunger}
              stamina={stamina}
              xp={xp}
              xpToNextLevel={xpToNextLevel}
              level={level}
            />
            <HotbarHUD selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
          </>
        )}

        {/* Crafting panel */}
        {craftingOpen && !isDead && (
          <CraftingPanel
            inventory={inventory}
            recipes={craftingRecipes}
            onCraft={handleCraft}
            onConsume={handleConsume}
            onClose={() => setCraftingOpen(false)}
          />
        )}

        {/* Death screen */}
        {isDead && <DeathScreen onRespawn={respawn} />}

        {/* Pointer lock overlay */}
        {!isLocked && !isDead && !craftingOpen && (
          <LockOverlay onClickPlay={handleClickPlay} />
        )}
      </div>
    </div>
  );
}
