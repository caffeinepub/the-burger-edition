import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useRetroBowlGame, PlayType } from '../hooks/useRetroBowlGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 450;
const FIELD_LEFT = 60;
const FIELD_RIGHT = 740;
const FIELD_TOP = 60;
const FIELD_BOTTOM = 390;
const FIELD_W = FIELD_RIGHT - FIELD_LEFT;
const FIELD_H = FIELD_BOTTOM - FIELD_TOP;

export default function RetroBowlGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { getState, selectPlay, adjustAim, throwBall, update, nextPlay, restart } = useRetroBowlGame();
  const [displayState, setDisplayState] = useState({ phase: 'play-select', score: 0, drive: 1, maxDrives: 6, down: 1, yardsToGo: 10, message: 'SELECT A PLAY', gameOver: false, finalScore: 0 });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    // Background
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Field
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_W, FIELD_H);

    // Yard lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = FIELD_LEFT + (FIELD_W / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, FIELD_TOP);
      ctx.lineTo(x, FIELD_BOTTOM);
      ctx.stroke();
      // Yard number
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${i * 10}`, x, FIELD_BOTTOM + 16);
    }
    ctx.textAlign = 'left';

    // End zones
    ctx.fillStyle = '#0d3a0d';
    ctx.fillRect(FIELD_LEFT, FIELD_TOP, 30, FIELD_H);
    ctx.fillRect(FIELD_RIGHT - 30, FIELD_TOP, 30, FIELD_H);
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('TD', FIELD_LEFT + 15, FIELD_TOP + FIELD_H / 2);
    ctx.fillText('TD', FIELD_RIGHT - 15, FIELD_TOP + FIELD_H / 2);
    ctx.textAlign = 'left';

    // Field position marker
    const fpX = FIELD_LEFT + (s.fieldPosition / 100) * FIELD_W;
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(fpX, FIELD_TOP);
    ctx.lineTo(fpX, FIELD_BOTTOM);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quarterback
    const qb = s.quarterback;
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(qb.x, qb.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('QB', qb.x, qb.y + 3);
    ctx.textAlign = 'left';

    // Receiver
    if (s.receiver) {
      ctx.fillStyle = s.receiver.caught ? '#00ff88' : '#88ff00';
      ctx.beginPath();
      ctx.arc(s.receiver.x, s.receiver.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('WR', s.receiver.x, s.receiver.y + 3);
      ctx.textAlign = 'left';
    }

    // Defenders
    for (const def of s.defenders) {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(def.x, def.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('D', def.x, def.y + 3);
      ctx.textAlign = 'left';
    }

    // Ball
    if (s.ball.active) {
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(s.ball.x, s.ball.y, 8, 5, Math.atan2(s.ball.vy, s.ball.vx), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Aim line
    if (s.phase === 'aiming') {
      ctx.strokeStyle = 'rgba(255,255,0,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(qb.x, qb.y);
      ctx.lineTo(qb.x + Math.cos(s.aimAngle) * 150, qb.y + Math.sin(s.aimAngle) * 150);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, 55);
    ctx.fillStyle = '#ffd700';
    ctx.font = '11px "Press Start 2P"';
    ctx.fillText(`SCORE: ${s.score}`, 10, 22);
    ctx.fillStyle = '#00ccff';
    ctx.fillText(`DRIVE: ${s.drive}/${s.maxDrives}`, 200, 22);
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`DOWN: ${s.down}  YTG: ${s.yardsToGo}`, 400, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(`FIELD: ${s.fieldPosition} YDS`, 10, 44);

    // Message
    if (s.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(CANVAS_W / 2 - 200, CANVAS_H / 2 - 20, 400, 40);
      ctx.fillStyle = '#ffd700';
      ctx.font = '11px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(s.message, CANVAS_W / 2, CANVAS_H / 2 + 5);
      ctx.textAlign = 'left';
    }
  }, [getState]);

  const gameLoop = useCallback(() => {
    update();
    draw();
    const s = getState();
    setDisplayState({
      phase: s.phase,
      score: s.score,
      drive: s.drive,
      maxDrives: s.maxDrives,
      down: s.down,
      yardsToGo: s.yardsToGo,
      message: s.message,
      gameOver: s.gameOver,
      finalScore: s.finalScore,
    });
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw, getState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { adjustAim('left'); e.preventDefault(); }
      if (e.key === 'ArrowRight') { adjustAim('right'); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowUp') { throwBall(); e.preventDefault(); }
      if (e.key === 'Enter') nextPlay();
    };
    window.addEventListener('keydown', onKeyDown);
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, [adjustAim, throwBall, nextPlay, gameLoop]);

  const handleRestart = () => {
    restart();
    setScoreSubmitted(false);
    setDisplayState({ phase: 'play-select', score: 0, drive: 1, maxDrives: 6, down: 1, yardsToGo: 10, message: 'SELECT A PLAY', gameOver: false, finalScore: 0 });
  };

  const plays: { type: PlayType; label: string; desc: string }[] = [
    { type: 'run', label: '🏃 RUN', desc: '2-8 yds, safe' },
    { type: 'short-pass', label: '🏈 SHORT PASS', desc: '5-15 yds' },
    { type: 'long-pass', label: '🚀 LONG PASS', desc: '15-40 yds, risky' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-xl text-neon-yellow tracking-widest">RETRO BOWL</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-xl border-2 border-neon-yellow/40"
              style={{ imageRendering: 'pixelated', maxHeight: '60vh', objectFit: 'contain' }}
            />

            {/* Game Over overlay */}
            {displayState.gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl">
                <p className="font-pixel text-2xl text-neon-yellow mb-2">GAME OVER</p>
                <p className="font-pixel text-lg text-neon-green mb-6">FINAL SCORE: {displayState.finalScore}</p>
                {!scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="retro-bowl"
                      score={displayState.finalScore}
                      label="SAVE SCORE"
                      scoreSuffix="pts"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={handleRestart} className="btn-neon-yellow font-pixel text-sm px-6 py-3 rounded-lg tracking-widest">
                  ▶ PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Play selection buttons */}
          {displayState.phase === 'play-select' && !displayState.gameOver && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {plays.map((p) => (
                <button
                  key={p.type}
                  onClick={() => selectPlay(p.type)}
                  className="btn-neon-yellow font-pixel text-xs py-3 px-2 rounded-lg tracking-wider flex flex-col items-center gap-1"
                >
                  <span>{p.label}</span>
                  <span className="text-[9px] text-arcade-muted font-sans">{p.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Aiming controls */}
          {displayState.phase === 'aiming' && (
            <div className="mt-4 flex gap-3 justify-center">
              <button onMouseDown={() => adjustAim('left')} className="btn-neon-yellow font-pixel text-sm px-6 py-3 rounded-lg">◀ AIM LEFT</button>
              <button onClick={throwBall} className="btn-neon-green font-pixel text-sm px-6 py-3 rounded-lg">🏈 THROW!</button>
              <button onMouseDown={() => adjustAim('right')} className="btn-neon-yellow font-pixel text-sm px-6 py-3 rounded-lg">AIM RIGHT ▶</button>
            </div>
          )}

          {/* Next play button */}
          {displayState.phase === 'result' && !displayState.gameOver && (
            <div className="mt-4 flex justify-center">
              <button onClick={nextPlay} className="btn-neon-yellow font-pixel text-sm px-8 py-3 rounded-lg tracking-widest">
                ▶ NEXT PLAY
              </button>
            </div>
          )}

          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-yellow/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-2">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-arcade-muted font-sans">
              <span>Click play buttons to select</span>
              <span>← → — Aim pass</span>
              <span>Space / ↑ — Throw</span>
              <span>Enter — Next play</span>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="retro-bowl" title="TOP SCORES" accentColor="neon-yellow" />
        </div>
      </div>
    </div>
  );
}
