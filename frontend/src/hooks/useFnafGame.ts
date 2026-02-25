import { useRef, useCallback } from 'react';

export type CameraId = 'cam1' | 'cam2' | 'cam3' | 'cam4';
export type AnimatronicId = 'freddy' | 'bonnie';

export interface Animatronic {
  id: AnimatronicId;
  name: string;
  currentRoom: CameraId | 'left-door' | 'right-door' | 'office';
  moveCooldown: number;
  moveInterval: number;
  color: string;
  emoji: string;
}

export interface FnafState {
  phase: 'playing' | 'game-over' | 'win';
  currentView: 'office' | CameraId;
  leftDoorClosed: boolean;
  rightDoorClosed: boolean;
  power: number; // 0-100
  powerDrainRate: number;
  nightTimer: number; // seconds elapsed (0-90 = 12AM-6AM)
  nightDuration: number; // 90 seconds
  animatronics: Animatronic[];
  nightsSurvived: number;
  jumpscareActive: boolean;
  message: string;
}

const CAMERA_NAMES: Record<CameraId, string> = {
  cam1: 'CAM 1 - SHOW STAGE',
  cam2: 'CAM 2 - DINING AREA',
  cam3: 'CAM 3 - BACKSTAGE',
  cam4: 'CAM 4 - HALLWAY',
};

const CAMERA_PATHS: Record<CameraId | 'left-door' | 'right-door', (CameraId | 'left-door' | 'right-door')[]> = {
  cam1: ['cam2', 'cam3'],
  cam2: ['cam1', 'cam4'],
  cam3: ['cam2', 'cam4'],
  cam4: ['cam3', 'left-door', 'right-door'],
  'left-door': ['cam4'],
  'right-door': ['cam4'],
};

function initialState(): FnafState {
  return {
    phase: 'playing',
    currentView: 'office',
    leftDoorClosed: false,
    rightDoorClosed: false,
    power: 100,
    powerDrainRate: 0.015,
    nightTimer: 0,
    nightDuration: 90,
    animatronics: [
      {
        id: 'freddy',
        name: 'FREDDY',
        currentRoom: 'cam1',
        moveCooldown: 0,
        moveInterval: 420,
        color: '#8B6914',
        emoji: '🐻',
      },
      {
        id: 'bonnie',
        name: 'BONNIE',
        currentRoom: 'cam1',
        moveCooldown: 0,
        moveInterval: 280,
        color: '#6a0dad',
        emoji: '🐰',
      },
    ],
    nightsSurvived: 0,
    jumpscareActive: false,
    message: '',
  };
}

export function useFnafGame() {
  const stateRef = useRef<FnafState>(initialState());
  const nightsSurvivedRef = useRef(0);

  const getState = useCallback(() => stateRef.current, []);

  const setView = useCallback((view: 'office' | CameraId) => {
    stateRef.current.currentView = view;
  }, []);

  const toggleLeftDoor = useCallback(() => {
    stateRef.current.leftDoorClosed = !stateRef.current.leftDoorClosed;
  }, []);

  const toggleRightDoor = useCallback(() => {
    stateRef.current.rightDoorClosed = !stateRef.current.rightDoorClosed;
  }, []);

  const restart = useCallback(() => {
    const ns = nightsSurvivedRef.current;
    stateRef.current = initialState();
    stateRef.current.nightsSurvived = ns;
  }, []);

  const update = useCallback((delta: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    // Night timer
    s.nightTimer += delta;

    // Power drain
    let drain = s.powerDrainRate;
    if (s.leftDoorClosed) drain += 0.02;
    if (s.rightDoorClosed) drain += 0.02;
    if (s.currentView !== 'office') drain += 0.01;
    s.power = Math.max(0, s.power - drain);

    // Power out
    if (s.power <= 0) {
      s.leftDoorClosed = false;
      s.rightDoorClosed = false;
      s.message = '⚡ POWER OUT! DOORS OPEN!';
    }

    // Win condition
    if (s.nightTimer >= s.nightDuration) {
      s.phase = 'win';
      nightsSurvivedRef.current++;
      s.nightsSurvived = nightsSurvivedRef.current;
      s.message = '6 AM! YOU SURVIVED!';
      return;
    }

    // Animatronic movement
    for (const anim of s.animatronics) {
      anim.moveCooldown--;
      if (anim.moveCooldown <= 0) {
        anim.moveCooldown = anim.moveInterval - Math.floor(s.nightTimer * 2);
        anim.moveCooldown = Math.max(60, anim.moveCooldown);

        const currentRoom = anim.currentRoom;
        if (currentRoom === 'office') continue;

        const neighbors = CAMERA_PATHS[currentRoom as CameraId | 'left-door' | 'right-door'];
        if (!neighbors || neighbors.length === 0) continue;

        // Move toward office with some randomness
        const rand = Math.random();
        if (rand < 0.6) {
          // Move forward (toward office)
          const next = neighbors[neighbors.length - 1];
          anim.currentRoom = next;
        } else {
          // Random move
          anim.currentRoom = neighbors[Math.floor(Math.random() * neighbors.length)];
        }

        // Check if animatronic reaches door
        if (anim.currentRoom === 'left-door') {
          if (!s.leftDoorClosed) {
            // Enter office
            anim.currentRoom = 'office';
            s.jumpscareActive = true;
            s.phase = 'game-over';
            s.message = `${anim.name} GOT YOU!`;
          }
        } else if (anim.currentRoom === 'right-door') {
          if (!s.rightDoorClosed) {
            anim.currentRoom = 'office';
            s.jumpscareActive = true;
            s.phase = 'game-over';
            s.message = `${anim.name} GOT YOU!`;
          }
        }
      }
    }
  }, []);

  return {
    getState, setView, toggleLeftDoor, toggleRightDoor, update, restart,
    CAMERA_NAMES,
  };
}
