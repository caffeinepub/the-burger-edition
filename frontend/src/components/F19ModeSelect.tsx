import React from 'react';
import { Lock, Star, Play, BookOpen, Gamepad2, Trophy } from 'lucide-react';
import type { LevelDefinition } from '../hooks/useF19FlightSimulatorGame';

interface F19ModeSelectProps {
  levelDefinitions: LevelDefinition[];
  levelUnlockStatus: boolean[];
  levelBestScores: Record<number, number>;
  tutorialCompleted?: boolean;
  onSelectTutorial: () => void;
  onSelectLevel: (index: number) => void;
  onSelectFreeplay: () => void;
}

export default function F19ModeSelect({
  levelDefinitions,
  levelUnlockStatus,
  levelBestScores,
  tutorialCompleted,
  onSelectTutorial,
  onSelectLevel,
  onSelectFreeplay,
}: F19ModeSelectProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start py-8 px-4 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">✈️</div>
        <h1
          className="text-3xl font-bold text-green-400 mb-1"
          style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '0 0 20px #00ff41' }}
        >
          F-19 STEALTH SIM
        </h1>
        <p className="text-green-600 text-sm" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          SELECT MODE
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Tutorial */}
        <div className="border border-green-800 rounded-lg p-5 bg-black/80">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="text-green-400" size={20} />
            <h2
              className="text-green-400 text-sm"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              TUTORIAL
            </h2>
            {tutorialCompleted && (
              <span className="ml-auto text-xs text-green-600" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                ✓ COMPLETED
              </span>
            )}
          </div>
          <p className="text-green-700 text-xs mb-4" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.8' }}>
            Learn all flight mechanics step-by-step: movement, throttle, shooting, lock-on, dodging, and flares.
          </p>
          <button
            onClick={onSelectTutorial}
            className="w-full py-3 border border-green-500 text-green-400 text-xs rounded hover:bg-green-900/40 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace", boxShadow: '0 0 10px rgba(0,255,65,0.2)' }}
          >
            {tutorialCompleted ? '▶ REPLAY TUTORIAL' : '▶ START TUTORIAL'}
          </button>
        </div>

        {/* Progressive Levels */}
        <div className="border border-green-800 rounded-lg p-5 bg-black/80">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-yellow-400" size={20} />
            <h2
              className="text-yellow-400 text-sm"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CAMPAIGN LEVELS
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {levelDefinitions.map((level, index) => {
              const unlocked = levelUnlockStatus[index] ?? false;
              const bestScore = levelBestScores[index];
              const completed = bestScore !== undefined;

              return (
                <button
                  key={level.id}
                  onClick={() => unlocked && onSelectLevel(index)}
                  disabled={!unlocked}
                  className={`relative p-4 rounded border text-left transition-all ${
                    unlocked
                      ? completed
                        ? 'border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/40 cursor-pointer'
                        : 'border-green-700 bg-green-900/10 hover:bg-green-900/30 cursor-pointer'
                      : 'border-gray-800 bg-gray-900/20 cursor-not-allowed opacity-50'
                  }`}
                  style={unlocked ? { boxShadow: completed ? '0 0 8px rgba(255,200,0,0.15)' : '0 0 8px rgba(0,255,65,0.1)' } : {}}
                >
                  {/* Lock icon */}
                  {!unlocked && (
                    <div className="absolute top-3 right-3">
                      <Lock size={14} className="text-gray-600" />
                    </div>
                  )}
                  {completed && (
                    <div className="absolute top-3 right-3">
                      <span className="text-yellow-400 text-xs">★</span>
                    </div>
                  )}

                  {/* Level number */}
                  <div
                    className={`text-xs mb-1 ${unlocked ? (completed ? 'text-yellow-500' : 'text-green-600') : 'text-gray-600'}`}
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    LVL {level.id}
                  </div>

                  {/* Level name */}
                  <div
                    className={`text-xs font-bold mb-2 ${unlocked ? (completed ? 'text-yellow-300' : 'text-green-300') : 'text-gray-500'}`}
                    style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.5' }}
                  >
                    {level.name}
                  </div>

                  {/* Difficulty stars */}
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={10}
                        className={i < level.difficulty ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                      />
                    ))}
                  </div>

                  {/* Description */}
                  <p
                    className={`text-xs leading-relaxed mb-2 ${unlocked ? 'text-green-700' : 'text-gray-700'}`}
                    style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', lineHeight: '1.6' }}
                  >
                    {level.description}
                  </p>

                  {/* Best score */}
                  {bestScore !== undefined && (
                    <div
                      className="text-yellow-500 text-xs"
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
                    >
                      BEST: {bestScore.toLocaleString()}
                    </div>
                  )}

                  {/* Objectives preview */}
                  <div className="mt-2 space-y-0.5">
                    {level.objectives.slice(0, 2).map((obj, i) => (
                      <div
                        key={i}
                        className={`text-xs ${unlocked ? 'text-green-800' : 'text-gray-700'}`}
                        style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px' }}
                      >
                        • {obj.label}
                      </div>
                    ))}
                    {level.objectives.length > 2 && (
                      <div
                        className={`text-xs ${unlocked ? 'text-green-800' : 'text-gray-700'}`}
                        style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px' }}
                      >
                        +{level.objectives.length - 2} more...
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Freeplay */}
        <div className="border border-cyan-800 rounded-lg p-5 bg-black/80">
          <div className="flex items-center gap-3 mb-3">
            <Gamepad2 className="text-cyan-400" size={20} />
            <h2
              className="text-cyan-400 text-sm"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              FREEPLAY
            </h2>
          </div>
          <p className="text-cyan-700 text-xs mb-4" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.8' }}>
            Sandbox mode — no objectives, no time limits. Fly freely and engage enemies at your own pace.
          </p>
          <button
            onClick={onSelectFreeplay}
            className="w-full py-3 border border-cyan-500 text-cyan-400 text-xs rounded hover:bg-cyan-900/40 transition-colors"
            style={{ fontFamily: "'Press Start 2P', monospace", boxShadow: '0 0 10px rgba(0,255,255,0.2)' }}
          >
            <Play size={12} className="inline mr-2" />
            PLAY FREEPLAY
          </button>
        </div>
      </div>
    </div>
  );
}
