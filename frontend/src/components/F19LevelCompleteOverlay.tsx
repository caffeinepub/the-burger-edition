import React from 'react';
import { CheckCircle, Star, Coins } from 'lucide-react';
import type { LevelProgress, LevelDefinition } from '../hooks/useF19FlightSimulatorGame';

interface F19LevelCompleteOverlayProps {
  levelDef: LevelDefinition;
  levelProgress: LevelProgress;
  finalScore: number;
  onNextLevel: () => void;
  onExit: () => void;
  hasNextLevel: boolean;
}

export default function F19LevelCompleteOverlay({
  levelDef,
  levelProgress,
  finalScore,
  onNextLevel,
  onExit,
  hasNextLevel,
}: F19LevelCompleteOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div
        className="max-w-md w-full mx-4 p-6 rounded"
        style={{
          background: 'rgba(0, 8, 0, 0.98)',
          border: '2px solid #00ff41',
          boxShadow: '0 0 50px rgba(0,255,65,0.4)',
        }}
      >
        {/* Title */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🏆</div>
          <h2
            className="text-green-300 text-lg mb-1"
            style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '0 0 20px rgba(0,255,65,0.7)' }}
          >
            MISSION COMPLETE
          </h2>
          <div
            className="text-green-600 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {levelDef.name.toUpperCase()}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="p-3 rounded text-center"
            style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.2)' }}
          >
            <div
              className="text-green-600 text-xs mb-1"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
            >
              FINAL SCORE
            </div>
            <div
              className="text-green-300 text-sm"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {finalScore.toLocaleString()}
            </div>
          </div>
          <div
            className="p-3 rounded text-center"
            style={{ background: 'rgba(255,200,0,0.05)', border: '1px solid rgba(255,200,0,0.2)' }}
          >
            <div
              className="text-yellow-600 text-xs mb-1"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
            >
              COINS EARNED
            </div>
            <div
              className="text-yellow-300 text-sm"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              +{levelProgress.coinsEarnedThisLevel}
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-5">
          <div
            className="text-green-700 text-xs mb-2"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
          >
            OBJECTIVES
          </div>
          <div className="space-y-2">
            {levelProgress.objectives.map((obj, i) => {
              const met = obj.type === 'protect'
                ? levelProgress.protectHP > 0
                : obj.current >= obj.target;
              return (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    className={met ? 'text-green-400' : 'text-gray-600'}
                  />
                  <span
                    className={`text-xs ${met ? 'text-green-400' : 'text-gray-600'}`}
                    style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
                  >
                    {obj.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 border border-gray-700 text-gray-500 text-xs rounded hover:border-gray-500 hover:text-gray-400 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            MENU
          </button>
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex-grow py-3 border border-green-500 text-green-400 text-xs rounded hover:bg-green-900/40 transition-colors"
              style={{
                fontFamily: "'Press Start 2P', monospace",
                boxShadow: '0 0 15px rgba(0,255,65,0.3)',
              }}
            >
              NEXT LEVEL →
            </button>
          )}
          {!hasNextLevel && (
            <button
              onClick={onExit}
              className="flex-grow py-3 border border-yellow-500 text-yellow-400 text-xs rounded hover:bg-yellow-900/40 transition-colors"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              ALL DONE! 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
