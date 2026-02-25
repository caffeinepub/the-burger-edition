import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useFnafGame, CameraId } from '../hooks/useFnafGame';
import ScoreSubmission from '../components/ScoreSubmission';
import Leaderboard from '../components/Leaderboard';

const CANVAS_W = 800;
const CANVAS_H = 480;

const CAMERA_IDS: CameraId[] = ['cam1', 'cam2', 'cam3', 'cam4'];

const CAMERA_COLORS: Record<CameraId, string> = {
  cam1: '#1a2a1a',
  cam2: '#1a1a2a',
  cam3: '#2a1a1a',
  cam4: '#1a2a2a',
};

const ROOM_LAYOUTS: Record<CameraId, { label: string; objects: { x: number; y: number; w: number; h: number; color: string; label: string }[] }> = {
  cam1: {
    label: 'SHOW STAGE',
    objects: [
      { x: 100, y: 150, w: 80, h: 120, color: '#8B6914', label: 'STAGE' },
      { x: 300, y: 150, w: 80, h: 120, color: '#6a0dad', label: 'STAGE' },
      { x: 500, y: 200, w: 60, h: 80, color: '#1a6a1a', label: 'STAGE' },
    ],
  },
  cam2: {
    label: 'DINING AREA',
    objects: [
      { x: 150, y: 200, w: 60, h: 40, color: '#4a3a2a', label: 'TABLE' },
      { x: 350, y: 200, w: 60, h: 40, color: '#4a3a2a', label: 'TABLE' },
      { x: 550, y: 200, w: 60, h: 40, color: '#4a3a2a', label: 'TABLE' },
    ],
  },
  cam3: {
    label: 'BACKSTAGE',
    objects: [
      { x: 200, y: 180, w: 100, h: 80, color: '#3a2a1a', label: 'PARTS' },
      { x: 450, y: 180, w: 80, h: 80, color: '#3a2a1a', label: 'PARTS' },
    ],
  },
  cam4: {
    label: 'HALLWAY',
    objects: [
      { x: 300, y: 100, w: 200, h: 280, color: '#0d0d0d', label: 'DARK' },
    ],
  },
};

