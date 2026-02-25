import { useRef, useCallback } from 'react';

export type PlayType = 'run' | 'short-pass' | 'long-pass';
export type GamePhase = 'play-select' | 'aiming' | 'in-play' | 'result' | 'game-over';

export interface Player {
  x: number;
  y: number;
}

export interface Defender {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

export interface Receiver {
  x: number;
  y: number;
  vx: number;
  vy: number;
  caught: boolean;
}

export interface RetroBowlState {
  phase: GamePhase;
  score: number;
  drive: number;
  maxDrives: number;
  down: number;
  yardsToGo: number;
  fieldPosition: number; // 0-100 (yards from own end zone)
  selectedPlay: PlayType | null;
  aimAngle: number; // radians
  throwPower: number;
  ball: Ball;
  quarterback: Player;
  receiver: Receiver | null;
  defenders: Defender[];
  message: string;
  touchdown: boolean;
  gameOver: boolean;
  finalScore: number;
}

const CANVAS_W = 800;
const CANVAS_H = 450;
const FIELD_LEFT = 60;
const FIELD_RIGHT = 740;
const FIELD_TOP = 60;
const FIELD_BOTTOM = 390;
const FIELD_W = FIELD_RIGHT - FIELD_LEFT;
const FIELD_H = FIELD_BOTTOM - FIELD_TOP;

function makeDefenders(fieldPos: number): Defender[] {
  const defenders: Defender[] = [];
  const count = 3 + Math.floor(fieldPos / 30);
  for (let i = 0; i < count; i++) {
    defenders.push({
      x: FIELD_LEFT + FIELD_W * (0.4 + Math.random() * 0.5),
      y: FIELD_TOP + FIELD_H * (0.1 + Math.random() * 0.8),
      vx: 0,
      vy: 0,
    });
  }
  return defenders;
}

function initialState(): RetroBowlState {
  return {
    phase: 'play-select',
    score: 0,
    drive: 1,
    maxDrives: 6,
    down: 1,
    yardsToGo: 10,
    fieldPosition: 20,
    selectedPlay: null,
    aimAngle: -Math.PI / 4,
    throwPower: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0, active: false },
    quarterback: { x: FIELD_LEFT + 80, y: FIELD_TOP + FIELD_H / 2 },
    receiver: null,
    defenders: makeDefenders(20),
    message: 'SELECT A PLAY',
    touchdown: false,
    gameOver: false,
    finalScore: 0,
  };
}

