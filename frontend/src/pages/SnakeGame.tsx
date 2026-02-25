import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  running: boolean;
  gameOver: boolean;
}

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function initState(): GameState {
  const snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  return {
    snake,
    food: randomFood(snake),
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    running: false,
    gameOver: false,
  };
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = stateRef.current;

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid dots
    ctx.fillStyle = 'rgba(57, 255, 20, 0.06)';
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        ctx.fillRect(x * CELL_SIZE + CELL_SIZE / 2 - 1, y * CELL_SIZE + CELL_SIZE / 2 - 1, 2, 2);
      }
    }

    // Food
    const fx = state.food.x * CELL_SIZE;
    const fy = state.food.y * CELL_SIZE;
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff2d78';
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    state.snake.forEach((seg, i) => {
      const sx = seg.x * CELL_SIZE;
      const sy = seg.y * CELL_SIZE;
      const isHead = i === 0;
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = isHead ? 16 : 6;
      ctx.fillStyle = isHead ? '#39ff14' : `rgba(57, 255, 20, ${Math.max(0.4, 1 - i * 0.04)})`;
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, isHead ? 6 : 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, []);

  const tick = useCallback(() => {
    const state = stateRef.current;
    if (!state.running) return;

    const dir = state.nextDirection;
    state.direction = dir;

    const head = state.snake[0];
    const newHead: Point = {
      x: head.x + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
      y: head.y + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0),
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      state.running = false;
      state.gameOver = true;
      setGameOver(true);
      setScoreSubmitted(false);
      return;
    }

    // Self collision
    if (state.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      state.running = false;
      state.gameOver = true;
      setGameOver(true);
      setScoreSubmitted(false);
      return;
    }

    const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
    const newSnake = [newHead, ...state.snake];
    if (!ateFood) newSnake.pop();

    state.snake = newSnake;
    if (ateFood) {
      state.score += 10;
      state.food = randomFood(newSnake);
      setScore(state.score);
    }

    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    stateRef.current = initState();
    stateRef.current.running = true;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setScoreSubmitted(false);
    draw();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!started) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, INITIAL_SPEED);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, tick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const state = stateRef.current;
      const dir = state.direction;
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', w: 'UP', W: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
      };
      const newDir = keyMap[e.key];
      if (!newDir) return;

      const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      if (newDir !== opposites[dir]) {
        state.nextDirection = newDir;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Mobile controls
  const handleMobileDir = (dir: Direction) => {
    const state = stateRef.current;
    const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (dir !== opposites[state.direction]) {
      state.nextDirection = dir;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 font-pixel text-xs text-arcade-muted hover:text-neon-green transition-colors mb-6 tracking-wider">
        <ArrowLeft className="w-4 h-4" /> BACK TO LOBBY
      </Link>

      <h1 className="font-pixel text-3xl text-neon-green drop-shadow-neon-green mb-2 tracking-widest">SNAKE</h1>
      <p className="text-arcade-muted text-sm mb-6 font-sans">Use arrow keys or WASD to control the snake.</p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Game area */}
        <div className="flex flex-col items-center gap-4">
          {/* Score */}
          <div className="flex items-center gap-4 w-full justify-between">
            <div className="font-pixel text-sm text-arcade-muted tracking-wider">
              SCORE: <span className="text-neon-green">{score}</span>
            </div>
            <button
              onClick={startGame}
              className="font-pixel text-xs px-3 py-1.5 rounded border border-neon-green/50 text-neon-green hover:bg-neon-green/10 transition-colors tracking-wider flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> RESTART
            </button>
          </div>

          {/* Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-xl border-2 border-neon-green/40 block"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Start overlay */}
            {!started && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/80 rounded-xl">
                <p className="font-pixel text-neon-green text-xl mb-6 tracking-widest drop-shadow-neon-green">SNAKE</p>
                <button onClick={startGame} className="btn-neon-green font-pixel text-sm px-8 py-3 rounded-lg tracking-widest">
                  ▶ START GAME
                </button>
              </div>
            )}

            {/* Game over overlay */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/90 rounded-xl px-6">
                <p className="font-pixel text-neon-pink text-2xl mb-2 tracking-widest">GAME OVER</p>
                <p className="font-pixel text-arcade-muted text-sm mb-6 tracking-wider">
                  SCORE: <span className="text-neon-green">{score}</span>
                </p>
                {!scoreSubmitted && score > 0 && (
                  <div className="w-full max-w-xs mb-4">
                    <ScoreSubmission
                      game="snake"
                      score={score}
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={startGame} className="btn-neon-green font-pixel text-sm px-8 py-3 rounded-lg tracking-widest">
                  <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="grid grid-cols-3 gap-2 mt-2 lg:hidden">
            <div />
            <button onClick={() => handleMobileDir('UP')} className="arcade-btn-dir">▲</button>
            <div />
            <button onClick={() => handleMobileDir('LEFT')} className="arcade-btn-dir">◀</button>
            <button onClick={() => handleMobileDir('DOWN')} className="arcade-btn-dir">▼</button>
            <button onClick={() => handleMobileDir('RIGHT')} className="arcade-btn-dir">▶</button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 w-full">
          <Leaderboard game="snake" title="TOP SCORES" accentColor="neon-green" />
          <div className="mt-6 bg-arcade-card rounded-xl border border-neon-green/20 p-4">
            <p className="font-pixel text-xs text-neon-green mb-3 tracking-wider">HOW TO PLAY</p>
            <ul className="text-arcade-muted text-sm space-y-1 font-sans">
              <li>🎮 Arrow keys or WASD to move</li>
              <li>🍎 Eat food to grow and score</li>
              <li>💀 Avoid walls and your own tail</li>
              <li>⭐ Each food = 10 points</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
