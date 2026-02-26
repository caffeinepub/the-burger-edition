import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useOvoGame, CANVAS_W, CANVAS_H } from '../hooks/useOvoGame';
import Leaderboard from '../components/Leaderboard';
import ScoreSubmission from '../components/ScoreSubmission';
import { CheckCircle } from 'lucide-react';

type UIPhase = 'idle' | 'playing' | 'dead' | 'levelComplete' | 'gameComplete';

export default function OvoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { stateRef, startGame, restartGame, nextLevel, onPhaseChange, completedLevels } = useOvoGame(canvasRef);

  const [phase, setPhase] = useState<UIPhase>('idle');
  const [deathCount, setDeathCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);

  useEffect(() => {
    onPhaseChange.current = (newPhase, gs) => {
      setPhase(newPhase as UIPhase);
      setDeathCount(gs.deathCount);
      setTotalTime(gs.totalTime);
      setCurrentLevel(gs.currentLevel);
      if (newPhase === 'gameComplete') setShowSubmit(true);
    };
  }, [onPhaseChange]);

  const handleStartLevel = useCallback((levelIndex: number) => {
    setPhase('playing');
    setShowSubmit(false);
    startGame(levelIndex);
  }, [startGame]);

  const handleRestart = useCallback(() => {
    setPhase('playing');
    restartGame();
  }, [restartGame]);

  const handleNextLevel = useCallback(() => {
    setPhase('playing');
    nextLevel();
  }, [nextLevel]);

  // Mobile touch controls
  const pressKey = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  };
  const releaseKey = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const totalLevels = 10;

  return (
    <div className="min-h-screen bg-arcade-bg text-arcade-text py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-3xl text-neon-green mb-2 drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">
            OVO
          </h1>
          <p className="font-pixel text-xs text-arcade-muted">PRECISION PLATFORMER</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main game area */}
          <div className="flex-1">
            {/* Canvas */}
            <div className="relative border-2 border-neon-green/40 rounded-lg overflow-hidden"
              style={{ boxShadow: '0 0 20px rgba(0,255,136,0.2)' }}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="w-full block bg-black"
                style={{ imageRendering: 'pixelated', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
              />

              {/* Idle overlay */}
              {phase === 'idle' && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-6 p-6">
                  <div className="text-center">
                    <h2 className="font-pixel text-2xl text-neon-green mb-2">OVO</h2>
                    <p className="font-pixel text-xs text-arcade-muted">10 LEVELS OF PRECISION PLATFORMING</p>
                  </div>

                  {/* Level select grid */}
                  <div className="w-full max-w-md">
                    <p className="font-pixel text-xs text-arcade-muted text-center mb-3">SELECT LEVEL</p>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: totalLevels }, (_, i) => {
                        const isCompleted = completedLevels.has(i);
                        return (
                          <button
                            key={i}
                            onClick={() => handleStartLevel(i)}
                            className="relative aspect-square flex items-center justify-center font-pixel text-sm border-2 rounded transition-all duration-150
                              border-neon-green/50 bg-neon-green/10 text-neon-green
                              hover:bg-neon-green/30 hover:border-neon-green hover:shadow-[0_0_10px_rgba(0,255,136,0.5)]
                              active:scale-95"
                          >
                            <span>{i + 1}</span>
                            {isCompleted && (
                              <span className="absolute -top-1.5 -right-1.5 text-neon-green drop-shadow-[0_0_4px_rgba(0,255,136,0.9)]">
                                <CheckCircle size={14} strokeWidth={2.5} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartLevel(0)}
                    className="neon-btn font-pixel text-xs px-6 py-3"
                  >
                    START FROM LEVEL 1
                  </button>
                </div>
              )}

              {/* Dead overlay */}
              {phase === 'dead' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                  <h2 className="font-pixel text-xl text-red-400 drop-shadow-[0_0_8px_rgba(255,50,50,0.8)]">
                    YOU DIED
                  </h2>
                  <p className="font-pixel text-xs text-arcade-muted">DEATHS: {deathCount}</p>
                  <div className="flex gap-3">
                    <button onClick={handleRestart} className="neon-btn font-pixel text-xs px-4 py-2">
                      RETRY
                    </button>
                    <button
                      onClick={() => setPhase('idle')}
                      className="font-pixel text-xs px-4 py-2 border border-arcade-muted/40 text-arcade-muted rounded hover:border-arcade-muted hover:text-arcade-text transition-colors"
                    >
                      LEVELS
                    </button>
                  </div>
                </div>
              )}

              {/* Level complete overlay */}
              {phase === 'levelComplete' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                  <h2 className="font-pixel text-xl text-neon-green drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]">
                    LEVEL CLEAR!
                  </h2>
                  <p className="font-pixel text-xs text-arcade-muted">
                    LEVEL {currentLevel + 1} COMPLETE
                  </p>
                  <p className="font-pixel text-xs text-arcade-muted">
                    TIME: {formatTime(totalTime)}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleNextLevel} className="neon-btn font-pixel text-xs px-4 py-2">
                      NEXT LEVEL
                    </button>
                    <button
                      onClick={() => setPhase('idle')}
                      className="font-pixel text-xs px-4 py-2 border border-arcade-muted/40 text-arcade-muted rounded hover:border-arcade-muted hover:text-arcade-text transition-colors"
                    >
                      LEVELS
                    </button>
                  </div>
                </div>
              )}

              {/* Game complete overlay */}
              {phase === 'gameComplete' && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 p-6">
                  <h2 className="font-pixel text-xl text-neon-yellow drop-shadow-[0_0_10px_rgba(255,204,0,0.8)]">
                    YOU WIN!
                  </h2>
                  <p className="font-pixel text-xs text-arcade-muted">ALL 10 LEVELS COMPLETE!</p>
                  <p className="font-pixel text-xs text-neon-green">
                    TIME: {formatTime(totalTime)}
                  </p>
                  <p className="font-pixel text-xs text-arcade-muted">
                    DEATHS: {deathCount}
                  </p>
                  {showSubmit && (
                    <div className="w-full max-w-xs">
                      <ScoreSubmission
                        game="ovo"
                        score={Math.round(totalTime * 10 + deathCount * 50)}
                        onSubmitted={() => setShowSubmit(false)}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setPhase('idle')}
                    className="neon-btn font-pixel text-xs px-4 py-2"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              )}
            </div>

            {/* Mobile controls */}
            {phase === 'playing' && (
              <div className="mt-4 flex justify-between items-end px-4 lg:hidden">
                <div className="flex gap-2">
                  <button
                    onPointerDown={() => pressKey('ArrowLeft')}
                    onPointerUp={() => releaseKey('ArrowLeft')}
                    onPointerLeave={() => releaseKey('ArrowLeft')}
                    className="dir-btn"
                  >◀</button>
                  <button
                    onPointerDown={() => pressKey('ArrowRight')}
                    onPointerUp={() => releaseKey('ArrowRight')}
                    onPointerLeave={() => releaseKey('ArrowRight')}
                    className="dir-btn"
                  >▶</button>
                </div>
                <button
                  onPointerDown={() => pressKey('Space')}
                  onPointerUp={() => releaseKey('Space')}
                  onPointerLeave={() => releaseKey('Space')}
                  className="dir-btn w-16 h-16 text-lg"
                >▲</button>
              </div>
            )}

            {/* How to play */}
            <div className="mt-4 p-4 border border-arcade-muted/20 rounded-lg bg-arcade-surface/30">
              <p className="font-pixel text-xs text-neon-green mb-2">HOW TO PLAY</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-arcade-muted font-pixel">
                <span>← → / A D</span><span>MOVE</span>
                <span>↑ / W / SPACE</span><span>JUMP</span>
                <span>WALL TOUCH</span><span>WALL JUMP</span>
                <span>COLORED RINGS</span><span>PORTALS</span>
                <span>WHITE DOOR</span><span>EXIT / GOAL</span>
                <span>RED ZONES</span><span>HAZARDS</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 flex flex-col gap-4">
            {/* Stats */}
            {phase === 'playing' && (
              <div className="p-4 border border-neon-green/30 rounded-lg bg-arcade-surface/50">
                <p className="font-pixel text-xs text-neon-green mb-3">STATS</p>
                <div className="space-y-2 font-pixel text-xs text-arcade-muted">
                  <div className="flex justify-between">
                    <span>LEVEL</span>
                    <span className="text-arcade-text">{currentLevel + 1} / {totalLevels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TIME</span>
                    <span className="text-arcade-text">{formatTime(totalTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEATHS</span>
                    <span className="text-red-400">{deathCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="p-4 border border-arcade-muted/20 rounded-lg bg-arcade-surface/30">
              <p className="font-pixel text-xs text-neon-green mb-3">PROGRESS</p>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: totalLevels }, (_, i) => {
                  const isCompleted = completedLevels.has(i);
                  const isCurrent = phase === 'playing' && i === currentLevel;
                  return (
                    <div
                      key={i}
                      className={`relative aspect-square flex items-center justify-center font-pixel text-xs rounded border transition-colors
                        ${isCurrent
                          ? 'border-neon-green bg-neon-green/20 text-neon-green'
                          : isCompleted
                            ? 'border-neon-green/60 bg-neon-green/10 text-neon-green/80'
                            : 'border-arcade-muted/20 bg-arcade-surface/20 text-arcade-muted/40'
                        }`}
                    >
                      <span>{i + 1}</span>
                      {isCompleted && (
                        <span className="absolute -top-1 -right-1 text-neon-green">
                          <CheckCircle size={10} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="font-pixel text-xs text-arcade-muted mt-2 text-center">
                {completedLevels.size} / {totalLevels} CLEARED
              </p>
            </div>

            {/* Leaderboard */}
            <Leaderboard
              game="ovo"
              title="FASTEST RUNS"
              accentColor="neon-green"
              lowerIsBetter={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