export function useRetroBowlGame() {
  const stateRef = useRef<RetroBowlState>(initialState());
  const aimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getState = useCallback(() => stateRef.current, []);

  const selectPlay = useCallback((play: PlayType) => {
    const s = stateRef.current;
    if (s.phase !== 'play-select') return;
    s.selectedPlay = play;
    s.phase = 'aiming';
    s.aimAngle = -Math.PI / 4;
    s.throwPower = 0;
    s.message = 'AIM WITH ← → THEN PRESS SPACE TO THROW';

    // Place receiver based on play
    const recX = play === 'long-pass'
      ? FIELD_LEFT + FIELD_W * 0.7
      : play === 'short-pass'
        ? FIELD_LEFT + FIELD_W * 0.45
        : FIELD_LEFT + FIELD_W * 0.3;
    const recY = FIELD_TOP + FIELD_H * (0.2 + Math.random() * 0.6);
    s.receiver = { x: recX, y: recY, vx: 0, vy: 0, caught: false };
    s.defenders = makeDefenders(s.fieldPosition);
  }, []);

  const adjustAim = useCallback((dir: 'left' | 'right') => {
    const s = stateRef.current;
    if (s.phase !== 'aiming') return;
    s.aimAngle += dir === 'left' ? -0.05 : 0.05;
    s.aimAngle = Math.max(-Math.PI * 0.8, Math.min(-0.1, s.aimAngle));
  }, []);

  const throwBall = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'aiming' || !s.receiver) return;

    const play = s.selectedPlay!;
    const speed = play === 'long-pass' ? 9 : play === 'short-pass' ? 7 : 5;
    const qb = s.quarterback;

    s.ball = {
      x: qb.x + 20,
      y: qb.y,
      vx: Math.cos(s.aimAngle) * speed,
      vy: Math.sin(s.aimAngle) * speed,
      active: true,
    };
    s.phase = 'in-play';
    s.message = '';
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'in-play' || !s.ball.active) return;

    // Move ball
    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;
    s.ball.vy += 0.08; // slight gravity arc

    // Move receiver toward ball
    if (s.receiver && !s.receiver.caught) {
      const dx = s.ball.x - s.receiver.x;
      const dy = s.ball.y - s.receiver.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        s.receiver.x += (dx / dist) * 2;
        s.receiver.y += (dy / dist) * 2;
      }
    }

    // Move defenders toward ball/receiver
    for (const def of s.defenders) {
      const target = s.receiver || s.ball;
      const dx = target.x - def.x;
      const dy = target.y - def.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        def.x += (dx / dist) * 1.8;
        def.y += (dy / dist) * 1.8;
      }
    }

    // Check catch
    if (s.receiver && !s.receiver.caught) {
      const dx = s.ball.x - s.receiver.x;
      const dy = s.ball.y - s.receiver.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        s.receiver.caught = true;
        s.ball.active = false;
        s.message = 'CAUGHT! RUN!';
      }
    }

    // If receiver caught, run forward
    if (s.receiver?.caught) {
      s.receiver.x += 3;
      // Check defender tackle
      for (const def of s.defenders) {
        const dx = s.receiver.x - def.x;
        const dy = s.receiver.y - def.y;
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          // Tackled
          const yardsGained = Math.max(0, Math.floor((s.receiver.x - s.quarterback.x) / (FIELD_W / 100) * 0.8));
          resolvePlay(s, yardsGained);
          return;
        }
      }
      // Touchdown
      if (s.receiver.x >= FIELD_RIGHT - 20) {
        s.score += 7;
        s.touchdown = true;
        s.message = 'TOUCHDOWN! +7 PTS!';
        s.fieldPosition = 20;
        s.down = 1;
        s.yardsToGo = 10;
        s.drive++;
        s.phase = 'result';
        s.receiver = null;
        s.ball.active = false;
        if (s.drive > s.maxDrives) endGame(s);
        return;
      }
    }

    // Ball out of bounds or intercepted
    if (s.ball.x > FIELD_RIGHT || s.ball.y < FIELD_TOP - 20 || s.ball.y > FIELD_BOTTOM + 20) {
      if (!s.receiver?.caught) {
        // Incomplete pass
        resolvePlay(s, 0);
      }
    }

    // Defender intercepts ball
    if (s.ball.active) {
      for (const def of s.defenders) {
        const dx = s.ball.x - def.x;
        const dy = s.ball.y - def.y;
        if (Math.sqrt(dx * dx + dy * dy) < 16) {
          s.message = 'INTERCEPTED!';
          s.ball.active = false;
          s.drive++;
          s.down = 1;
          s.yardsToGo = 10;
          s.fieldPosition = Math.max(5, s.fieldPosition - 20);
          s.phase = 'result';
          s.receiver = null;
          if (s.drive > s.maxDrives) endGame(s);
          return;
        }
      }
    }

    // Run play: auto-resolve after short delay
    if (s.selectedPlay === 'run' && s.ball.active) {
      const yardsGained = 2 + Math.floor(Math.random() * 8);
      resolvePlay(s, yardsGained);
    }
  }, []);

  function resolvePlay(s: RetroBowlState, yardsGained: number) {
    s.fieldPosition = Math.min(100, s.fieldPosition + yardsGained);
    s.yardsToGo = Math.max(0, s.yardsToGo - yardsGained);
    s.ball.active = false;
    s.receiver = null;

    if (s.fieldPosition >= 100) {
      s.score += 7;
      s.touchdown = true;
      s.message = 'TOUCHDOWN! +7 PTS!';
      s.fieldPosition = 20;
      s.down = 1;
      s.yardsToGo = 10;
      s.drive++;
      s.phase = 'result';
      if (s.drive > s.maxDrives) endGame(s);
      return;
    }

    if (s.yardsToGo <= 0) {
      s.message = `FIRST DOWN! +${yardsGained} YDS`;
      s.down = 1;
      s.yardsToGo = 10;
    } else if (s.down >= 4) {
      s.message = `TURNOVER ON DOWNS! +${yardsGained} YDS`;
      s.drive++;
      s.down = 1;
      s.yardsToGo = 10;
      s.fieldPosition = Math.max(5, s.fieldPosition - 15);
      if (s.drive > s.maxDrives) { endGame(s); return; }
    } else {
      s.message = `+${yardsGained} YDS — DOWN ${s.down + 1}`;
      s.down++;
    }
    s.phase = 'result';
  }

  function endGame(s: RetroBowlState) {
    s.gameOver = true;
    s.finalScore = s.score;
    s.phase = 'game-over';
    s.message = `FINAL SCORE: ${s.score}`;
  }

  const nextPlay = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'result') return;
    s.phase = 'play-select';
    s.selectedPlay = null;
    s.touchdown = false;
    s.message = 'SELECT A PLAY';
    s.quarterback = { x: FIELD_LEFT + 80, y: FIELD_TOP + FIELD_H / 2 };
    s.defenders = makeDefenders(s.fieldPosition);
  }, []);

  const restart = useCallback(() => {
    stateRef.current = initialState();
    if (aimIntervalRef.current) clearInterval(aimIntervalRef.current);
  }, []);

  return { getState, selectPlay, adjustAim, throwBall, update, nextPlay, restart };
}
