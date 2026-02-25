import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useMinecraftClassicGame, BlockType } from '../hooks/useMinecraftClassicGame';

const CANVAS_W = 800;
const CANVAS_H = 480;
const TILE = 32;

const BLOCK_NAMES: Record<BlockType, string> = {
  0: 'AIR',
  1: 'DIRT',
  2: 'STONE',
  3: 'WOOD',
  4: 'LEAVES',
};

export default function MinecraftClassicGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { getState, pressKey, releaseKey, selectHotbar, mineBlock, placeBlock, update, BLOCK_COLORS } = useMinecraftClassicGame();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = getState();

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H - 60);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H - 60);
    sky.addColorStop(0, '#0d1b3e');
    sky.addColorStop(1, '#1a3a6e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H - 60);

    const camTileX = s.cameraX;
    const camTileY = s.cameraY;
    const visW = Math.ceil(CANVAS_W / TILE) + 2;
    const visH = Math.ceil((CANVAS_H - 60) / TILE) + 2;

    // Draw world tiles
    for (let ty = Math.floor(camTileY); ty < Math.floor(camTileY) + visH; ty++) {
      for (let tx = Math.floor(camTileX); tx < Math.floor(camTileX) + visW; tx++) {
        if (tx < 0 || tx >= s.worldW || ty < 0 || ty >= s.worldH) continue;
        const block = s.world[ty][tx];
        if (block === 0) continue;
        const colors = BLOCK_COLORS[block];
        const sx = Math.round((tx - camTileX) * TILE);
        const sy = Math.round((ty - camTileY) * TILE);
        ctx.fillStyle = colors[0];
        ctx.fillRect(sx, sy, TILE, TILE);
        // Highlight top
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sx, sy, TILE, 4);
        // Shadow bottom-right
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(sx, sy + TILE - 4, TILE, 4);
        ctx.fillRect(sx + TILE - 4, sy, 4, TILE);
        // Grid line
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, TILE, TILE);
      }
    }

    // Draw player
    const px = Math.round((s.playerX - camTileX) * TILE);
    const py = Math.round((s.playerY - camTileY) * TILE);
    const pw = Math.round(1.5 * TILE);
    const ph = Math.round(2 * TILE);
    // Body
    ctx.fillStyle = '#3a7bd5';
    ctx.fillRect(px, py + ph * 0.4, pw, ph * 0.6);
    // Head
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(px + pw * 0.1, py, pw * 0.8, ph * 0.45);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(px + pw * 0.2, py + ph * 0.1, pw * 0.15, ph * 0.12);
    ctx.fillRect(px + pw * 0.55, py + ph * 0.1, pw * 0.15, ph * 0.12);
    // Legs
    ctx.fillStyle = '#1a3a6e';
    ctx.fillRect(px + 2, py + ph * 0.85, pw * 0.4, ph * 0.15);
    ctx.fillRect(px + pw * 0.55, py + ph * 0.85, pw * 0.4, ph * 0.15);

    // Hotbar
    const hotbarY = CANVAS_H - 56;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, hotbarY, CANVAS_W, 56);

    const slotSize = 48;
    const hotbarX = (CANVAS_W - s.hotbar.length * (slotSize + 4)) / 2;

    for (let i = 0; i < s.hotbar.length; i++) {
      const sx = hotbarX + i * (slotSize + 4);
      const sy = hotbarY + 4;
      const isSelected = i === s.hotbarIndex;

      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(sx, sy, slotSize, slotSize);
      ctx.strokeStyle = isSelected ? '#00ff88' : '#444';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(sx, sy, slotSize, slotSize);

      const block = s.hotbar[i];
      if (block !== 0) {
        const colors = BLOCK_COLORS[block];
        ctx.fillStyle = colors[0];
        ctx.fillRect(sx + 6, sy + 6, slotSize - 12, slotSize - 12);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sx + 6, sy + 6, slotSize - 12, 4);
      }

      // Slot number
      ctx.fillStyle = '#aaa';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText(`${i + 1}`, sx + 3, sy + 12);
    }

    // Selected block name
    const selBlock = s.hotbar[s.hotbarIndex];
    ctx.fillStyle = '#00ff88';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(BLOCK_NAMES[selBlock], CANVAS_W / 2, hotbarY - 8);
    ctx.textAlign = 'left';

    // Instructions overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(4, 4, 200, 50);
    ctx.fillStyle = '#aaa';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('LEFT CLICK: Mine', 10, 18);
    ctx.fillText('RIGHT CLICK: Place', 10, 32);
    ctx.fillText('1-4: Select Block', 10, 46);
  }, [getState, BLOCK_COLORS]);

  const gameLoop = useCallback(() => {
    update();
    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressKey(e.key);
      if (['1', '2', '3', '4'].includes(e.key)) {
        selectHotbar(parseInt(e.key) - 1);
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => releaseKey(e.key);

    const onMouseDown = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = (CANVAS_H - 60) / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      if (e.button === 0) {
        mineBlock(cx, cy, CANVAS_W, CANVAS_H);
      } else if (e.button === 2) {
        placeBlock(cx, cy);
      }
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvasRef.current?.addEventListener('mousedown', onMouseDown);
    canvasRef.current?.addEventListener('contextmenu', onContextMenu);

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      canvasRef.current?.removeEventListener('contextmenu', onContextMenu);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pressKey, releaseKey, selectHotbar, mineBlock, placeBlock, gameLoop]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate({ to: '/' })} className="text-arcade-muted hover:text-neon-green transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-xl text-neon-green tracking-widest">MINECRAFT CLASSIC</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-xl border-2 border-neon-green/40 cursor-crosshair"
            style={{ imageRendering: 'pixelated', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>

        <div className="lg:w-64 space-y-4">
          <div className="bg-arcade-card rounded-xl border border-neon-green/20 p-4">
            <p className="font-pixel text-xs text-neon-green mb-3 tracking-wider">CONTROLS</p>
            <div className="space-y-1 text-xs text-arcade-muted font-sans">
              <p>← → / A D — Move</p>
              <p>↑ / W / Space — Jump</p>
              <p>Left Click — Mine block</p>
              <p>Right Click — Place block</p>
              <p>1 / 2 / 3 / 4 — Select block</p>
            </div>
          </div>
          <div className="bg-arcade-card rounded-xl border border-neon-green/20 p-4">
            <p className="font-pixel text-xs text-neon-green mb-3 tracking-wider">BLOCKS</p>
            <div className="space-y-2">
              {([1, 2, 3, 4] as BlockType[]).map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border border-arcade-border" style={{ backgroundColor: BLOCK_COLORS[b][0] }} />
                  <span className="font-pixel text-[10px] text-arcade-muted">{BLOCK_NAMES[b]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
