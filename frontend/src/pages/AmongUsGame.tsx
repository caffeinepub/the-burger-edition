import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useAmongUsGame, ROOMS } from '../hooks/useAmongUsGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 480;

export default function AmongUsGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { getState, pressKey, releaseKey, interact, update, restart } = useAmongUsGame();
  const [displayState, setDisplayState] = useState({ gameOver: false, won: false, tasksCompleted: 0, totalTasks: 5 });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    // Background (space)
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Rooms
    for (const room of ROOMS) {
      ctx.fillStyle = '#0d1a2e';
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = '#1a3a5e';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.fillStyle = '#1a3a5e';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, room.x + room.w / 2, room.y + 14);
      ctx.textAlign = 'left';
    }

    // Corridors (connecting lines)
    ctx.strokeStyle = '#0d1a2e';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(260, 130); ctx.lineTo(300, 240);
    ctx.moveTo(540, 130); ctx.lineTo(500, 240);
    ctx.moveTo(260, 370); ctx.lineTo(300, 310);
    ctx.moveTo(540, 370); ctx.lineTo(500, 310);
    ctx.stroke();
    ctx.strokeStyle = '#1a3a5e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Task stations
    for (const task of s.tasks) {
      const color = task.completed ? '#00ff88' : '#ffd700';
      ctx.beginPath();
      ctx.arc(task.x, task.y, task.r, 0, Math.PI * 2);
      ctx.fillStyle = task.completed ? 'rgba(0,255,136,0.2)' : 'rgba(255,215,0,0.2)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '7px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(task.label, task.x, task.y + 3);
      ctx.textAlign = 'left';
      if (task.completed) {
        ctx.fillStyle = '#00ff88';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', task.x, task.y - task.r - 4);
        ctx.textAlign = 'left';
      }
    }

    // Near task indicator
    if (s.nearTask !== null) {
      const task = s.tasks.find(t => t.id === s.nearTask);
      if (task && !task.completed) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(task.x, task.y, task.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fff';
        ctx.font = '9px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('[E] DO TASK', task.x, task.y - task.r - 10);
        ctx.textAlign = 'left';
      }
    }

    // Impostor
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(s.impostorX, s.impostorY, 14, 0, Math.PI * 2);
    ctx.fill();
    // Impostor visor
    ctx.fillStyle = '#ff9999';
    ctx.beginPath();
    ctx.ellipse(s.impostorX + 3, s.impostorY - 3, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Impostor backpack
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(s.impostorX - 6, s.impostorY + 8, 12, 8);
    ctx.fillStyle = '#ff3333';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('IMP', s.impostorX, s.impostorY + 26);
    ctx.textAlign = 'left';

    // Player (crewmate)
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(s.playerX, s.playerY, 14, 0, Math.PI * 2);
    ctx.fill();
    // Visor
    ctx.fillStyle = '#99eeff';
    ctx.beginPath();
    ctx.ellipse(s.playerX + 3, s.playerY - 3, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Backpack
    ctx.fillStyle = '#0099cc';
    ctx.fillRect(s.playerX - 6, s.playerY + 8, 12, 8);
    ctx.fillStyle = '#00ccff';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', s.playerX, s.playerY + 26);
    ctx.textAlign = 'left';

    // Task progress bar
    const completed = s.tasks.filter(t => t.completed).length;
    const total = s.tasks.length;
    const pct = completed / total;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, 36);
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 8, CANVAS_W - 20, 20);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(10, 8, (CANVAS_W - 20) * pct, 20);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 8, CANVAS_W - 20, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`TASKS: ${completed}/${total}`, CANVAS_W / 2, 23);
    ctx.textAlign = 'left';
  }, [getState]);

  const gameLoop = useCallback(() => {
    update();
    draw();
    const s = getState();
    const completed = s.tasks.filter(t => t.completed).length;
    setDisplayState({ gameOver: s.gameOver, won: s.won, tasksCompleted: completed, totalTasks: s.tasks.length });
    if (!s.gameOver) {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [update, draw, getState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressKey(e.key);
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
  }, [pressKey, releaseKey, gameLoop]);

  const handleRestart = () => {
    restart();
    setDisplayState({ gameOver: false, won: false, tasksCompleted: 0, totalTasks: 5 });
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
        <h1 className="font-pixel text-xl text-neon-cyan tracking-widest">AMONG US</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-xl border-2 border-neon-cyan/40"
              style={{ imageRendering: 'pixelated', maxHeight: '65vh', objectFit: 'contain' }}
            />
            {displayState.gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl">
                <p className={`font-pixel text-2xl mb-2 ${displayState.won ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {displayState.won ? '✅ TASKS COMPLETE!' : '💀 ELIMINATED!'}
                </p>
                <p className="font-pixel text-sm text-arcade-muted mb-6">
                  Tasks: {displayState.tasksCompleted}/{displayState.totalTasks}
                </p>
                {displayState.won && !scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="among-us"
                      score={displayState.tasksCompleted}
                      label="SAVE SCORE"
                      scoreSuffix="tasks"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={handleRestart} className="btn-neon-cyan font-pixel text-sm px-6 py-3 rounded-lg tracking-widest">
                  ▶ PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
            <p className="font-pixel text-xs text-arcade-muted tracking-wider mb-2">CONTROLS</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-arcade-muted font-sans">
              <span>WASD / ← → ↑ ↓ — Move</span>
              <span>E / F — Do Task</span>
              <span>Complete all 5 tasks to win</span>
              <span>Avoid the red Impostor!</span>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="among-us" title="TASKS COMPLETED" accentColor="neon-cyan" />
        </div>
      </div>
    </div>
  );
}
