import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useSuperMarioGame } from '../hooks/useSuperMarioGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 420;

export default function SuperMarioGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { getState, pressKey, releaseKey, update, restart } = useSuperMarioGame();
  const [displayState, setDisplayState] = useState({ score: 0, gameOver: false, won: false });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#0d1b3e');
    sky.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.save();
    ctx.translate(-s.cameraX, 0);

    // Platforms
    for (const p of s.platforms) {
      if (p.x + p.w < s.cameraX || p.x > s.cameraX + CANVAS_W) continue;
      ctx.fillStyle = '#2d5a1b';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#4a8a2a';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.strokeStyle = '#5aaa3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Coins
    for (const c of s.coins) {
      if (c.collected) continue;
      if (c.x < s.cameraX - 20 || c.x > s.cameraX + CANVAS_W + 20) continue;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff8';
      ctx.beginPath();
      ctx.arc(c.x - 2, c.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    for (const e of s.enemies) {
      if (!e.alive) continue;
      if (e.x + e.w < s.cameraX || e.x > s.cameraX + CANVAS_W) continue;
      // Body
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 4, e.y + 6, 8, 8);
      ctx.fillRect(e.x + 16, e.y + 6, 8, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 6, e.y + 8, 4, 4);
      ctx.fillRect(e.x + 18, e.y + 8, 4, 4);
      // Feet
      ctx.fillStyle = '#5a2d0c';
      ctx.fillRect(e.x, e.y + e.h - 6, 12, 6);
      ctx.fillRect(e.x + e.w - 12, e.y + e.h - 6, 12, 6);
    }

    // Player
    const px = s.playerX, py = s.playerY;
    // Body
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px + 4, py + 14, 20, 18);
    // Hat
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px + 2, py + 4, 24, 10);
    ctx.fillRect(px + 6, py, 16, 8);
    // Face
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(px + 6, py + 14, 16, 10);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 8, py + 16, 4, 4);
    ctx.fillRect(px + 16, py + 16, 4, 4);
    // Overalls
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(px + 4, py + 26, 20, 6);
    // Legs
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(px + 4, py + 30, 8, 6);
    ctx.fillRect(px + 16, py + 30, 8, 6);

    // Goal flag at end
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(s.worldWidth - 80, 200, 6, 180);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(s.worldWidth - 80, 200, 30, 20);

    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, 40);
    ctx.fillStyle = '#f5c518';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`SCORE: ${s.score}`, 16, 26);
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`COINS: ${s.coins.filter(c => c.collected).length}/${s.coins.length}`, 300, 26);

    // Progress bar
    const progress = s.playerX / s.worldWidth;
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(CANVAS_W - 160, 12, 140, 16);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(CANVAS_W - 160, 12, 140 * progress, 16);
    ctx.strokeStyle = '#00ff8866';
    ctx.lineWidth = 1;
    ctx.strokeRect(CANVAS_W - 160, 12, 140, 16);
  }, [getState]);

  const gameLoop = useCallback(() => {
    update();
    draw();
    const s = getState();
    if (!s.gameOver && !s.won) {
      rafRef.current = requestAnimationFrame(gameLoop);
    } else {
      setDisplayState({ score: s.score, gameOver: s.gameOver, won: s.won });
    }
  }, [update, draw, getState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressKey(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => releaseKey(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pressKey, releaseKey, gameLoop]);

  const handleRestart = () => {
    restart();
    setDisplayState({ score: 0, gameOver: false, won: false });
    setScoreSubmitted(false);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-xl text-neon-yellow tracking-widest">SUPER MARIO</h1>
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
            {(displayState.gameOver || displayState.won) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
                <p className={`font-pixel text-2xl mb-2 ${displayState.won ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {displayState.won ? '🎉 YOU WIN!' : '💀 GAME OVER'}
                </p>
                <p className="font-pixel text-lg text-neon-yellow mb-6">SCORE: {displayState.score}</p>
                {!scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="super-mario"
                      score={displayState.score}
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

          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-yellow/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-2">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-arcade-muted font-sans">
              <span>← → / A D — Move</span>
              <span>↑ / W / Space — Jump</span>
              <span>Stomp enemies — 100 pts</span>
              <span>Collect coins — 50 pts</span>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="super-mario" title="TOP SCORES" accentColor="neon-yellow" />
        </div>
      </div>
    </div>
  );
}
