import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Timer, Trophy } from 'lucide-react';
import { useOvoGame, formatTime, LEVELS } from '../hooks/useOvoGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 400;

export default function OvoGame() {
  const { canvasRef, gameStateRef, startGame, restartLevel } = useOvoGame();

  // UI state — polled from gameStateRef
  const [phase, setPhase] = useState<string>('idle');
  const [levelIdx, setLevelIdx] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll game state for UI updates
  useEffect(() => {
    pollRef.current = setInterval(() => {
      const gs = gameStateRef.current;
      setPhase(gs.phase);
      setLevelIdx(gs.level);
      setTotalTime(gs.totalTime + gs.levelTime);
    }, 50);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameStateRef]);

  const handleStart = useCallback(() => {
    setScoreSubmitted(false);
    startGame();
  }, [startGame]);

  const handleNextLevel = useCallback(() => {
    const gs = gameStateRef.current;
    const nextLevel = gs.level + 1;
    if (nextLevel < LEVELS.length) {
      gs.level = nextLevel;
      gs.levelTime = 0;
      gs.phase = 'playing';
      const level = LEVELS[nextLevel];
      gs.player = {
        x: level.spawnX,
        y: level.spawnY,
        vx: 0, vy: 0,
        w: 22, h: 40,
        state: 'running',
        onGround: false,
        onWall: 0,
        slideTimer: 0,
        coyoteTime: 0,
        jumpBuffer: 0,
        facingRight: true,
      };
      gs.cameraX = 0;
    }
  }, [gameStateRef]);

  const handleRestart = useCallback(() => {
    setScoreSubmitted(false);
    startGame();
  }, [startGame]);

  // Score in centiseconds for leaderboard (lower is better)
  const scoreCs = Math.round(totalTime * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-pixel text-xs text-arcade-muted hover:text-neon-cyan transition-colors mb-6 tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> BACK TO LOBBY
      </Link>

      <h1 className="font-pixel text-3xl text-neon-cyan drop-shadow-neon-cyan mb-1 tracking-widest">
        OvO
      </h1>
      <p className="text-arcade-muted text-sm mb-6 font-sans">
        Run, slide, and jump through obstacle courses as fast as possible!
      </p>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Game area */}
        <div className="flex flex-col items-center gap-4 w-full xl:flex-1">
          {/* HUD bar */}
          <div className="flex items-center gap-4 w-full justify-between">
            <div className="font-pixel text-xs text-arcade-muted tracking-wider flex items-center gap-2">
              <Timer className="w-3 h-3 text-neon-cyan" />
              <span className="text-neon-cyan">{formatTime(totalTime)}</span>
            </div>
            <div className="font-pixel text-xs text-arcade-muted tracking-wider">
              LEVEL <span className="text-neon-cyan">{levelIdx + 1}</span>/3
            </div>
            <button
              onClick={restartLevel}
              className="font-pixel text-xs px-3 py-1.5 rounded border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-colors tracking-wider flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> RESTART
            </button>
          </div>

          {/* Canvas wrapper */}
          <div className="relative w-full" style={{ maxWidth: CANVAS_W }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-xl border-2 border-neon-cyan/40 block w-full"
              style={{ imageRendering: 'pixelated' }}
              tabIndex={0}
            />

            {/* Idle overlay */}
            {phase === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/85 rounded-xl gap-6 px-6">
                <div className="text-center">
                  <p className="font-pixel text-neon-cyan text-2xl mb-3 tracking-widest drop-shadow-neon-cyan">
                    OvO
                  </p>
                  <p className="font-pixel text-xs text-arcade-muted tracking-wider">
                    TIMED PLATFORMER
                  </p>
                </div>
                <div className="bg-arcade-card border border-neon-cyan/20 rounded-xl p-4 max-w-xs w-full">
                  <p className="font-pixel text-xs text-neon-cyan mb-3 tracking-wider">CONTROLS</p>
                  <ul className="text-arcade-muted text-xs space-y-1.5 font-sans">
                    <li>← → / A D — Run</li>
                    <li>↑ / W / Space — Jump</li>
                    <li>↓ / S — Slide</li>
                    <li>Wall + Jump — Wall Jump</li>
                  </ul>
                </div>
                <button
                  onClick={handleStart}
                  className="btn-neon-cyan font-pixel text-sm px-10 py-3 rounded-lg tracking-widest"
                >
                  ▶ START
                </button>
              </div>
            )}

            {/* Level complete overlay */}
            {phase === 'levelComplete' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/90 rounded-xl gap-4 px-6">
                <p className="font-pixel text-neon-green text-xl tracking-widest drop-shadow-neon-green">
                  LEVEL {levelIdx + 1} CLEAR!
                </p>
                <p className="font-pixel text-xs text-arcade-muted tracking-wider">
                  TOTAL TIME:{' '}
                  <span className="text-neon-yellow">{formatTime(totalTime)}</span>
                </p>
                <button
                  onClick={handleNextLevel}
                  className="btn-neon-green font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
                >
                  ▶ NEXT LEVEL
                </button>
              </div>
            )}

            {/* Game complete overlay */}
            {phase === 'gameComplete' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/92 rounded-xl gap-4 px-6">
                <p className="font-pixel text-neon-yellow text-xl tracking-widest drop-shadow-neon-yellow">
                  YOU WIN!
                </p>
                <p className="font-pixel text-xs text-arcade-muted tracking-wider">
                  FINAL TIME:{' '}
                  <span className="text-neon-green">{formatTime(totalTime)}</span>
                </p>
                {!scoreSubmitted && (
                  <div className="w-full max-w-xs">
                    <ScoreSubmission
                      game="ovo"
                      score={scoreCs}
                      label="SAVE TIME"
                      scoreSuffix="cs"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button
                  onClick={handleRestart}
                  className="btn-neon-cyan font-pixel text-sm px-8 py-3 rounded-lg tracking-widest"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Level progress indicators */}
          <div className="flex items-center gap-3">
            {LEVELS.map((_, i) => (
              <div
                key={i}
                className={`font-pixel text-xs px-3 py-1 rounded border tracking-wider transition-all ${
                  i < levelIdx
                    ? 'border-neon-green/60 text-neon-green bg-neon-green/10'
                    : i === levelIdx
                    ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                    : 'border-arcade-border/40 text-arcade-muted'
                }`}
              >
                LVL {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 w-full xl:w-72">
          {/* Leaderboard */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-neon-cyan" />
              <span className="font-pixel text-xs text-neon-cyan tracking-widest">FASTEST TIMES</span>
            </div>
            <OvoLeaderboard />
          </div>

          {/* How to play */}
          <div className="bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
            <p className="font-pixel text-xs text-neon-cyan mb-3 tracking-wider">HOW TO PLAY</p>
            <ul className="text-arcade-muted text-sm space-y-2 font-sans">
              <li>🏃 Run through 3 obstacle courses</li>
              <li>⬆️ Jump over gaps and hazards</li>
              <li>⬇️ Slide under low ceilings</li>
              <li>🧱 Wall jump off vertical walls</li>
              <li>⚡ Reach the EXIT as fast as you can</li>
              <li>💀 Spikes and falls restart the level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component so leaderboard re-reads on score submit
function OvoLeaderboard() {
  return (
    <Leaderboard
      game="ovo"
      title="OvO — FASTEST TIMES"
      accentColor="neon-cyan"
      lowerIsBetter
    />
  );
}
