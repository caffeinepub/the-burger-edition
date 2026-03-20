import { useState, useEffect, useRef, useCallback } from 'react';

// ─── World Constants (exported for terrain/carrier components) ────────────────
export const WORLD_SIZE = 5000;
export const RUNWAY_X = 0;
export const RUNWAY_Z = 0;
export const RUNWAY_LENGTH = 400;
export const RUNWAY_WIDTH = 30;
export const CARRIER_X = 150;
export const CARRIER_Z = 150;
export const CARRIER_LENGTH = 80;
export const CARRIER_WIDTH = 20;
export const CARRIER_DECK_Y = 2;

// ─── Terrain height function (exported for terrain component) ─────────────────
export function getTerrainHeight(x: number, z: number): number {
  const dxRunway = x - RUNWAY_X;
  const dzRunway = z - RUNWAY_Z;
  if (Math.abs(dxRunway) < RUNWAY_WIDTH / 2 + 5 && Math.abs(dzRunway) < RUNWAY_LENGTH / 2 + 5) {
    return 0;
  }
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter > 1800) return -50;
  const h1 = Math.sin(x * 0.003) * Math.cos(z * 0.004) * 80;
  const h2 = Math.sin(x * 0.007 + 1.2) * Math.sin(z * 0.006 + 0.8) * 40;
  const h3 = Math.cos(x * 0.012 + 2.1) * Math.cos(z * 0.011 + 1.5) * 20;
  const base = h1 + h2 + h3;
  const landFade = Math.max(0, Math.min(1, (1800 - distFromCenter) / 300));
  return Math.max(-50, base * landFade);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnemyType = 'ground' | 'airPatrol' | 'fastJet' | 'armoredEnemy' | 'missileDrone' | 'groundTurret';
export type GameMode = 'tutorial' | 'level' | 'freeplay';

export interface Enemy {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  type: EnemyType;
  destroyed: boolean;
  health: number;
  maxHealth: number;
  speed: number;
  patrolAngle?: number;
  lastMissileTime?: number;
  lastTurretFireTime?: number;
  coinReward: number;
  scoreReward: number;
}

export interface Missile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  isHoming: boolean;
  isEnemy: boolean;
  firedAt: number;
  attracted: boolean;
}

export interface Flare {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  firedAt: number;
  lifetime: number;
}

export interface WeaponState {
  missiles: Missile[];
  flares: Flare[];
  missileAmmo: number;
  flareCount: number;
  targetLockActive: boolean;
  lockedTargetId: string | null;
  lockProgress: number;
  coins: number;
  shopOpen: boolean;
  maxFuel: number;
  engineSpeedMultiplier: number;
}

export interface TutorialStep {
  id: number;
  prompt: string;
  mechanic: string;
  completed: boolean;
}

export interface LevelObjective {
  type: 'survive' | 'destroy' | 'score' | 'protect';
  target: number;
  current: number;
  label: string;
}

export interface LevelDefinition {
  id: number;
  name: string;
  difficulty: number;
  description: string;
  objectives: Omit<LevelObjective, 'current'>[];
  enemyConfig: {
    count: number;
    types: EnemyType[];
    speedMultiplier: number;
    missileFrequency: number;
  };
  protectObjectiveHP?: number;
  timeLimit?: number;
}

export interface LevelProgress {
  objectives: LevelObjective[];
  protectHP: number;
  maxProtectHP: number;
  timeRemaining: number;
  coinsEarnedThisLevel: number;
  scoreAtLevelStart: number;
}

// ─── Level Definitions ────────────────────────────────────────────────────────

const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    id: 1,
    name: 'First Contact',
    difficulty: 1,
    description: 'Survive your first engagement and take down enemy fighters.',
    objectives: [
      { type: 'survive', target: 60, label: 'Survive 60 seconds' },
      { type: 'destroy', target: 5, label: 'Destroy 5 enemies' },
    ],
    enemyConfig: { count: 5, types: ['ground', 'airPatrol'], speedMultiplier: 1.0, missileFrequency: 15 },
    timeLimit: 120,
  },
  {
    id: 2,
    name: 'Carrier Defense',
    difficulty: 2,
    description: 'Protect the carrier from enemy attack while scoring big.',
    objectives: [
      { type: 'protect', target: 100, label: 'Protect the carrier' },
      { type: 'score', target: 500, label: 'Reach 500 points' },
    ],
    enemyConfig: { count: 7, types: ['ground', 'airPatrol', 'fastJet'], speedMultiplier: 1.2, missileFrequency: 12 },
    protectObjectiveHP: 100,
    timeLimit: 150,
  },
  {
    id: 3,
    name: 'Drone Swarm',
    difficulty: 2,
    description: 'Missile drones are swarming. Use your flares wisely.',
    objectives: [
      { type: 'destroy', target: 10, label: 'Destroy 10 drones' },
      { type: 'survive', target: 90, label: 'Survive 90 seconds' },
    ],
    enemyConfig: { count: 10, types: ['missileDrone', 'airPatrol'], speedMultiplier: 1.1, missileFrequency: 8 },
    timeLimit: 180,
  },
  {
    id: 4,
    name: 'Iron Fortress',
    difficulty: 3,
    description: 'Armored enemies and ground turrets defend the fortress.',
    objectives: [
      { type: 'destroy', target: 8, label: 'Destroy 8 armored enemies' },
      { type: 'score', target: 1000, label: 'Reach 1000 points' },
      { type: 'survive', target: 120, label: 'Survive 120 seconds' },
    ],
    enemyConfig: { count: 8, types: ['armoredEnemy', 'groundTurret', 'ground'], speedMultiplier: 1.0, missileFrequency: 10 },
    timeLimit: 240,
  },
  {
    id: 5,
    name: 'Speed Demons',
    difficulty: 4,
    description: 'Fast jets and missile drones — protect the carrier at all costs.',
    objectives: [
      { type: 'protect', target: 100, label: 'Protect the carrier' },
      { type: 'destroy', target: 15, label: 'Destroy 15 enemies' },
      { type: 'score', target: 2000, label: 'Reach 2000 points' },
    ],
    enemyConfig: { count: 15, types: ['fastJet', 'missileDrone', 'airPatrol'], speedMultiplier: 1.5, missileFrequency: 6 },
    protectObjectiveHP: 100,
    timeLimit: 300,
  },
  {
    id: 6,
    name: 'Armageddon',
    difficulty: 5,
    description: 'All enemy types. Maximum difficulty. Survive and dominate.',
    objectives: [
      { type: 'survive', target: 180, label: 'Survive 180 seconds' },
      { type: 'destroy', target: 20, label: 'Destroy 20 enemies' },
      { type: 'score', target: 5000, label: 'Reach 5000 points' },
      { type: 'protect', target: 100, label: 'Protect the carrier' },
    ],
    enemyConfig: {
      count: 20,
      types: ['fastJet', 'armoredEnemy', 'missileDrone', 'groundTurret', 'airPatrol'],
      speedMultiplier: 1.8,
      missileFrequency: 4,
    },
    protectObjectiveHP: 100,
    timeLimit: 360,
  },
];

