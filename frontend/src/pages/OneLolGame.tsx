import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { use1v1LolGame } from '../hooks/use1v1LolGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 450;
const CHAR_W = 30;
const CHAR_H = 40;

export default function OneLolGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { getState, pressKey, releaseKey, shoot, placeWall, update, restart } = use1v1LolGame();
  const [displayState, setDisplayState] = useState({ gameOver: false, playerWon: false, wins: 0 });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#0d1b3e');
    sky.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Walls/platforms
    for (const w of s.walls) {
      const isGround = w.h > 30;
      ctx.fillStyle = isGround ? '#2d3a1b' : '#4a6a2a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = isGround ? '#5aaa3a' : '#7acc4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // Projectiles
    for (const proj of s.projectiles) {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = proj.fromPlayer ? '#00ffff' : '#ff4444';
      ctx.fill();
      ctx.shadowBlur = 8;
      ctx.shadowColor = proj.fromPlayer ? '#00ffff' : '#ff4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw character helper
    const drawChar = (char: typeof s.player, color: string, label: string) => {
      // Body
      ctx.fillStyle = color;
      ctx.fillRect(char.x, char.y, CHAR_W, CHAR_H);
      // Head
      ctx.fillStyle = '#f5cba7';
      ctx.fillRect(char.x + 5, char.y - 16, 20, 16);
      // Eyes
      ctx.fillStyle = '#000';
      const eyeX = char.facingRight ? char.x + 14 : char.x + 6;
      ctx.fillRect(eyeX, char.y - 12, 4, 4);
      // Gun
      ctx.fillStyle = '#888';
      const gunX = char.facingRight ? char.x + CHAR_W : char.x - 12;
      ctx.fillRect(gunX, char.y + 10, 12, 5);
      // Label
      ctx.fillStyle = color;
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(label, char.x + CHAR_W / 2, char.y - 22);
      ctx.textAlign = 'left';
    };

    drawChar(s.player, '#00ccff', 'YOU');
    drawChar(s.ai, '#ff4444', 'CPU');

    // HP Bars
    const drawHpBar = (x: number, y: number, hp: number, maxHp: number, color: string, label: string) => {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - 5, y - 5, 160, 40);
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y, 150, 14);
      const pct = Math.max(0, hp / maxHp);
      const barColor = pct > 0.5 ? '#00ff88' : pct > 0.25 ? '#ffcc00' : '#ff3333';
      ctx.fillStyle = barColor;
      ctx.fillRect(x, y, 150 * pct, 14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 150, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText(`${label}: ${hp}`, x, y + 28);
    };

    drawHpBar(10, 10, s.player.hp, s.player.maxHp, '#00ccff', 'YOU');
    drawHpBar(CANVAS_W - 170, 10, s.ai.hp, s.ai.maxHp, '#ff4444', 'CPU');
  }, [getState]);

  const gameLoop = useCallback(() => {
    update();
    draw();
    const s = getState();
    if (!s.gameOver) {
      rafRef.current = requestAnimationFrame(gameLoop);
    } else {
      setDisplayState({ gameOver: true, playerWon: s.playerWon, wins: s.wins });
    }
  }, [update, draw, getState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressKey(e.key);
      if (e.key === 'f' || e.key === 'F') shoot();
      if (e.key === 'e' || e.key === 'E') placeWall();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
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
  }, [pressKey, releaseKey, shoot, placeWall, gameLoop]);

  const handleRestart = () => {
    restart();
    setDisplayState({ gameOver: false, playerWon: false, wins: getState().wins });
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
        <h1 className="font-pixel text-xl text-neon-cyan tracking-widest">1V1.LOL</h1>
        <span className="font-pixel text-xs text-neon-yellow ml-auto">WINS: {displayState.wins}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-xl border-2 border-neon-cyan/40"
              style={{ imageRendering: 'pixelated', maxHeight: '60vh', objectFit: 'contain' }}
            />
            {displayState.gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
                <p className={`font-pixel text-2xl mb-2 ${displayState.playerWon ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {displayState.playerWon ? '🏆 YOU WIN!' : '💀 YOU LOSE!'}
                </p>
                <p className="font-pixel text-sm text-neon-yellow mb-6">TOTAL WINS: {displayState.wins}</p>
                {displayState.playerWon && !scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="1v1-lol"
                      score={displayState.wins}
                      label="SAVE WINS"
                      scoreSuffix="wins"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={handleRestart} className="btn-neon-cyan font-pixel text-sm px-6 py-3 rounded-lg tracking-widest">
                  ▶ REMATCH
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-2">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-arcade-muted font-sans">
              <span>← → / A D — Move</span>
              <span>↑ / W — Jump</span>
              <span>F — Shoot</span>
              <span>E — Place Wall</span>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="1v1-lol" title="MOST WINS" accentColor="neon-cyan" />
        </div>
      </div>
    </div>
  );
}
