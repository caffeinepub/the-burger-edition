import React from 'react';
import type { WeaponState, LevelProgress, LevelDefinition } from '../hooks/useF19FlightSimulatorGame';
import { Clock, Crosshair, TrendingUp, Shield } from 'lucide-react';

interface F19HUDProps {
  speed: number;
  altitude: number;
  throttle: number;
  fuel: number;
  score: number;
  weaponState: WeaponState;
  onOpenShop: () => void;
  gameMode?: 'tutorial' | 'level' | 'freeplay';
  levelProgress?: LevelProgress | null;
  levelDef?: LevelDefinition | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function F19HUD({
  speed,
  altitude,
  throttle,
  fuel,
  score,
  weaponState,
  onOpenShop,
  gameMode = 'freeplay',
  levelProgress,
  levelDef,
}: F19HUDProps) {
  const hudStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    color: '#00ff41',
    textShadow: '0 0 8px rgba(0,255,65,0.8)',
    fontSize: '10px',
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(0, 10, 0, 0.75)',
    border: '1px solid rgba(0, 255, 65, 0.3)',
    borderRadius: '2px',
    padding: '8px 10px',
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={hudStyle}>
      {/* Top-left: Flight data */}
      <div className="absolute top-4 left-4 space-y-1" style={panelStyle}>
        <div>SPD: {Math.round(speed * 100)} KTS</div>
        <div>ALT: {Math.round(altitude * 10)} FT</div>
        <div>THR: {Math.round(throttle * 100)}%</div>
        <div style={{ color: fuel < 20 ? '#ff2222' : '#00ff41' }}>
          FUEL: {Math.round(fuel)}%
        </div>
        <div>SCR: {score}</div>
      </div>

      {/* Top-right: Weapons + Coins */}
      <div className="absolute top-4 right-4 text-right space-y-1" style={panelStyle}>
        <div style={{ color: '#ffcc00' }}>⬡ {weaponState.coins}</div>
        <div style={{ color: weaponState.missileAmmo === 0 ? '#ff2222' : '#00ff41' }}>
          MSL: {weaponState.missileAmmo}
        </div>
        <div style={{ color: weaponState.flareCount === 0 ? '#ff2222' : '#ff8800' }}>
          FLR: {weaponState.flareCount}
        </div>
        {weaponState.targetLockActive && (
          <div style={{ color: weaponState.lockProgress >= 1 ? '#ff2222' : '#ffff00' }}>
            {weaponState.lockProgress >= 1 ? '🎯 LOCKED' : `LOCKING ${Math.round(weaponState.lockProgress * 100)}%`}
          </div>
        )}
        <button
          className="pointer-events-auto mt-1 px-2 py-1 text-xs border border-yellow-600 text-yellow-400 hover:bg-yellow-900/40 transition-colors"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
          onClick={onOpenShop}
        >
          SHOP
        </button>
      </div>

      {/* Level objectives panel (top-center-right) */}
      {gameMode === 'level' && levelProgress && levelDef && (
        <div
          className="absolute top-4"
          style={{
            ...panelStyle,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: '200px',
          }}
        >
          <div
            className="text-center mb-2"
            style={{ color: '#ffcc00', fontSize: '8px', borderBottom: '1px solid rgba(0,255,65,0.2)', paddingBottom: '4px' }}
          >
            LVL {levelDef.id}: {levelDef.name.toUpperCase()}
          </div>
          {levelProgress.objectives.map((obj, i) => {
            const isProtect = obj.type === 'protect';
            const current = isProtect ? levelProgress.protectHP : obj.current;
            const target = obj.target;
            const pct = Math.min(1, current / target);
            const met = isProtect ? levelProgress.protectHP > 0 : current >= target;

            return (
              <div key={i} className="mb-1">
                <div className="flex items-center gap-1 mb-0.5">
                  {obj.type === 'survive' && <Clock size={8} style={{ color: '#00ccff' }} />}
                  {obj.type === 'destroy' && <Crosshair size={8} style={{ color: '#ff4444' }} />}
                  {obj.type === 'score' && <TrendingUp size={8} style={{ color: '#ffcc00' }} />}
                  {obj.type === 'protect' && <Shield size={8} style={{ color: '#4488ff' }} />}
                  <span style={{ fontSize: '7px', color: met ? '#00ff41' : '#aaaaaa' }}>
                    {obj.type === 'survive'
                      ? `${formatTime(current)} / ${formatTime(target)}`
                      : obj.type === 'protect'
                      ? `HP: ${Math.round(levelProgress.protectHP)}%`
                      : `${Math.round(current)} / ${target}`}
                  </span>
                  {met && <span style={{ color: '#00ff41', fontSize: '7px' }}>✓</span>}
                </div>
                <div style={{ height: '3px', background: 'rgba(0,255,65,0.1)', borderRadius: '1px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct * 100}%`,
                      background: met ? '#00ff41' : obj.type === 'protect' ? '#4488ff' : '#00cc33',
                      borderRadius: '1px',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {/* Time remaining */}
          {levelDef.timeLimit && (
            <div
              className="mt-1 text-center"
              style={{
                fontSize: '8px',
                color: levelProgress.timeRemaining < 30 ? '#ff2222' : '#888888',
                borderTop: '1px solid rgba(0,255,65,0.1)',
                paddingTop: '3px',
              }}
            >
              ⏱ {formatTime(levelProgress.timeRemaining)}
            </div>
          )}
        </div>
      )}

      {/* Bottom: Controls reference */}
      <div
        className="absolute bottom-4 left-4 space-y-0.5"
        style={{ ...panelStyle, fontSize: '8px', color: 'rgba(0,255,65,0.5)' }}
      >
        <div>W/S: PITCH  A/D: ROLL</div>
        <div>SHIFT/CTRL: THROTTLE</div>
        <div>SPACE/F: FIRE  T: LOCK</div>
        <div>C: FLARE</div>
      </div>

      {/* Lock-on reticle */}
      {weaponState.targetLockActive && (
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            border: `2px solid ${weaponState.lockProgress >= 1 ? '#ff2222' : '#ffff00'}`,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${weaponState.lockProgress >= 1 ? '#ff2222' : '#ffff00'}`,
            opacity: 0.8,
          }}
        >
          {/* Corner brackets */}
          {[
            { top: -4, left: -4, borderRight: 'none', borderBottom: 'none' },
            { top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' },
            { bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' },
            { bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' },
          ].map((style, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                border: `2px solid ${weaponState.lockProgress >= 1 ? '#ff2222' : '#ffff00'}`,
                ...style,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
