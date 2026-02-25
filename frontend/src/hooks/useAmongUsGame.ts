import { useRef, useCallback } from 'react';

export interface TaskStation {
  id: number;
  x: number;
  y: number;
  r: number;
  completed: boolean;
  label: string;
}

export interface AmongUsState {
  playerX: number;
  playerY: number;
  playerVX: number;
  playerVY: number;
  impostorX: number;
  impostorY: number;
  impostorVX: number;
  impostorVY: number;
  impostorTarget: number; // task index to patrol toward
  impostorCooldown: number;
  tasks: TaskStation[];
  gameOver: boolean;
  won: boolean;
  nearTask: number | null; // task id player is near
  interactCooldown: number;
}

const CANVAS_W = 800;
const CANVAS_H = 480;
const PLAYER_R = 14;
const IMPOSTOR_R = 14;
const PLAYER_SPEED = 3;
const IMPOSTOR_SPEED = 1.6;
const TASK_INTERACT_DIST = 35;
const KILL_DIST = 28;

const INITIAL_TASKS: TaskStation[] = [
  { id: 0, x: 120, y: 100, r: 18, completed: false, label: 'WIRES' },
  { id: 1, x: 680, y: 100, r: 18, completed: false, label: 'SCAN' },
  { id: 2, x: 120, y: 380, r: 18, completed: false, label: 'FUEL' },
  { id: 3, x: 680, y: 380, r: 18, completed: false, label: 'UPLOAD' },
  { id: 4, x: 400, y: 240, r: 18, completed: false, label: 'REACTOR' },
];

// Room walls for visual decoration
export const ROOMS = [
  { x: 60, y: 60, w: 200, h: 140, label: 'CAFETERIA' },
  { x: 540, y: 60, w: 200, h: 140, label: 'MEDBAY' },
  { x: 60, y: 300, w: 200, h: 140, label: 'STORAGE' },
  { x: 540, y: 300, w: 200, h: 140, label: 'COMMS' },
  { x: 300, y: 170, w: 200, h: 140, label: 'REACTOR' },
];

function cloneTask(t: TaskStation): TaskStation {
  return { ...t };
}

export function useAmongUsGame() {
  const stateRef = useRef<AmongUsState>({
    playerX: 400,
    playerY: 240,
    playerVX: 0,
    playerVY: 0,
    impostorX: 200,
    impostorY: 200,
    impostorVX: 0,
    impostorVY: 0,
    impostorTarget: 0,
    impostorCooldown: 120,
    tasks: INITIAL_TASKS.map(cloneTask),
    gameOver: false,
    won: false,
    nearTask: null,
    interactCooldown: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());

  const getState = useCallback(() => stateRef.current, []);
  const pressKey = useCallback((key: string) => keysRef.current.add(key), []);
  const releaseKey = useCallback((key: string) => keysRef.current.delete(key), []);

  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.interactCooldown > 0 || s.nearTask === null) return;
    const task = s.tasks.find(t => t.id === s.nearTask);
    if (task && !task.completed) {
      task.completed = true;
      s.interactCooldown = 30;
      // Check win
      if (s.tasks.every(t => t.completed)) {
        s.won = true;
        s.gameOver = true;
      }
    }
  }, []);

  const restart = useCallback(() => {
    stateRef.current = {
      playerX: 400,
      playerY: 240,
      playerVX: 0,
      playerVY: 0,
      impostorX: 200,
      impostorY: 200,
      impostorVX: 0,
      impostorVY: 0,
      impostorTarget: 0,
      impostorCooldown: 120,
      tasks: INITIAL_TASKS.map(cloneTask),
      gameOver: false,
      won: false,
      nearTask: null,
      interactCooldown: 0,
    };
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;

    const keys = keysRef.current;
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
    const up = keys.has('ArrowUp') || keys.has('w') || keys.has('W');
    const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S');

    s.playerVX = left ? -PLAYER_SPEED : right ? PLAYER_SPEED : 0;
    s.playerVY = up ? -PLAYER_SPEED : down ? PLAYER_SPEED : 0;

    // Diagonal normalization
    if (s.playerVX !== 0 && s.playerVY !== 0) {
      s.playerVX *= 0.707;
      s.playerVY *= 0.707;
    }

    s.playerX = Math.max(PLAYER_R, Math.min(CANVAS_W - PLAYER_R, s.playerX + s.playerVX));
    s.playerY = Math.max(PLAYER_R, Math.min(CANVAS_H - PLAYER_R, s.playerY + s.playerVY));

    // Interact cooldown
    if (s.interactCooldown > 0) s.interactCooldown--;

    // Check near task
    s.nearTask = null;
    for (const task of s.tasks) {
      if (task.completed) continue;
      const dx = s.playerX - task.x;
      const dy = s.playerY - task.y;
      if (Math.sqrt(dx * dx + dy * dy) < TASK_INTERACT_DIST) {
        s.nearTask = task.id;
        break;
      }
    }

    // Auto-interact when near task and E pressed
    if (keys.has('e') || keys.has('E') || keys.has('f') || keys.has('F')) {
      interact();
    }

    // Impostor AI: patrol between tasks
    const targetTask = s.tasks[s.impostorTarget % s.tasks.length];
    const idx = s.impostorTarget % s.tasks.length;
    const itx = s.tasks[idx].x;
    const ity = s.tasks[idx].y;
    const idx2 = (s.impostorTarget + 1) % s.tasks.length;

    const idx3 = s.impostorTarget % s.tasks.length;
    const patrolX = s.tasks[idx3].x;
    const patrolY = s.tasks[idx3].y;

    const dix = patrolX - s.impostorX;
    const diy = patrolY - s.impostorY;
    const dist = Math.sqrt(dix * dix + diy * diy);

    if (dist < 20) {
      s.impostorTarget = (s.impostorTarget + 1) % s.tasks.length;
    } else {
      s.impostorX += (dix / dist) * IMPOSTOR_SPEED;
      s.impostorY += (diy / dist) * IMPOSTOR_SPEED;
    }

    // Impostor chases player if close
    const dpx = s.playerX - s.impostorX;
    const dpy = s.playerY - s.impostorY;
    const playerDist = Math.sqrt(dpx * dpx + dpy * dpy);

    if (playerDist < 120) {
      s.impostorX += (dpx / playerDist) * IMPOSTOR_SPEED * 1.5;
      s.impostorY += (dpy / playerDist) * IMPOSTOR_SPEED * 1.5;
    }

    s.impostorX = Math.max(IMPOSTOR_R, Math.min(CANVAS_W - IMPOSTOR_R, s.impostorX));
    s.impostorY = Math.max(IMPOSTOR_R, Math.min(CANVAS_H - IMPOSTOR_R, s.impostorY));

    // Kill check
    if (s.impostorCooldown > 0) {
      s.impostorCooldown--;
    } else if (playerDist < KILL_DIST) {
      s.gameOver = true;
      s.won = false;
    }

    // Suppress unused variable warnings
    void targetTask;
    void itx;
    void ity;
    void idx2;
  }, [interact]);

  return { getState, pressKey, releaseKey, interact, update, restart };
}
