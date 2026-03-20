import React from 'react';
import { XCircle, RotateCcw, Home } from 'lucide-react';
import type { LevelDefinition } from '../hooks/useF19FlightSimulatorGame';

interface F19LevelFailedOverlayProps {
  levelDef: LevelDefinition;
  failReason: string;
  onRetry: () => void;
  onExit: () => void;
}

export default function F19LevelFailedOverlay({
  levelDef,
  failReason,
  onRetry,
  onExit,
}: F19LevelFailedOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
    >
      <div
        className="max-w-md w-full mx-4 p-6 rounded"
        style={{
          background: 'rgba(8, 0, 0, 0.98)',
          border: '2px solid #ff2222',
          boxShadow: '0 0 50px rgba(255,34,34,0.4)',
        }}
      >
        {/* Title */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">💥</div>
          <h2
            className="text-red-400 text-lg mb-1"
            style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '0 0 20px rgba(255,34,34,0.7)' }}
          >
            MISSION FAILED
          </h2>
          <div
            className="text-red-700 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {levelDef.name.toUpperCase()}
          </div>
        </div>

        {/* Fail reason */}
        <div
          className="mb-5 p-3 rounded text-center"
          style={{ background: 'rgba(255,34,34,0.08)', border: '1px solid rgba(255,34,34,0.2)' }}
        >
          <div
            className="text-red-600 text-xs mb-1"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
          >
            CAUSE OF FAILURE
          </div>
          <div
            className="text-red-400 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.8' }}
          >
            {failReason}
          </div>
        </div>

        {/* Tips */}
        <div
          className="mb-5 p-3 rounded"
          style={{ background: 'rgba(255,165,0,0.05)', border: '1px solid rgba(255,165,0,0.1)' }}
        >
          <div
            className="text-orange-600 text-xs mb-2"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
          >
            PILOT TIP
          </div>
          <div
            className="text-orange-700 text-xs"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: '1.8' }}
          >
            {failReason.includes('missile') || failReason.includes('Missile')
              ? 'Deploy flares (C) to decoy incoming missiles!'
              : failReason.includes('carrier') || failReason.includes('Carrier')
              ? 'Prioritize enemies targeting the carrier first!'
              : failReason.includes('Time') || failReason.includes('time')
              ? 'Increase throttle (SHIFT) to engage enemies faster!'
              : 'Stay above terrain and manage your throttle carefully.'}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 border border-gray-700 text-gray-500 text-xs rounded hover:border-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <Home size={12} />
            MENU
          </button>
          <button
            onClick={onRetry}
            className="flex-grow py-3 border border-red-500 text-red-400 text-xs rounded hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              boxShadow: '0 0 15px rgba(255,34,34,0.3)',
            }}
          >
            <RotateCcw size={12} />
            RETRY
          </button>
        </div>
      </div>
    </div>
  );
}
