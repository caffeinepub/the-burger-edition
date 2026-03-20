import React from 'react';
import { Star, Target, Clock, Shield, Crosshair, TrendingUp } from 'lucide-react';
import type { LevelDefinition } from '../hooks/useF19FlightSimulatorGame';

interface F19LevelStartOverlayProps {
  levelDef: LevelDefinition;
  onStart: () => void;
  onExit: () => void;
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
  survive: <Clock size={14} className="text-cyan-400" />,
  destroy: <Crosshair size={14} className="text-red-400" />,
  score: <TrendingUp size={14} className="text-yellow-400" />,
  protect: <Shield size={14} className="text-blue-400" />,
};

export default function F19LevelStartOverlay({ levelDef, onStart, onExit }: F19LevelStartOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div
        className="max-w-lg w-full mx-4 p-6 rounded"
        style={{
          background: 'rgba(0, 8, 0, 0.98)',
          border: '2px solid #00cc33',
          boxShadow: '0 0 40px rgba(0,204,51,0.3)',
        }}
      >
        {/* Level badge */}
        <div className="text-center mb-4">
          <div
            className="inline-block px-3 py-1 border border-green-700 text-green-600 text-xs mb-3"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            LEVEL {levelDef.id}
          </div>
          <h2
            className="text-green-300 text-xl mb-2"
            style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '0 0 15px rgba(0,255,65,0.5)' }}
          >
            {levelDef.name.toUpperCase()}
          </h2>
          {/* Difficulty */}
          <div className="flex justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < levelDef.difficulty ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
              />
            ))}
          </div>
          <p
            className="text-green-700 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.8', fontSize: '9px' }}
          >
            {levelDef.description}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-green-900 my-4" />

        {/* Objectives */}
        <div className="mb-5">
          <div
            className="text-green-600 text-xs mb-3 flex items-center gap-2"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <Target size={12} />
            MISSION OBJECTIVES
          </div>
          <div className="space-y-2">
            {levelDef.objectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded"
                style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.1)' }}
              >
                {OBJECTIVE_ICONS[obj.type]}
                <span
                  className="text-green-400 text-xs"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px' }}
                >
                  {obj.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Enemy info */}
        <div className="mb-5 px-3 py-2 rounded" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
          <div
            className="text-red-600 text-xs mb-1"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
          >
            THREAT ASSESSMENT
          </div>
          <div
            className="text-red-400 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: '1.8' }}
          >
            {levelDef.enemyConfig.count} enemies • Types: {levelDef.enemyConfig.types.join(', ')}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 border border-gray-700 text-gray-500 text-xs rounded hover:border-gray-500 hover:text-gray-400 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ← BACK
          </button>
          <button
            onClick={onStart}
            className="flex-2 flex-grow py-3 border border-green-500 text-green-400 text-xs rounded hover:bg-green-900/40 transition-colors"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: '0 0 15px rgba(0,255,65,0.3)',
            }}
          >
            ▶ LAUNCH MISSION
          </button>
        </div>
      </div>
    </div>
  );
}
