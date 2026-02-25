import { useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Target } from 'lucide-react';
import { useStickmanArchersGame, type GameMode } from '../hooks/useStickmanArchersGame';

// Canvas dimensions (must match hook constants)
const CANVAS_W = 700;
const CANVAS_H = 350;
const GROUND_Y = CANVAS_H - 60;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawGround(ctx: CanvasRenderingContext2D) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#0a0a1a');
  sky.addColorStop(1, '#0d1a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  // Stars
  ctx.fillStyle = 'rgba(200,220,255,0.6)';
  const stars = [
    [60, 30], [150, 55], [280, 20], [400, 45], [520, 15], [630, 40],
    [100, 80], [350, 70], [580, 65], [200, 100], [460, 90],
  ];
  for (const [sx, sy] of stars) {
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Ground
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
  groundGrad.addColorStop(0, '#1a3a1a');
  groundGrad.addColorStop(1, '#0d1f0d');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  // Ground line glow
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Distant mountains silhouette
  ctx.fillStyle = '#0f2a0f';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(80, GROUND_Y - 60);
  ctx.lineTo(160, GROUND_Y - 30);
  ctx.lineTo(260, GROUND_Y - 80);
  ctx.lineTo(360, GROUND_Y - 40);
  ctx.lineTo(460, GROUND_Y - 70);
  ctx.lineTo(560, GROUND_Y - 35);
  ctx.lineTo(650, GROUND_Y - 55);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawStickman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingRight: boolean,
  aimAngle: number,
  color: string,
  glowColor: string,
  isHurt: boolean
) {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isHurt ? 20 : 10;
  ctx.strokeStyle = isHurt ? '#ff4444' : color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  const dir = facingRight ? 1 : -1;
  const headY = y - 55;
  const bodyTopY = y - 45;
  const bodyBotY = y - 20;
  const hipY = y - 20;

  // Head
  ctx.beginPath();
  ctx.arc(x, headY, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(x, bodyTopY);
  ctx.lineTo(x, bodyBotY);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x - dir * 12, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x + dir * 8, y);
  ctx.stroke();

  // Arms — bow arm and draw arm
  const aimRad = (aimAngle * Math.PI) / 180;
  const bowArmX = x + dir * 20 * Math.cos(aimRad);
  const bowArmY = bodyTopY + 8 - 20 * Math.sin(aimRad);

  // Draw arm (back)
  ctx.beginPath();
  ctx.moveTo(x, bodyTopY + 8);
  ctx.lineTo(x - dir * 14, bodyTopY + 18);
  ctx.stroke();

  // Bow arm (front)
  ctx.beginPath();
  ctx.moveTo(x, bodyTopY + 8);
  ctx.lineTo(bowArmX, bowArmY);
  ctx.stroke();

  // Bow
  ctx.strokeStyle = isHurt ? '#ff4444' : '#c8a060';
  ctx.shadowColor = '#c8a060';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2.5;
  const bowStartAngle = aimRad - 0.7;
  const bowEndAngle = aimRad + 0.7;
  ctx.beginPath();
  ctx.arc(bowArmX, bowArmY, 14, dir > 0 ? Math.PI + bowStartAngle : -bowEndAngle, dir > 0 ? Math.PI + bowEndAngle : -bowStartAngle);
  ctx.stroke();

  // Bowstring
  ctx.strokeStyle = isHurt ? '#ff4444' : color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 4;
  ctx.lineWidth = 1.5;
  const bsX1 = bowArmX + 14 * Math.cos(dir > 0 ? Math.PI + bowStartAngle : -bowEndAngle);
  const bsY1 = bowArmY + 14 * Math.sin(dir > 0 ? Math.PI + bowStartAngle : -bowEndAngle);
  const bsX2 = bowArmX + 14 * Math.cos(dir > 0 ? Math.PI + bowEndAngle : -bowStartAngle);
  const bsY2 = bowArmY + 14 * Math.sin(dir > 0 ? Math.PI + bowEndAngle : -bowStartAngle);
  ctx.beginPath();
  ctx.moveTo(bsX1, bsY1);
  ctx.lineTo(bsX2, bsY2);
  ctx.stroke();

  // Aim indicator line
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(bowArmX, bowArmY);
  ctx.lineTo(bowArmX + dir * 50 * Math.cos(aimRad), bowArmY - 50 * Math.sin(aimRad));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, vx: number, vy: number, fromP1: boolean) {
  ctx.save();
  const angle = Math.atan2(vy, vx);
  ctx.translate(x, y);
  ctx.rotate(angle);

  const color = fromP1 ? '#39ff14' : '#ff2d78';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // Shaft
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(4, -3);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();

  // Fletching
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-14, -4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-14, 4);
  ctx.stroke();

  ctx.restore();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  health: number,
  maxHealth: number,
  color: string,
  label: string,
  alignRight: boolean
) {
  const barW = 140;
  const barH = 14;
  const bx = alignRight ? x - barW : x;
  const by = 14;

  // Label
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.fillText(label, alignRight ? x : x, by - 2);
  ctx.shadowBlur = 0;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by + 4, barW, barH, 3);
  ctx.fill();
  ctx.stroke();

  // Health fill
  const pct = health / maxHealth;
  const fillColor = pct > 0.5 ? color : pct > 0.25 ? '#ffaa00' : '#ff3333';
  ctx.fillStyle = fillColor;
  ctx.shadowColor = fillColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(bx + 1, by + 5, Math.max(0, (barW - 2) * pct), barH - 2, 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // HP text
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${health}`, bx + barW / 2, by + barH - 1);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StickmanArchersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useStickmanArchersGame();
  const {
    stateRef, phase, winner, mode, aim1, aim2, health1, health2,
    startGame, restartGame, adjustAim, shootArrow,
    handleKeyDown, handleKeyUp, tick,
    ARCHER_HEALTH,
  } = game;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = stateRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawGround(ctx);

    // Health bars
    drawHealthBar(ctx, 10, state.archer1.health, ARCHER_HEALTH, '#39ff14', 'P1', false);
    drawHealthBar(ctx, CANVAS_W - 10, state.archer2.health, ARCHER_HEALTH, '#ff2d78', state.mode === 'single' ? 'CPU' : 'P2', true);

    // VS divider
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText('VS', CANVAS_W / 2, 24);
    ctx.shadowBlur = 0;

    // Archers
    const isHurt1 = state.archer1.health < ARCHER_HEALTH;
    const isHurt2 = state.archer2.health < ARCHER_HEALTH;
    drawStickman(ctx, state.archer1.x, state.archer1.y, true, state.archer1.aimAngle, '#39ff14', '#39ff14', isHurt1 && state.archer1.health < 50);
    drawStickman(ctx, state.archer2.x, state.archer2.y, false, state.archer2.aimAngle, '#ff2d78', '#ff2d78', isHurt2 && state.archer2.health < 50);

    // Arrows
    for (const arrow of state.arrows) {
      if (arrow.active) {
        drawArrow(ctx, arrow.x, arrow.y, arrow.vx, arrow.vy, arrow.fromPlayer1);
      }
    }
  }, [stateRef, ARCHER_HEALTH]);

  // Animation loop
  const rafRef = useRef<number | null>(null);
  const loopActive = useRef(false);

  const loop = useCallback(() => {
    if (!loopActive.current) return;
    tick();
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [tick, draw]);

  useEffect(() => {
    if (phase === 'playing') {
      loopActive.current = true;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      loopActive.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      draw(); // draw final state
    }
    return () => {
      loopActive.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, loop, draw]);

  // Keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  const handleModeSelect = (m: GameMode) => {
    startGame(m);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-pixel text-xs text-arcade-muted hover:text-neon-cyan transition-colors mb-6 tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> BACK TO LOBBY
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <Target className="w-6 h-6 text-neon-cyan" />
        <h1 className="font-pixel text-2xl text-neon-cyan drop-shadow-neon-cyan tracking-widest">
          STICKMAN ARCHERS
        </h1>
      </div>
      <p className="text-arcade-muted text-sm mb-6 font-sans">
        Aim your bow and shoot arrows to defeat your opponent!
      </p>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Game area */}
        <div className="flex flex-col items-center gap-4 w-full xl:flex-1">
          {/* Mode selector + restart */}
          <div className="flex items-center gap-3 w-full justify-between flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => handleModeSelect('single')}
                className={`font-pixel text-[10px] px-3 py-1.5 rounded border tracking-wider transition-all ${
                  mode === 'single'
                    ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                    : 'border-arcade-muted/40 text-arcade-muted hover:border-neon-cyan/50 hover:text-neon-cyan/70'
                }`}
              >
                VS CPU
              </button>
              <button
                onClick={() => handleModeSelect('two-player')}
                className={`font-pixel text-[10px] px-3 py-1.5 rounded border tracking-wider transition-all ${
                  mode === 'two-player'
                    ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
                    : 'border-arcade-muted/40 text-arcade-muted hover:border-neon-pink/50 hover:text-neon-pink/70'
                }`}
              >
                2 PLAYER
              </button>
            </div>
            <button
              onClick={restartGame}
              className="font-pixel text-[10px] px-3 py-1.5 rounded border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-colors tracking-wider flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> RESTART
            </button>
          </div>

          {/* Canvas wrapper */}
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-xl border-2 border-neon-cyan/40 block w-full"
              style={{ imageRendering: 'pixelated', maxWidth: CANVAS_W }}
              tabIndex={0}
            />

            {/* Start overlay */}
            {phase === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/85 rounded-xl gap-5">
                <p className="font-pixel text-neon-cyan text-xl tracking-widest drop-shadow-neon-cyan">
                  STICKMAN ARCHERS
                </p>
                <p className="font-pixel text-arcade-muted text-[10px] tracking-wider text-center px-8">
                  Choose your mode and battle!
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <button
                    onClick={() => handleModeSelect('single')}
                    className="btn-neon-cyan font-pixel text-xs px-6 py-3 rounded-lg tracking-widest"
                  >
                    ▶ VS CPU
                  </button>
                  <button
                    onClick={() => handleModeSelect('two-player')}
                    className="btn-neon-pink font-pixel text-xs px-6 py-3 rounded-lg tracking-widest"
                  >
                    ▶ 2 PLAYER
                  </button>
                </div>
              </div>
            )}

            {/* Game over overlay */}
            {phase === 'gameover' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-arcade-bg/90 rounded-xl gap-4">
                <p className="font-pixel text-neon-yellow text-2xl tracking-widest drop-shadow-neon-yellow">
                  GAME OVER
                </p>
                <p className="font-pixel text-lg tracking-wider">
                  {winner === 1 ? (
                    <span className="text-neon-green drop-shadow-neon-green">PLAYER 1 WINS! 🏆</span>
                  ) : (
                    <span className="text-neon-pink drop-shadow-neon-pink">
                      {mode === 'single' ? 'CPU WINS! 🤖' : 'PLAYER 2 WINS! 🏆'}
                    </span>
                  )}
                </p>
                <button
                  onClick={restartGame}
                  className="btn-neon-cyan font-pixel text-sm px-8 py-3 rounded-lg tracking-widest mt-2"
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />PLAY AGAIN
                </button>
              </div>
            )}
          </div>

          {/* Mobile / on-screen controls */}
          <div className="w-full grid grid-cols-2 gap-4 mt-1">
            {/* Player 1 controls */}
            <div className="bg-arcade-card rounded-xl border border-neon-green/30 p-3">
              <p className="font-pixel text-[9px] text-neon-green mb-2 tracking-wider text-center">
                PLAYER 1
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[8px] text-arcade-muted">AIM</span>
                  <button
                    onPointerDown={() => adjustAim(1, -3)}
                    className="w-9 h-9 flex items-center justify-center rounded border border-neon-green/40 text-neon-green font-pixel text-sm hover:bg-neon-green/10 active:bg-neon-green/20 transition-all"
                  >
                    ▲
                  </button>
                  <button
                    onPointerDown={() => adjustAim(1, 3)}
                    className="w-9 h-9 flex items-center justify-center rounded border border-neon-green/40 text-neon-green font-pixel text-sm hover:bg-neon-green/10 active:bg-neon-green/20 transition-all"
                  >
                    ▼
                  </button>
                  <span className="font-pixel text-[8px] text-neon-green w-8 text-center">{aim1}°</span>
                </div>
                <button
                  onPointerDown={() => shootArrow(1)}
                  className="btn-neon-green font-pixel text-[9px] px-4 py-2 rounded-lg tracking-widest w-full"
                >
                  🏹 SHOOT
                </button>
                <p className="font-pixel text-[7px] text-arcade-muted tracking-wider">W/S + SPACE</p>
              </div>
            </div>

            {/* Player 2 / CPU controls */}
            <div className="bg-arcade-card rounded-xl border border-neon-pink/30 p-3">
              <p className="font-pixel text-[9px] text-neon-pink mb-2 tracking-wider text-center">
                {mode === 'single' ? 'CPU' : 'PLAYER 2'}
              </p>
              {mode === 'two-player' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[8px] text-arcade-muted">AIM</span>
                    <button
                      onPointerDown={() => adjustAim(2, -3)}
                      className="w-9 h-9 flex items-center justify-center rounded border border-neon-pink/40 text-neon-pink font-pixel text-sm hover:bg-neon-pink/10 active:bg-neon-pink/20 transition-all"
                    >
                      ▲
                    </button>
                    <button
                      onPointerDown={() => adjustAim(2, 3)}
                      className="w-9 h-9 flex items-center justify-center rounded border border-neon-pink/40 text-neon-pink font-pixel text-sm hover:bg-neon-pink/10 active:bg-neon-pink/20 transition-all"
                    >
                      ▼
                    </button>
                    <span className="font-pixel text-[8px] text-neon-pink w-8 text-center">{aim2}°</span>
                  </div>
                  <button
                    onPointerDown={() => shootArrow(2)}
                    className="btn-neon-pink font-pixel text-[9px] px-4 py-2 rounded-lg tracking-widest w-full"
                  >
                    🏹 SHOOT
                  </button>
                  <p className="font-pixel text-[7px] text-arcade-muted tracking-wider">↑/↓ + ENTER</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
                  <div className="text-3xl">🤖</div>
                  <p className="font-pixel text-[8px] text-arcade-muted text-center tracking-wider">
                    AI CONTROLLED
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
                    <span className="font-pixel text-[7px] text-neon-pink">TARGETING...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health bars display */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-[9px] text-neon-green">P1</span>
                <span className="font-pixel text-[9px] text-neon-green">{health1} HP</span>
              </div>
              <div className="h-3 bg-arcade-card rounded-full border border-neon-green/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(health1 / ARCHER_HEALTH) * 100}%`,
                    backgroundColor: health1 > 50 ? '#39ff14' : health1 > 25 ? '#ffaa00' : '#ff3333',
                    boxShadow: `0 0 8px ${health1 > 50 ? '#39ff14' : health1 > 25 ? '#ffaa00' : '#ff3333'}`,
                  }}
                />
              </div>
            </div>
            <span className="font-pixel text-[10px] text-neon-cyan">VS</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="font-pixel text-[9px] text-neon-pink">{mode === 'single' ? 'CPU' : 'P2'}</span>
                <span className="font-pixel text-[9px] text-neon-pink">{health2} HP</span>
              </div>
              <div className="h-3 bg-arcade-card rounded-full border border-neon-pink/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(health2 / ARCHER_HEALTH) * 100}%`,
                    backgroundColor: health2 > 50 ? '#ff2d78' : health2 > 25 ? '#ffaa00' : '#ff3333',
                    boxShadow: `0 0 8px ${health2 > 50 ? '#ff2d78' : health2 > 25 ? '#ffaa00' : '#ff3333'}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: instructions */}
        <div className="xl:w-64 w-full flex flex-col gap-4">
          <div className="bg-arcade-card rounded-xl border border-neon-cyan/20 p-4">
            <p className="font-pixel text-xs text-neon-cyan mb-3 tracking-wider">HOW TO PLAY</p>
            <ul className="text-arcade-muted text-sm space-y-2 font-sans">
              <li>🏹 Shoot arrows to hit your opponent</li>
              <li>💥 Each hit deals 25 damage</li>
              <li>❤️ First to 0 HP loses</li>
              <li>🎯 Adjust angle for better aim</li>
            </ul>
          </div>

          <div className="bg-arcade-card rounded-xl border border-neon-green/20 p-4">
            <p className="font-pixel text-xs text-neon-green mb-3 tracking-wider">PLAYER 1 KEYS</p>
            <ul className="text-arcade-muted text-sm space-y-1 font-sans">
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-green/30 text-neon-green">W</kbd> Aim up</li>
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-green/30 text-neon-green">S</kbd> Aim down</li>
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-green/30 text-neon-green">SPACE</kbd> Shoot</li>
            </ul>
          </div>

          <div className="bg-arcade-card rounded-xl border border-neon-pink/20 p-4">
            <p className="font-pixel text-xs text-neon-pink mb-3 tracking-wider">PLAYER 2 KEYS</p>
            <p className="text-arcade-muted text-xs font-sans mb-2">(2-player mode only)</p>
            <ul className="text-arcade-muted text-sm space-y-1 font-sans">
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-pink/30 text-neon-pink">↑</kbd> Aim up</li>
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-pink/30 text-neon-pink">↓</kbd> Aim down</li>
              <li><kbd className="font-pixel text-[9px] bg-arcade-surface px-1 py-0.5 rounded border border-neon-pink/30 text-neon-pink">ENTER</kbd> Shoot</li>
            </ul>
          </div>

          <div className="bg-arcade-card rounded-xl border border-neon-yellow/20 p-4">
            <p className="font-pixel text-xs text-neon-yellow mb-3 tracking-wider">TIPS</p>
            <ul className="text-arcade-muted text-sm space-y-1 font-sans">
              <li>🔺 Higher angle = more arc</li>
              <li>🔻 Lower angle = flatter shot</li>
              <li>⏱️ Short cooldown between shots</li>
              <li>🤖 CPU shoots periodically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
