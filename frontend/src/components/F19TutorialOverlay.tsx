import React from 'react';
import { X, SkipForward } from 'lucide-react';
import type { TutorialStep } from '../hooks/useF19FlightSimulatorGame';

interface F19TutorialOverlayProps {
  tutorialStep: number;
  tutorialSteps: TutorialStep[];
  onSkip: () => void;
  onExit: () => void;
}

const MECHANIC_ICONS: Record<string, string> = {
  movement: '🕹️',
  throttle: '⚡',
  shoot: '🚀',
  lockOn: '🎯',
  dodge: '💨',
  flare: '🔥',
  complete: '✅',
};

export default function F19TutorialOverlay({
  tutorialStep,
  tutorialSteps,
  onSkip,
  onExit,
}: F19TutorialOverlayProps) {
  const totalSteps = tutorialSteps.length - 1; // exclude 'complete' step
  const currentStepData = tutorialSteps[tutorialStep];
  if (!currentStepData) return null;

  const isComplete = currentStepData.mechanic === 'complete';
  const progressPercent = (tutorialStep / totalSteps) * 100;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none"
      style={{ paddingTop: '12px' }}
    >
      {/* Main prompt box */}
      <div
        className="pointer-events-auto mx-4 max-w-2xl w-full"
        style={{
          background: 'rgba(0, 10, 0, 0.92)',
          border: `2px solid ${isComplete ? '#00ff41' : '#00cc33'}`,
          borderRadius: '4px',
          boxShadow: `0 0 20px ${isComplete ? 'rgba(0,255,65,0.5)' : 'rgba(0,204,51,0.3)'}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-green-900">
          <div className="flex items-center gap-2">
            <span className="text-lg">{MECHANIC_ICONS[currentStepData.mechanic] ?? '📋'}</span>
            <span
              className="text-green-400 text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              FLIGHT TUTORIAL
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-green-600 text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {tutorialStep + 1}/{tutorialSteps.length}
            </span>
            <button
              onClick={onSkip}
              className="text-green-700 hover:text-green-400 transition-colors flex items-center gap-1 text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
              title="Skip tutorial"
            >
              <SkipForward size={12} />
              SKIP
            </button>
            <button
              onClick={onExit}
              className="text-red-700 hover:text-red-400 transition-colors"
              title="Exit tutorial"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Prompt text */}
        <div className="px-4 py-3">
          <p
            className={`text-xs leading-relaxed ${isComplete ? 'text-green-300' : 'text-green-400'}`}
            style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.8' }}
          >
            {currentStepData.prompt}
          </p>
        </div>

        {/* Progress bar */}
        {!isComplete && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-green-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span
                className="text-green-700 text-xs"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
              >
                {Math.round(progressPercent)}%
              </span>
            </div>
            {/* Step dots */}
            <div className="flex gap-1.5 mt-2 justify-center">
              {tutorialSteps.map((step, i) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < tutorialStep
                      ? 'bg-green-500'
                      : i === tutorialStep
                      ? 'bg-green-300 scale-125'
                      : 'bg-green-900'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Waiting indicator */}
        {!isComplete && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span
              className="text-green-700 text-xs"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px' }}
            >
              WAITING FOR ACTION...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