export default function FnafGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const { getState, setView, toggleLeftDoor, toggleRightDoor, update, restart, CAMERA_NAMES } = useFnafGame();
  const [displayState, setDisplayState] = useState({
    phase: 'playing' as 'playing' | 'game-over' | 'win',
    power: 100,
    nightTimer: 0,
    nightDuration: 90,
    leftDoorClosed: false,
    rightDoorClosed: false,
    currentView: 'office' as 'office' | CameraId,
    nightsSurvived: 0,
    message: '',
  });
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (s.currentView === 'office') {
      // Office view
      const offGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      offGrad.addColorStop(0, '#0a0a0a');
      offGrad.addColorStop(1, '#1a1a0a');
      ctx.fillStyle = offGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Desk
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(100, 320, 600, 80);
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(100, 380, 600, 20);

      // Monitor on desk
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(320, 240, 160, 100);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(330, 250, 140, 80);
      ctx.fillStyle = '#00ff88';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERAS', 400, 295);
      ctx.textAlign = 'left';

      // Left door
      const ldColor = s.leftDoorClosed ? '#1a3a1a' : '#0a0a0a';
      ctx.fillStyle = ldColor;
      ctx.fillRect(0, 60, 80, CANVAS_H - 60);
      ctx.strokeStyle = s.leftDoorClosed ? '#00ff88' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 60, 80, CANVAS_H - 60);
      ctx.fillStyle = s.leftDoorClosed ? '#00ff88' : '#ff4444';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(s.leftDoorClosed ? 'CLOSED' : 'OPEN', 40, 200);
      ctx.fillText('LEFT', 40, 215);
      ctx.textAlign = 'left';

      // Right door
      const rdColor = s.rightDoorClosed ? '#1a3a1a' : '#0a0a0a';
      ctx.fillStyle = rdColor;
      ctx.fillRect(CANVAS_W - 80, 60, 80, CANVAS_H - 60);
      ctx.strokeStyle = s.rightDoorClosed ? '#00ff88' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(CANVAS_W - 80, 60, 80, CANVAS_H - 60);
      ctx.fillStyle = s.rightDoorClosed ? '#00ff88' : '#ff4444';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(s.rightDoorClosed ? 'CLOSED' : 'OPEN', CANVAS_W - 40, 200);
      ctx.fillText('RIGHT', CANVAS_W - 40, 215);
      ctx.textAlign = 'left';

      // Animatronics at doors
      for (const anim of s.animatronics) {
        if (anim.currentRoom === 'left-door') {
          ctx.fillStyle = anim.color;
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(anim.emoji, 40, 160);
          ctx.textAlign = 'left';
        }
        if (anim.currentRoom === 'right-door') {
          ctx.fillStyle = anim.color;
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(anim.emoji, CANVAS_W - 40, 160);
          ctx.textAlign = 'left';
        }
      }

      // Jumpscare
      if (s.jumpscareActive) {
        ctx.fillStyle = 'rgba(255,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('😱', CANVAS_W / 2, CANVAS_H / 2);
        ctx.textAlign = 'left';
      }
    } else {
      // Camera view
      const camId = s.currentView as CameraId;
      const bgColor = CAMERA_COLORS[camId] || '#1a1a1a';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Scanlines effect
      for (let y = 0; y < CANVAS_H; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, y, CANVAS_W, 2);
      }

      // Room objects
      const layout = ROOM_LAYOUTS[camId];
      if (layout) {
        for (const obj of layout.objects) {
          ctx.fillStyle = obj.color;
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        }
      }

      // Animatronics in this camera
      for (const anim of s.animatronics) {
        if (anim.currentRoom === camId) {
          ctx.fillStyle = anim.color;
          ctx.font = '48px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(anim.emoji, CANVAS_W / 2, CANVAS_H / 2 + 20);
          ctx.font = '10px "Press Start 2P"';
          ctx.fillStyle = '#ff4444';
          ctx.fillText(anim.name, CANVAS_W / 2, CANVAS_H / 2 + 50);
          ctx.textAlign = 'left';
        }
      }

      // Camera label
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_W, 30);
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText(`📷 ${CAMERA_NAMES[camId]}`, 10, 20);

      // Static noise overlay
      ctx.fillStyle = 'rgba(0,255,0,0.03)';
      for (let i = 0; i < 200; i++) {
        ctx.fillRect(Math.random() * CANVAS_W, Math.random() * CANVAS_H, 2, 2);
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_W, 50);

    // Power bar
    const powerPct = s.power / 100;
    const powerColor = powerPct > 0.5 ? '#00ff88' : powerPct > 0.25 ? '#ffcc00' : '#ff3333';
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 8, 200, 16);
    ctx.fillStyle = powerColor;
    ctx.fillRect(10, 8, 200 * powerPct, 16);
    ctx.strokeStyle = powerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 8, 200, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`PWR: ${Math.floor(s.power)}%`, 10, 40);

    // Night timer (12AM to 6AM)
    const hourProgress = s.nightTimer / s.nightDuration;
    const hour = Math.floor(12 + hourProgress * 6);
    const displayHour = hour > 12 ? hour - 12 : hour;
    const amPm = hour >= 12 ? 'AM' : 'AM';
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${displayHour === 0 ? 12 : displayHour}:00 ${amPm}`, CANVAS_W / 2, 22);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#aaa';
    ctx.fillText('SURVIVE UNTIL 6AM', CANVAS_W / 2, 38);
    ctx.textAlign = 'left';

    // Nights survived
    ctx.fillStyle = '#ff9900';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText(`NIGHT ${s.nightsSurvived + 1}`, CANVAS_W - 10, 22);
    ctx.textAlign = 'left';
  }, [getState, CAMERA_NAMES]);

  const gameLoop = useCallback((timestamp: number) => {
    const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    update(delta);
    draw();
    const s = getState();
    setDisplayState({
      phase: s.phase,
      power: s.power,
      nightTimer: s.nightTimer,
      nightDuration: s.nightDuration,
      leftDoorClosed: s.leftDoorClosed,
      rightDoorClosed: s.rightDoorClosed,
      currentView: s.currentView,
      nightsSurvived: s.nightsSurvived,
      message: s.message,
    });
    if (s.phase === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [update, draw, getState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') toggleLeftDoor();
      if (e.key === 'd' || e.key === 'D') toggleRightDoor();
      if (e.key === '0') setView('office');
      if (e.key === '1') setView('cam1');
      if (e.key === '2') setView('cam2');
      if (e.key === '3') setView('cam3');
      if (e.key === '4') setView('cam4');
    };
    window.addEventListener('keydown', onKeyDown);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, [toggleLeftDoor, toggleRightDoor, setView, gameLoop]);

  const handleRestart = () => {
    restart();
    setScoreSubmitted(false);
    setDisplayState(prev => ({ ...prev, phase: 'playing', power: 100, nightTimer: 0, message: '' }));
    cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  const timeProgress = displayState.nightTimer / displayState.nightDuration;
  const currentHour = Math.floor(12 + timeProgress * 6);
  const displayHour = currentHour > 12 ? currentHour - 12 : currentHour;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-lg text-neon-pink tracking-widest">FIVE NIGHTS AT FREDDY'S</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full rounded-xl border-2 border-neon-pink/40"
              style={{ imageRendering: 'pixelated', maxHeight: '60vh', objectFit: 'contain' }}
            />

            {/* Game Over / Win overlay */}
            {(displayState.phase === 'game-over' || displayState.phase === 'win') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-xl">
                <p className={`font-pixel text-2xl mb-2 ${displayState.phase === 'win' ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {displayState.phase === 'win' ? '🌅 6 AM! YOU SURVIVED!' : '💀 GAME OVER'}
                </p>
                <p className="font-pixel text-sm text-arcade-muted mb-2">{displayState.message}</p>
                <p className="font-pixel text-xs text-neon-yellow mb-6">NIGHTS SURVIVED: {displayState.nightsSurvived}</p>
                {displayState.phase === 'win' && !scoreSubmitted && (
                  <div className="mb-4 w-72">
                    <ScoreSubmission
                      game="fnaf"
                      score={displayState.nightsSurvived}
                      label="SAVE NIGHTS"
                      scoreSuffix="nights"
                      onSubmitted={() => setScoreSubmitted(true)}
                    />
                  </div>
                )}
                <button onClick={handleRestart} className="btn-neon-pink font-pixel text-sm px-6 py-3 rounded-lg tracking-widest">
                  ▶ NEXT NIGHT
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Door controls */}
            <div className="flex gap-2">
              <button
                onClick={toggleLeftDoor}
                className={`flex-1 font-pixel text-xs py-3 rounded-lg border-2 tracking-wider transition-all ${displayState.leftDoorClosed ? 'border-neon-green text-neon-green' : 'border-neon-pink text-neon-pink'}`}
              >
                {displayState.leftDoorClosed ? '🔒 LEFT' : '🔓 LEFT'}
              </button>
              <button
                onClick={toggleRightDoor}
                className={`flex-1 font-pixel text-xs py-3 rounded-lg border-2 tracking-wider transition-all ${displayState.rightDoorClosed ? 'border-neon-green text-neon-green' : 'border-neon-pink text-neon-pink'}`}
              >
                {displayState.rightDoorClosed ? '🔒 RIGHT' : '🔓 RIGHT'}
              </button>
            </div>

            {/* Camera buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => setView('office')}
                className={`flex-1 font-pixel text-[9px] py-2 rounded border tracking-wider transition-all ${displayState.currentView === 'office' ? 'border-neon-yellow text-neon-yellow' : 'border-arcade-border text-arcade-muted'}`}
              >
                OFFICE
              </button>
              {CAMERA_IDS.map((cam) => (
                <button
                  key={cam}
                  onClick={() => setView(cam)}
                  className={`flex-1 font-pixel text-[9px] py-2 rounded border tracking-wider transition-all ${displayState.currentView === cam ? 'border-neon-cyan text-neon-cyan' : 'border-arcade-border text-arcade-muted'}`}
                >
                  {cam.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-3 bg-arcade-card rounded-xl border border-neon-pink/20 p-3 flex items-center justify-between">
            <div>
              <p className="font-pixel text-[10px] text-arcade-muted">POWER</p>
              <div className="w-32 h-3 bg-arcade-bg rounded-full overflow-hidden border border-arcade-border mt-1">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${displayState.power}%`,
                    backgroundColor: displayState.power > 50 ? '#00ff88' : displayState.power > 25 ? '#ffcc00' : '#ff3333',
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="font-pixel text-xs text-neon-yellow">{displayHour === 0 ? 12 : displayHour}:00 AM</p>
              <p className="font-pixel text-[9px] text-arcade-muted">SURVIVE TO 6AM</p>
            </div>
            <div className="text-right">
              <p className="font-pixel text-[10px] text-arcade-muted">KEYBOARD</p>
              <p className="font-pixel text-[9px] text-arcade-muted">A=LEFT D=RIGHT</p>
              <p className="font-pixel text-[9px] text-arcade-muted">0-4=CAMERAS</p>
            </div>
          </div>
        </div>

        <div className="lg:w-64">
          <Leaderboard game="fnaf" title="NIGHTS SURVIVED" accentColor="neon-pink" />
        </div>
      </div>
    </div>
  );
}
