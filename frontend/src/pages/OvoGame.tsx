import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useOvoGame } from '../hooks/useOvoGame';
import Leaderboard from '../components/Leaderboard';
import ScoreSubmission from '../components/ScoreSubmission';

const GAME_ID = 'ovo';

export default function OvoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stateRef, startGame, restartGame, onPhaseChange, CANVAS_W, CANVAS_H } = useOvoGame(canvasRef);

  const [phase, setPhase] = useState<'idle' | 'playing' | 'dead' | 'levelComplete' | 'gameComplete'>('idle');
  const [finalMs, setFinalMs] = useState(0);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    onPhaseChange.current = (newPhase: string, data?: { totalMs: number }) => {
      setPhase(newPhase as 'idle' | 'playing' | 'dead' | 'levelComplete' | 'gameComplete');
      if (newPhase === 'playing') {
        setCurrentLevel(stateRef.current.currentLevel);
      }
      if (newPhase === 'gameComplete' && data) {
        setFinalMs(data.totalMs);
        setScoreSubmitted(false);
      }
    };
  }, []);

  // Sync level display while playing
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      setCurrentLevel(stateRef.current.currentLevel);
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  const handleStart = useCallback(() => {
    setScoreSubmitted(false);
    startGame();
  }, [startGame]);

  const handleRestart = useCallback(() => {
    setScoreSubmitted(false);
    restartGame();
  }, [restartGame]);

  const pressMobile = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  };
  const releaseMobile = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };

  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60).toFixed(2);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Score in centiseconds (lower is better)
  const scoreValue = Math.round(finalMs / 10);

  return (
    <div className="min-h-screen bg-arcade-bg text-arcade-text py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-3xl text-neon-green mb-2 drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]">
            OVO
          </h1>
          <p className="text-arcade-muted font-pixel text-xs">
            Run · Jump · Wall-Jump · Portal · Escape
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Game Area */}
          <div className="flex flex-col items-center gap-4">
            {/* Canvas wrapper */}
            <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
              <canvas
                ref={canvasRef}
                className="block border-2 border-neon-green rounded"
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Idle overlay */}
              {phase === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded">
                  <div className="font-pixel text-neon-green text-5xl mb-4 drop-shadow-[0_0_20px_rgba(34,197,94,1)]">
                    OVO
                  </div>
                  <p className="font-pixel text-white text-xs mb-8 text-center px-8">
                    A precision platformer. Reach the ★ exit on each level.
                  </p>
                  <button
                    onClick={handleStart}
                    className="neon-btn font-pixel text-sm px-8 py-3"
                  >
                    START GAME
                  </button>
                </div>
              )}

              {/* Dead overlay */}
              {phase === 'dead' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded">
                  <div className="font-pixel text-red-400 text-2xl mb-2">YOU DIED</div>
                  <p className="font-pixel text-arcade-muted text-xs mb-6">
                    Level {currentLevel + 1} / {stateRef.current.levels.length}
                  </p>
                  <button
                    onClick={handleRestart}
                    className="neon-btn font-pixel text-sm px-6 py-2"
                  >
                    TRY AGAIN
                  </button>
                </div>
              )}

              {/* Level complete flash */}
              {phase === 'levelComplete' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded pointer-events-none">
                  <div className="font-pixel text-neon-green text-xl animate-pulse">
                    LEVEL CLEAR!
                  </div>
                  <div className="font-pixel text-white text-xs mt-2">
                    Loading next level...
                  </div>
                </div>
              )}

              {/* Game complete overlay */}
              {phase === 'gameComplete' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded overflow-y-auto py-4">
                  <div className="font-pixel text-yellow-400 text-2xl mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">
                    YOU WIN!
                  </div>
                  <div className="font-pixel text-white text-xs mb-1">ALL 10 LEVELS COMPLETE</div>
                  <div className="font-pixel text-neon-green text-lg mb-4">
                    {formatTime(finalMs)}
                  </div>
                  {!scoreSubmitted ? (
                    <div className="w-full max-w-xs px-4">
                      <ScoreSubmission
                        game={GAME_ID}
                        score={scoreValue}
                        onSubmitted={() => setScoreSubmitted(true)}
                      />
                    </div>
                  ) : (
                    <div className="font-pixel text-neon-green text-xs mb-4">Score saved! ✓</div>
                  )}
                  <button
                    onClick={handleRestart}
                    className="neon-btn font-pixel text-xs px-6 py-2 mt-2"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                className="dir-btn w-14 h-14 text-xl"
                onPointerDown={() => pressMobile('ArrowLeft')}
                onPointerUp={() => releaseMobile('ArrowLeft')}
                onPointerLeave={() => releaseMobile('ArrowLeft')}
              >◀</button>
              <button
                className="dir-btn w-14 h-14 text-xl"
                onPointerDown={() => pressMobile('Space')}
                onPointerUp={() => releaseMobile('Space')}
                onPointerLeave={() => releaseMobile('Space')}
              >▲</button>
              <button
                className="dir-btn w-14 h-14 text-xl"
                onPointerDown={() => pressMobile('ArrowRight')}
                onPointerUp={() => releaseMobile('ArrowRight')}
                onPointerLeave={() => releaseMobile('ArrowRight')}
              >▶</button>
            </div>

            {/* Controls guide */}
            <div className="bg-arcade-surface border border-arcade-border rounded p-4 w-full max-w-[800px]">
              <h3 className="font-pixel text-neon-green text-xs mb-3">HOW TO PLAY</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-pixel text-arcade-muted">
                <div className="flex flex-col gap-1">
                  <span className="text-white">Move</span>
                  <span>← → / A D</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white">Jump</span>
                  <span>↑ / W / Space</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white">Wall Jump</span>
                  <span>Jump near wall</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white">Goal</span>
                  <span>Reach ★ exit</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-pixel">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full bg-purple-500 opacity-80"></span>
                  <span className="text-arcade-muted">Portal = teleport</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-2 bg-red-500"></span>
                  <span className="text-arcade-muted">Spikes = instant death</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 bg-yellow-400 text-center text-xs leading-4">★</span>
                  <span className="text-arcade-muted">Exit = next level</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4 w-full lg:w-72">
            {/* Level progress */}
            <div className="bg-arcade-surface border border-arcade-border rounded p-4">
              <h3 className="font-pixel text-neon-green text-xs mb-3">LEVEL PROGRESS</h3>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-8 rounded flex items-center justify-center font-pixel text-xs border transition-all ${
                      i < currentLevel
                        ? 'bg-neon-green/20 border-neon-green text-neon-green'
                        : i === currentLevel && phase === 'playing'
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400 animate-pulse'
                        : 'bg-arcade-bg border-arcade-border text-arcade-muted'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard — uses lowerIsBetter (fastest times) */}
            <Leaderboard
              game={GAME_ID}
              title="FASTEST TIMES"
              accentColor="neon-green"
              lowerIsBetter={true}
            />

            {/* Tips */}
            <div className="bg-arcade-surface border border-arcade-border rounded p-4">
              <h3 className="font-pixel text-neon-green text-xs mb-3">TIPS</h3>
              <ul className="space-y-2 text-xs font-pixel text-arcade-muted">
                <li>• Slide along walls to slow your fall</li>
                <li>• Wall-jump to reach higher platforms</li>
                <li>• Purple portals teleport you instantly</li>
                <li>• Coyote time: jump just after an edge</li>
                <li>• Moving platforms need good timing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