// ─── Tutorial Steps ───────────────────────────────────────────────────────────

const TUTORIAL_STEPS_DATA: Omit<TutorialStep, 'completed'>[] = [
  { id: 0, prompt: 'STEP 1: MOVEMENT — Use W/S to pitch up/down and A/D to roll left/right. Move your aircraft now!', mechanic: 'movement' },
  { id: 1, prompt: 'STEP 2: THROTTLE — Press SHIFT to increase throttle and CTRL to decrease it. Adjust your throttle!', mechanic: 'throttle' },
  { id: 2, prompt: 'STEP 3: SHOOTING — Press SPACE or F to fire a missile at an enemy. Shoot now!', mechanic: 'shoot' },
  { id: 3, prompt: 'STEP 4: LOCK-ON — Press T to toggle target lock mode. Lock onto an enemy target!', mechanic: 'lockOn' },
  { id: 4, prompt: 'STEP 5: DODGE — An enemy missile is incoming! Perform evasive maneuvers (roll + pitch) to dodge it!', mechanic: 'dodge' },
  { id: 5, prompt: 'STEP 6: FLARES — Press C to deploy flares and decoy incoming missiles. Deploy a flare now!', mechanic: 'flare' },
  { id: 6, prompt: 'TUTORIAL COMPLETE! You are ready for combat. Proceeding to Level 1...', mechanic: 'complete' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getEnemyDefaults(type: EnemyType, speedMultiplier = 1.0): Partial<Enemy> {
  switch (type) {
    case 'fastJet':
      return { health: 1, maxHealth: 1, speed: 0.18 * speedMultiplier, coinReward: 15, scoreReward: 150 };
    case 'armoredEnemy':
      return { health: 3, maxHealth: 3, speed: 0.06 * speedMultiplier, coinReward: 25, scoreReward: 250 };
    case 'missileDrone':
      return { health: 1, maxHealth: 1, speed: 0.09 * speedMultiplier, coinReward: 20, scoreReward: 200, lastMissileTime: 0 };
    case 'groundTurret':
      return { health: 2, maxHealth: 2, speed: 0, coinReward: 30, scoreReward: 300, lastTurretFireTime: 0 };
    case 'airPatrol':
      return { health: 1, maxHealth: 1, speed: 0.1 * speedMultiplier, coinReward: 10, scoreReward: 100 };
    case 'ground':
    default:
      return { health: 1, maxHealth: 1, speed: 0, coinReward: 5, scoreReward: 50 };
  }
}

function spawnEnemiesForLevel(levelDef: LevelDefinition): Enemy[] {
  const enemies: Enemy[] = [];
  const types = levelDef.enemyConfig.types;
  const count = levelDef.enemyConfig.count;
  const sm = levelDef.enemyConfig.speedMultiplier;

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const defaults = getEnemyDefaults(type, sm);
    const angle = (i / count) * Math.PI * 2;
    const radius = 80 + Math.random() * 60;

    let position: [number, number, number];
    if (type === 'groundTurret' || type === 'ground') {
      position = [Math.cos(angle) * radius, 2, Math.sin(angle) * radius];
    } else {
      position = [Math.cos(angle) * radius, 20 + Math.random() * 30, Math.sin(angle) * radius];
    }

    enemies.push({
      id: genId('enemy'),
      position,
      rotation: [0, angle, 0],
      type,
      destroyed: false,
      health: defaults.health ?? 1,
      maxHealth: defaults.maxHealth ?? 1,
      speed: defaults.speed ?? 0.1,
      patrolAngle: angle,
      lastMissileTime: defaults.lastMissileTime ?? 0,
      lastTurretFireTime: defaults.lastTurretFireTime ?? 0,
      coinReward: defaults.coinReward ?? 10,
      scoreReward: defaults.scoreReward ?? 100,
    });
  }
  return enemies;
}

function spawnFreeplayEnemies(): Enemy[] {
  const enemies: Enemy[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    enemies.push({
      id: genId('enemy'),
      position: [Math.cos(angle) * 100, 2, Math.sin(angle) * 100],
      rotation: [0, angle, 0],
      type: 'ground',
      destroyed: false,
      health: 1, maxHealth: 1, speed: 0,
      patrolAngle: angle,
      lastMissileTime: 0, lastTurretFireTime: 0,
      coinReward: 5, scoreReward: 50,
    });
  }
  for (let i = 0; i < 2; i++) {
    const angle = (i / 2) * Math.PI * 2;
    enemies.push({
      id: genId('enemy'),
      position: [Math.cos(angle) * 80, 25, Math.sin(angle) * 80],
      rotation: [0, angle, 0],
      type: 'airPatrol',
      destroyed: false,
      health: 1, maxHealth: 1, speed: 0.1,
      patrolAngle: angle,
      lastMissileTime: 0, lastTurretFireTime: 0,
      coinReward: 10, scoreReward: 100,
    });
  }
  return enemies;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useF19FlightSimulatorGame() {
  // ── Aircraft state ──
  const [position, setPosition] = useState<[number, number, number]>([0, 5, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [throttle, setThrottle] = useState(0.5);
  const [fuel, setFuel] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [crashReason, setCrashReason] = useState('');
  const [score, setScore] = useState(0);

  // ── Weapon state ──
  const [weaponState, setWeaponState] = useState<WeaponState>({
    missiles: [],
    flares: [],
    missileAmmo: 8,
    flareCount: 4,
    targetLockActive: false,
    lockedTargetId: null,
    lockProgress: 0,
    coins: 0,
    shopOpen: false,
    maxFuel: 100,
    engineSpeedMultiplier: 1.0,
  });

  // ── Enemy state ──
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  // ── Mode / Tutorial / Level state ──
  const [gameMode, setGameMode] = useState<GameMode>('freeplay');
  const [modeSelectActive, setModeSelectActive] = useState(true);

  // Tutorial
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>(
    TUTORIAL_STEPS_DATA.map(s => ({ ...s, completed: false }))
  );
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    try { return localStorage.getItem('f19_tutorialCompleted') === 'true'; } catch { return false; }
  });

  // Level
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelUnlockStatus, setLevelUnlockStatus] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem('f19_levelUnlocks');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [true, false, false, false, false, false];
  });
  const [levelBestScores, setLevelBestScores] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('f19_levelBestScores');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {};
  });
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [levelStartActive, setLevelStartActive] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelFailed, setLevelFailed] = useState(false);
  const [levelFailReason, setLevelFailReason] = useState('');

  // ── Refs for game loop ──
  const posRef = useRef<[number, number, number]>([0, 5, 0]);
  const rotRef = useRef<[number, number, number]>([0, 0, 0]);
  const throttleRef = useRef(0.5);
  const fuelRef = useRef(100);
  const isGameOverRef = useRef(false);
  const weaponRef = useRef(weaponState);
  const enemiesRef = useRef(enemies);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef(0);
  const lastMissileFiredRef = useRef(0);
  const lastFlareFiredRef = useRef(0);
  const tutorialStepRef = useRef(0);
  const tutorialActiveRef = useRef(false);
  const gameModeRef = useRef<GameMode>('freeplay');
  const levelProgressRef = useRef<LevelProgress | null>(null);
  const levelCompleteRef = useRef(false);
  const levelFailedRef = useRef(false);
  const modeSelectActiveRef = useRef(true);
  const levelStartActiveRef = useRef(false);
  const currentLevelIndexRef = useRef(0);

  // Tutorial action tracking refs
  const tutorialMovedRef = useRef(false);
  const tutorialThrottledRef = useRef(false);
  const tutorialShotRef = useRef(false);
  const tutorialLockedRef = useRef(false);
  const tutorialDodgedRef = useRef(false);
  const tutorialFlaredRef = useRef(false);
  const tutorialEnemyMissileSpawnedRef = useRef(false);

  // Sync refs with state
  useEffect(() => { weaponRef.current = weaponState; }, [weaponState]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { tutorialStepRef.current = tutorialStep; }, [tutorialStep]);
  useEffect(() => { tutorialActiveRef.current = tutorialActive; }, [tutorialActive]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { levelProgressRef.current = levelProgress; }, [levelProgress]);
  useEffect(() => { levelCompleteRef.current = levelComplete; }, [levelComplete]);
  useEffect(() => { levelFailedRef.current = levelFailed; }, [levelFailed]);
  useEffect(() => { modeSelectActiveRef.current = modeSelectActive; }, [modeSelectActive]);
  useEffect(() => { levelStartActiveRef.current = levelStartActive; }, [levelStartActive]);
  useEffect(() => { currentLevelIndexRef.current = currentLevelIndex; }, [currentLevelIndex]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

  // ── Persist unlock/scores ──
  useEffect(() => {
    try { localStorage.setItem('f19_levelUnlocks', JSON.stringify(levelUnlockStatus)); } catch { /* ignore */ }
  }, [levelUnlockStatus]);

  useEffect(() => {
    try { localStorage.setItem('f19_levelBestScores', JSON.stringify(levelBestScores)); } catch { /* ignore */ }
  }, [levelBestScores]);

  // ── Keyboard ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (modeSelectActiveRef.current) return;
      if (levelStartActiveRef.current) return;

      if (e.code === 'KeyT') {
        setWeaponState(prev => {
          const newActive = !prev.targetLockActive;
          return {
            ...prev,
            targetLockActive: newActive,
            lockedTargetId: newActive ? prev.lockedTargetId : null,
            lockProgress: newActive ? prev.lockProgress : 0,
          };
        });
        if (tutorialActiveRef.current && tutorialStepRef.current === 3) {
          tutorialLockedRef.current = true;
        }
      }

      if (e.code === 'KeyC') {
        deployFlare();
      }

      if (e.code === 'Space' || e.code === 'KeyF') {
        e.preventDefault();
        fireMissile();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fire missile ──
  const fireMissile = useCallback(() => {
    const now = Date.now();
    if (now - lastMissileFiredRef.current < 500) return;
    const ws = weaponRef.current;
    if (ws.missileAmmo <= 0) return;
    lastMissileFiredRef.current = now;

    const pos = posRef.current;
    const rot = rotRef.current;
    const spd = 0.8;
    const vx = -Math.sin(rot[1]) * Math.cos(rot[0]) * spd;
    const vy = Math.sin(rot[0]) * spd;
    const vz = -Math.cos(rot[1]) * Math.cos(rot[0]) * spd;

    const newMissile: Missile = {
      id: genId('missile'),
      position: [pos[0], pos[1], pos[2]],
      velocity: [vx, vy, vz],
      isHoming: ws.targetLockActive && ws.lockedTargetId !== null,
      isEnemy: false,
      firedAt: now,
      attracted: false,
    };

    setWeaponState(prev => ({
      ...prev,
      missiles: [...prev.missiles, newMissile],
      missileAmmo: prev.missileAmmo - 1,
    }));

    if (tutorialActiveRef.current && tutorialStepRef.current === 2) {
      tutorialShotRef.current = true;
    }
  }, []);

  // ── Deploy flare ──
  const deployFlare = useCallback(() => {
    const now = Date.now();
    if (now - lastFlareFiredRef.current < 300) return;
    const ws = weaponRef.current;
    if (ws.flareCount <= 0) return;
    lastFlareFiredRef.current = now;

    const pos = posRef.current;
    const rot = rotRef.current;

    const newFlare: Flare = {
      id: genId('flare'),
      position: [pos[0], pos[1], pos[2]],
      velocity: [
        Math.sin(rot[1]) * 0.3 + (Math.random() - 0.5) * 0.2,
        -0.1,
        Math.cos(rot[1]) * 0.3 + (Math.random() - 0.5) * 0.2,
      ],
      firedAt: now,
      lifetime: 4000,
    };

    setWeaponState(prev => ({
      ...prev,
      flares: [...prev.flares, newFlare],
      flareCount: prev.flareCount - 1,
    }));

    if (tutorialActiveRef.current && tutorialStepRef.current === 5) {
      tutorialFlaredRef.current = true;
    }
  }, []);

  // ── Tutorial step advancement ──
  const advanceTutorialStep = useCallback(() => {
    setTutorialStep(prev => {
      const next = prev + 1;
      setTutorialSteps(steps => steps.map(s => s.id === prev ? { ...s, completed: true } : s));
      if (next >= TUTORIAL_STEPS_DATA.length) {
        setTutorialActive(false);
        setTutorialCompleted(true);
        try { localStorage.setItem('f19_tutorialCompleted', 'true'); } catch { /* ignore */ }
        setTimeout(() => {
          startLevelInternal(0);
        }, 2000);
        return prev;
      }
      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset aircraft ──
  const resetAircraft = useCallback(() => {
    posRef.current = [0, 5, 0];
    rotRef.current = [0, 0, 0];
    throttleRef.current = 0.5;
    fuelRef.current = 100;
    isGameOverRef.current = false;
    scoreRef.current = 0;
    setPosition([0, 5, 0]);
    setRotation([0, 0, 0]);
    setThrottle(0.5);
    setFuel(100);
    setSpeed(0);
    setAltitude(5);
    setIsGameOver(false);
    setCrashReason('');
    setScore(0);
    setWeaponState(prev => ({
      ...prev,
      missiles: [],
      flares: [],
      missileAmmo: 8,
      flareCount: 4,
      targetLockActive: false,
      lockedTargetId: null,
      lockProgress: 0,
      shopOpen: false,
    }));
  }, []);

  // ── Internal start level ──
  const startLevelInternal = useCallback((levelIndex: number) => {
    const levelDef = LEVEL_DEFINITIONS[levelIndex];
    if (!levelDef) return;

    currentLevelIndexRef.current = levelIndex;
    setCurrentLevelIndex(levelIndex);
    setGameMode('level');
    gameModeRef.current = 'level';
    setModeSelectActive(false);
    modeSelectActiveRef.current = false;
    setLevelComplete(false);
    levelCompleteRef.current = false;
    setLevelFailed(false);
    levelFailedRef.current = false;
    setLevelStartActive(true);
    levelStartActiveRef.current = true;

    const spawnedEnemies = spawnEnemiesForLevel(levelDef);
    setEnemies(spawnedEnemies);
    enemiesRef.current = spawnedEnemies;

    const objectives: LevelObjective[] = levelDef.objectives.map(obj => ({
      ...obj,
      current: 0,
    }));

    const progress: LevelProgress = {
      objectives,
      protectHP: levelDef.protectObjectiveHP ?? 0,
      maxProtectHP: levelDef.protectObjectiveHP ?? 0,
      timeRemaining: levelDef.timeLimit ?? 999,
      coinsEarnedThisLevel: 0,
      scoreAtLevelStart: scoreRef.current,
    };
    levelProgressRef.current = progress;
    setLevelProgress(progress);

    resetAircraft();
  }, [resetAircraft]);

  // ── Mode selection handlers ──
  const selectTutorial = useCallback(() => {
    setGameMode('tutorial');
    gameModeRef.current = 'tutorial';
    setModeSelectActive(false);
    modeSelectActiveRef.current = false;
    setTutorialActive(true);
    tutorialActiveRef.current = true;
    setTutorialStep(0);
    tutorialStepRef.current = 0;
    setTutorialSteps(TUTORIAL_STEPS_DATA.map(s => ({ ...s, completed: false })));
    tutorialMovedRef.current = false;
    tutorialThrottledRef.current = false;
    tutorialShotRef.current = false;
    tutorialLockedRef.current = false;
    tutorialDodgedRef.current = false;
    tutorialFlaredRef.current = false;
    tutorialEnemyMissileSpawnedRef.current = false;
    const freeplayEnemies = spawnFreeplayEnemies();
    setEnemies(freeplayEnemies);
    enemiesRef.current = freeplayEnemies;
    resetAircraft();
  }, [resetAircraft]);

  const selectFreeplay = useCallback(() => {
    setGameMode('freeplay');
    gameModeRef.current = 'freeplay';
    setModeSelectActive(false);
    modeSelectActiveRef.current = false;
    const freeplayEnemies = spawnFreeplayEnemies();
    setEnemies(freeplayEnemies);
    enemiesRef.current = freeplayEnemies;
    resetAircraft();
  }, [resetAircraft]);

  const selectLevel = useCallback((levelIndex: number) => {
    startLevelInternal(levelIndex);
  }, [startLevelInternal]);

  const beginLevel = useCallback(() => {
    setLevelStartActive(false);
    levelStartActiveRef.current = false;
  }, []);

  const retryLevel = useCallback(() => {
    setLevelFailed(false);
    levelFailedRef.current = false;
    setIsGameOver(false);
    isGameOverRef.current = false;
    startLevelInternal(currentLevelIndexRef.current);
  }, [startLevelInternal]);

  const nextLevel = useCallback(() => {
    const next = currentLevelIndexRef.current + 1;
    if (next < LEVEL_DEFINITIONS.length) {
      startLevelInternal(next);
    } else {
      setModeSelectActive(true);
      modeSelectActiveRef.current = true;
      setLevelComplete(false);
      levelCompleteRef.current = false;
    }
  }, [startLevelInternal]);

  const exitToModeSelect = useCallback(() => {
    setModeSelectActive(true);
    modeSelectActiveRef.current = true;
    setTutorialActive(false);
    tutorialActiveRef.current = false;
    setLevelComplete(false);
    levelCompleteRef.current = false;
    setLevelFailed(false);
    levelFailedRef.current = false;
    setLevelStartActive(false);
    levelStartActiveRef.current = false;
    setIsGameOver(false);
    isGameOverRef.current = false;
  }, []);

  const skipTutorial = useCallback(() => {
    setTutorialActive(false);
    tutorialActiveRef.current = false;
    setModeSelectActive(true);
    modeSelectActiveRef.current = true;
  }, []);

  // ── Shop handlers ──
  const openShop = useCallback(() => {
    setWeaponState(prev => ({ ...prev, shopOpen: true }));
  }, []);

  const closeShop = useCallback(() => {
    setWeaponState(prev => ({ ...prev, shopOpen: false }));
  }, []);

  const purchaseItem = useCallback((itemId: string, cost: number) => {
    setWeaponState(prev => {
      if (prev.coins < cost) return prev;
      const newCoins = prev.coins - cost;
      switch (itemId) {
        case 'missile_refill': return { ...prev, coins: newCoins, missileAmmo: Math.min(prev.missileAmmo + 8, 16) };
        case 'flare_refill': return { ...prev, coins: newCoins, flareCount: Math.min(prev.flareCount + 4, 8) };
        case 'fuel_refill': {
          fuelRef.current = Math.min(fuelRef.current + 50, prev.maxFuel);
          setFuel(fuelRef.current);
          return { ...prev, coins: newCoins };
        }
        case 'fuel_tank': return { ...prev, coins: newCoins, maxFuel: Math.min(prev.maxFuel + 50, 200) };
        case 'engine_upgrade': return { ...prev, coins: newCoins, engineSpeedMultiplier: Math.min(prev.engineSpeedMultiplier + 0.2, 2.0) };
        default: return prev;
      }
    });
  }, []);

  // ── Trigger helpers ──
  const triggerGameOver = useCallback((reason: string) => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    setIsGameOver(true);
    setCrashReason(reason);
    if (gameModeRef.current === 'level') {
      levelFailedRef.current = true;
      setLevelFailed(true);
      setLevelFailReason(reason === 'MISSILE_HIT' ? 'Aircraft destroyed by missile' : 'Aircraft crashed');
    }
  }, []);

  const triggerLevelFailed = useCallback((reason: string) => {
    if (levelFailedRef.current) return;
    levelFailedRef.current = true;
    setLevelFailed(true);
    setLevelFailReason(reason);
  }, []);

  const triggerLevelComplete = useCallback((finalScore: number, coinsEarned: number) => {
    if (levelCompleteRef.current) return;
    levelCompleteRef.current = true;
    setLevelComplete(true);

    const idx = currentLevelIndexRef.current;
    setLevelBestScores(prev => {
      const current = prev[idx] ?? 0;
      if (finalScore > current) {
        const updated = { ...prev, [idx]: finalScore };
        try { localStorage.setItem('f19_levelBestScores', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      }
      return prev;
    });

    setLevelUnlockStatus(prev => {
      const next = idx + 1;
      if (next < LEVEL_DEFINITIONS.length && !prev[next]) {
        const updated = [...prev];
        updated[next] = true;
        try { localStorage.setItem('f19_levelUnlocks', JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      }
      return prev;
    });

    setWeaponState(prev => ({ ...prev, coins: prev.coins + coinsEarned }));
  }, []);

  // ── Main game loop ──
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const shouldUpdate =
        !isGameOverRef.current &&
        !modeSelectActiveRef.current &&
        !levelCompleteRef.current &&
        !levelFailedRef.current &&
        !levelStartActiveRef.current &&
        !weaponRef.current.shopOpen;

      if (shouldUpdate) {
        updateGame(dt);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      lastTimeRef.current = 0;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGame = useCallback((dt: number) => {
    const keys = keysRef.current;
    const pos = posRef.current;
    const rot = rotRef.current;
    const thr = throttleRef.current;
    const currentFuel = fuelRef.current;
    const ws = weaponRef.current;
    const currentEnemies = enemiesRef.current;
    const isTutorial = tutorialActiveRef.current;
    const tutStep = tutorialStepRef.current;
    const gMode = gameModeRef.current;
    const lProgress = levelProgressRef.current;
    const now = Date.now();

    // ── Input ──
    let newRot: [number, number, number] = [rot[0], rot[1], rot[2]];
    let newThr = thr;
    const rollSpeed = 1.5 * dt;
    const pitchSpeed = 1.2 * dt;

    if (keys.has('KeyA')) newRot[2] += rollSpeed;
    if (keys.has('KeyD')) newRot[2] -= rollSpeed;
    if (keys.has('KeyW')) newRot[0] -= pitchSpeed;
    if (keys.has('KeyS')) newRot[0] += pitchSpeed;

    if (isTutorial && tutStep === 0) {
      if (keys.has('KeyA') || keys.has('KeyD') || keys.has('KeyW') || keys.has('KeyS')) {
        tutorialMovedRef.current = true;
      }
    }

    if (keys.has('ShiftLeft') || keys.has('ShiftRight')) {
      newThr = Math.min(1.0, thr + dt * 0.5);
      if (isTutorial && tutStep === 1) tutorialThrottledRef.current = true;
    }
    if (keys.has('ControlLeft') || keys.has('ControlRight')) {
      newThr = Math.max(0.0, thr - dt * 0.5);
      if (isTutorial && tutStep === 1) tutorialThrottledRef.current = true;
    }

    newRot[0] = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, newRot[0]));
    newRot[2] = newRot[2] * 0.95;
    newRot[1] += -newRot[2] * dt * 0.8;

    // ── Physics ──
    const baseSpeed = 15 * ws.engineSpeedMultiplier;
    const currentSpeed = baseSpeed * newThr;
    const fwdX = -Math.sin(newRot[1]) * Math.cos(newRot[0]);
    const fwdY = Math.sin(newRot[0]);
    const fwdZ = -Math.cos(newRot[1]) * Math.cos(newRot[0]);

    const newVelX = fwdX * currentSpeed;
    const newVelY = fwdY * currentSpeed - 2 * dt;
    const newVelZ = fwdZ * currentSpeed;

    const newPos: [number, number, number] = [
      pos[0] + newVelX * dt,
      pos[1] + newVelY * dt,
      pos[2] + newVelZ * dt,
    ];

    // ── Fuel ──
    const fuelDrain = newThr * 2 * dt;
    const newFuel = Math.max(0, currentFuel - fuelDrain);

    // ── Crash detection ──
    if (newPos[1] <= 0.5) {
      if (newPos[1] <= -2) {
        triggerGameOver('TERRAIN_IMPACT');
        return;
      }
      newPos[1] = 0.5;
    }

    posRef.current = newPos;
    rotRef.current = newRot;
    throttleRef.current = newThr;
    fuelRef.current = newFuel;

    setPosition([...newPos]);
    setRotation([...newRot]);
    setThrottle(newThr);
    setFuel(newFuel);
    setSpeed(Math.sqrt(newVelX ** 2 + newVelY ** 2 + newVelZ ** 2));
    setAltitude(newPos[1]);

    // ── Update missiles ──
    let updatedMissiles = ws.missiles
      .filter(m => now - m.firedAt < 8000)
      .map(m => {
        let vel: [number, number, number] = [m.velocity[0], m.velocity[1], m.velocity[2]];
        let mpos: [number, number, number] = [m.position[0], m.position[1], m.position[2]];

        if (m.isHoming && !m.isEnemy && ws.lockedTargetId) {
          const target = currentEnemies.find(e => e.id === ws.lockedTargetId && !e.destroyed);
          if (target) {
            const dx = target.position[0] - mpos[0];
            const dy = target.position[1] - mpos[1];
            const dz = target.position[2] - mpos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > 0.1) {
              const hs = 0.05;
              vel[0] += (dx / dist) * hs;
              vel[1] += (dy / dist) * hs;
              vel[2] += (dz / dist) * hs;
              const spd = Math.sqrt(vel[0] ** 2 + vel[1] ** 2 + vel[2] ** 2);
              const maxSpd = 1.2;
              if (spd > maxSpd) {
                vel[0] = (vel[0] / spd) * maxSpd;
                vel[1] = (vel[1] / spd) * maxSpd;
                vel[2] = (vel[2] / spd) * maxSpd;
              }
            }
          }
        }

        if (m.isEnemy && m.isHoming) {
          let attracted = false;
          for (const flare of ws.flares) {
            const dx = flare.position[0] - mpos[0];
            const dy = flare.position[1] - mpos[1];
            const dz = flare.position[2] - mpos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 30) {
              vel[0] += (dx / dist) * 0.08;
              vel[1] += (dy / dist) * 0.08;
              vel[2] += (dz / dist) * 0.08;
              attracted = true;
              break;
            }
          }
          if (!attracted) {
            const dx = newPos[0] - mpos[0];
            const dy = newPos[1] - mpos[1];
            const dz = newPos[2] - mpos[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > 0.1) {
              vel[0] += (dx / dist) * 0.04;
              vel[1] += (dy / dist) * 0.04;
              vel[2] += (dz / dist) * 0.04;
            }
          }
        }

        mpos[0] += vel[0];
        mpos[1] += vel[1];
        mpos[2] += vel[2];

        return { ...m, position: mpos, velocity: vel };
      });

    // ── Update flares ──
    const updatedFlares = ws.flares
      .filter(f => now - f.firedAt < f.lifetime)
      .map(f => {
        const np: [number, number, number] = [
          f.position[0] + f.velocity[0],
          f.position[1] + f.velocity[1],
          f.position[2] + f.velocity[2],
        ];
        return {
          ...f,
          position: np,
          velocity: [f.velocity[0] * 0.98, f.velocity[1] - 0.01, f.velocity[2] * 0.98] as [number, number, number],
        };
      });

    // ── Enemy updates + missile-enemy collision ──
    let newScore = scoreRef.current;
    let coinsEarned = 0;
    let destroyedCount = 0;

    const updatedEnemies = currentEnemies.map(enemy => {
      if (enemy.destroyed) return enemy;
      let newEnemy = { ...enemy };

      // Movement
      if (enemy.type === 'airPatrol' || enemy.type === 'fastJet') {
        const angle = (newEnemy.patrolAngle ?? 0) + enemy.speed * dt;
        const radius = 80;
        newEnemy.patrolAngle = angle;
        newEnemy.position = [Math.cos(angle) * radius, enemy.position[1], Math.sin(angle) * radius];
        newEnemy.rotation = [0, angle + Math.PI / 2, 0];
      } else if (enemy.type === 'missileDrone') {
        const angle = (newEnemy.patrolAngle ?? 0) + enemy.speed * dt;
        newEnemy.patrolAngle = angle;
        const radius = 60 + Math.sin(angle * 2) * 20;
        newEnemy.position = [Math.cos(angle) * radius, 15 + Math.sin(angle * 3) * 5, Math.sin(angle) * radius];
        newEnemy.rotation = [0, angle + Math.PI / 2, 0];

        const levelDef = gMode === 'level' ? LEVEL_DEFINITIONS[currentLevelIndexRef.current] : null;
        const missileFreqMs = levelDef ? levelDef.enemyConfig.missileFrequency * 1000 : 12000;
        if (now - (newEnemy.lastMissileTime ?? 0) > missileFreqMs) {
          newEnemy.lastMissileTime = now;
          const dx = newPos[0] - newEnemy.position[0];
          const dy = newPos[1] - newEnemy.position[1];
          const dz = newPos[2] - newEnemy.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 150 && dist > 0) {
            const spd = 0.5;
            const enemyMissile: Missile = {
              id: genId('missile'),
              position: [newEnemy.position[0], newEnemy.position[1], newEnemy.position[2]],
              velocity: [(dx / dist) * spd, (dy / dist) * spd, (dz / dist) * spd],
              isHoming: true,
              isEnemy: true,
              firedAt: now,
              attracted: false,
            };
            updatedMissiles = [...updatedMissiles, enemyMissile];
            if (isTutorial && tutStep === 4 && !tutorialEnemyMissileSpawnedRef.current) {
              tutorialEnemyMissileSpawnedRef.current = true;
            }
          }
        }
      } else if (enemy.type === 'groundTurret') {
        const dx = newPos[0] - enemy.position[0];
        const dy = newPos[1] - enemy.position[1];
        const dz = newPos[2] - enemy.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const levelDef = gMode === 'level' ? LEVEL_DEFINITIONS[currentLevelIndexRef.current] : null;
        const fireFreqMs = levelDef ? levelDef.enemyConfig.missileFrequency * 800 : 8000;
        if (dist < 120 && now - (newEnemy.lastTurretFireTime ?? 0) > fireFreqMs) {
          newEnemy.lastTurretFireTime = now;
          const spd = 0.4;
          const turretMissile: Missile = {
            id: genId('missile'),
            position: [newEnemy.position[0], newEnemy.position[1], newEnemy.position[2]],
            velocity: [(dx / dist) * spd, (dy / dist) * spd, (dz / dist) * spd],
            isHoming: false,
            isEnemy: true,
            firedAt: now,
            attracted: false,
          };
          updatedMissiles = [...updatedMissiles, turretMissile];
        }
      }

      // Check player missile hits
      for (const missile of updatedMissiles) {
        if (missile.isEnemy) continue;
        const dx = missile.position[0] - newEnemy.position[0];
        const dy = missile.position[1] - newEnemy.position[1];
        const dz = missile.position[2] - newEnemy.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 8) {
          newEnemy.health -= 1;
          if (newEnemy.health <= 0) {
            newEnemy.destroyed = true;
            newScore += newEnemy.scoreReward;
            coinsEarned += newEnemy.coinReward;
            destroyedCount++;
          }
          updatedMissiles = updatedMissiles.filter(m => m.id !== missile.id);
          break;
        }
      }

      return newEnemy;
    });

    // ── Enemy missile hits player ──
    let playerHit = false;
    const survivingMissiles = updatedMissiles.filter(m => {
      if (!m.isEnemy) return true;
      const dx = m.position[0] - newPos[0];
      const dy = m.position[1] - newPos[1];
      const dz = m.position[2] - newPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 5) { playerHit = true; return false; }
      return true;
    });

    if (playerHit) {
      triggerGameOver('MISSILE_HIT');
      return;
    }

    // Tutorial dodge detection
    if (isTutorial && tutStep === 4 && tutorialEnemyMissileSpawnedRef.current) {
      const enemyMissilesGone = survivingMissiles.filter(m => m.isEnemy).length === 0;
      if (enemyMissilesGone) tutorialDodgedRef.current = true;
    }

    // ── Score update ──
    if (newScore !== scoreRef.current) {
      scoreRef.current = newScore;
      setScore(newScore);
    }

    // ── Level progress update ──
    if (gMode === 'level' && lProgress && !levelCompleteRef.current && !levelFailedRef.current) {
      const levelDef = LEVEL_DEFINITIONS[currentLevelIndexRef.current];
      const newProgress: LevelProgress = {
        ...lProgress,
        objectives: lProgress.objectives.map(obj => {
          if (obj.type === 'destroy') return { ...obj, current: Math.min(obj.current + destroyedCount, obj.target) };
          if (obj.type === 'score') return { ...obj, current: newScore };
          if (obj.type === 'survive') return { ...obj, current: Math.min(obj.current + dt, obj.target) };
          if (obj.type === 'protect') return { ...obj, current: lProgress.protectHP };
          return obj;
        }),
        coinsEarnedThisLevel: lProgress.coinsEarnedThisLevel + coinsEarned,
        timeRemaining: Math.max(0, lProgress.timeRemaining - dt),
      };

      if (levelDef.timeLimit && newProgress.timeRemaining <= 0) {
        const surviveObj = newProgress.objectives.find(o => o.type === 'survive');
        if (surviveObj && surviveObj.current < surviveObj.target) {
          triggerLevelFailed('Time expired');
          return;
        }
      }

      if (newProgress.protectHP <= 0 && levelDef.protectObjectiveHP) {
        triggerLevelFailed('Carrier destroyed');
        return;
      }

      const allComplete = newProgress.objectives.every(obj => {
        if (obj.type === 'survive') return obj.current >= obj.target;
        if (obj.type === 'destroy') return obj.current >= obj.target;
        if (obj.type === 'score') return obj.current >= obj.target;
        if (obj.type === 'protect') return newProgress.protectHP > 0;
        return false;
      });

      if (allComplete) {
        triggerLevelComplete(newScore, newProgress.coinsEarnedThisLevel);
        return;
      }

      levelProgressRef.current = newProgress;
      setLevelProgress(newProgress);
    }

    // ── Lock-on logic ──
    let newLockProgress = ws.lockProgress;
    let newLockedTargetId = ws.lockedTargetId;
    if (ws.targetLockActive) {
      const activeEnemies = updatedEnemies.filter(e => !e.destroyed);
      if (activeEnemies.length > 0) {
        if (!newLockedTargetId || updatedEnemies.find(e => e.id === newLockedTargetId)?.destroyed) {
          let nearest = activeEnemies[0];
          let nearestDist = Infinity;
          for (const e of activeEnemies) {
            const dx = e.position[0] - newPos[0];
            const dy = e.position[1] - newPos[1];
            const dz = e.position[2] - newPos[2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d < nearestDist) { nearestDist = d; nearest = e; }
          }
          newLockedTargetId = nearest.id;
          newLockProgress = 0;
        }
        newLockProgress = Math.min(1, newLockProgress + dt * 0.5);
        if (isTutorial && tutStep === 3 && newLockProgress > 0.5) {
          tutorialLockedRef.current = true;
        }
      }
    } else {
      newLockProgress = 0;
      newLockedTargetId = null;
    }

    setWeaponState(prev => ({
      ...prev,
      missiles: survivingMissiles,
      flares: updatedFlares,
      coins: prev.coins + coinsEarned,
      lockProgress: newLockProgress,
      lockedTargetId: newLockedTargetId,
    }));

    setEnemies(updatedEnemies);
    enemiesRef.current = updatedEnemies;

    // ── Tutorial step checks ──
    if (isTutorial) {
      const step = tutorialStepRef.current;
      if (step === 0 && tutorialMovedRef.current) {
        tutorialMovedRef.current = false;
        advanceTutorialStep();
      } else if (step === 1 && tutorialThrottledRef.current) {
        tutorialThrottledRef.current = false;
        advanceTutorialStep();
      } else if (step === 2 && tutorialShotRef.current) {
        tutorialShotRef.current = false;
        advanceTutorialStep();
      } else if (step === 3 && tutorialLockedRef.current) {
        tutorialLockedRef.current = false;
        advanceTutorialStep();
      } else if (step === 4 && tutorialDodgedRef.current) {
        tutorialDodgedRef.current = false;
        advanceTutorialStep();
      } else if (step === 5 && tutorialFlaredRef.current) {
        tutorialFlaredRef.current = false;
        advanceTutorialStep();
      }
    }
  }, [triggerGameOver, triggerLevelFailed, triggerLevelComplete, advanceTutorialStep]);

  const restart = useCallback(() => {
    if (gameModeRef.current === 'level') {
      retryLevel();
    } else if (gameModeRef.current === 'freeplay') {
      const freeplayEnemies = spawnFreeplayEnemies();
      setEnemies(freeplayEnemies);
      enemiesRef.current = freeplayEnemies;
      resetAircraft();
    } else {
      resetAircraft();
    }
  }, [retryLevel, resetAircraft]);

  return {
    // Aircraft
    position, rotation, throttle, fuel, speed, altitude,
    isGameOver, crashReason, score,
    // Weapons & enemies
    weaponState, enemies,
    // Actions
    fireMissile, deployFlare, openShop, closeShop, purchaseItem, restart,
    // Mode select
    modeSelectActive, gameMode,
    selectTutorial, selectFreeplay, selectLevel, exitToModeSelect,
    // Tutorial
    tutorialActive, tutorialStep, tutorialSteps, tutorialCompleted,
    skipTutorial,
    // Level
    currentLevelIndex,
    levelDefinitions: LEVEL_DEFINITIONS,
    levelUnlockStatus, levelBestScores,
    levelProgress, levelStartActive, levelComplete, levelFailed, levelFailReason,
    beginLevel, retryLevel, nextLevel,
  };
}
