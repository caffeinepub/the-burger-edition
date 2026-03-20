import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { useF19FlightSimulatorGame } from '../hooks/useF19FlightSimulatorGame';
import F19Aircraft from '../components/F19Aircraft';
import F19Terrain from '../components/F19Terrain';
import F19AircraftCarrier from '../components/F19AircraftCarrier';
import F19HUD from '../components/F19HUD';
import F19GameOver from '../components/F19GameOver';
import { F19MissilesRenderer } from '../components/F19Missiles';
import { F19FlaresRenderer } from '../components/F19Flares';
import F19EnemyTargets from '../components/F19EnemyTargets';
import F19CoinShop from '../components/F19CoinShop';
import F19ModeSelect from '../components/F19ModeSelect';
import F19TutorialOverlay from '../components/F19TutorialOverlay';
import F19LevelStartOverlay from '../components/F19LevelStartOverlay';
import F19LevelCompleteOverlay from '../components/F19LevelCompleteOverlay';
import F19LevelFailedOverlay from '../components/F19LevelFailedOverlay';

// ── Camera follow ─────────────────────────────────────────────────────────────

interface CameraFollowProps {
  positionRef: React.MutableRefObject<[number, number, number]>;
  rotationRef: React.MutableRefObject<[number, number, number]>;
}

function CameraFollow({ positionRef, rotationRef }: CameraFollowProps) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 10, 20));
  const smoothTarget = useRef(new THREE.Vector3(0, 5, 0));

  useFrame(() => {
    const [px, py, pz] = positionRef.current;
    const [rx, ry] = rotationRef.current;

    const camDist = 18;
    const camHeight = 5;
    const idealX = px + Math.sin(ry) * camDist;
    const idealY = py + camHeight - Math.sin(rx) * 4;
    const idealZ = pz + Math.cos(ry) * camDist;

    smoothPos.current.lerp(new THREE.Vector3(idealX, idealY, idealZ), 0.08);
    smoothTarget.current.lerp(new THREE.Vector3(px, py + 2, pz), 0.1);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothTarget.current);
  });

  return null;
}

// ── Flight scene ─────────────────────────────────────────────────────────────

interface FlightSceneProps {
  positionRef: React.MutableRefObject<[number, number, number]>;
  rotationRef: React.MutableRefObject<[number, number, number]>;
  position: [number, number, number];
  rotation: [number, number, number];
  missiles: ReturnType<typeof useF19FlightSimulatorGame>['weaponState']['missiles'];
  flares: ReturnType<typeof useF19FlightSimulatorGame>['weaponState']['flares'];
  enemies: ReturnType<typeof useF19FlightSimulatorGame>['enemies'];
  lockedTargetId: string | null;
  showCarrierHP: boolean;
  carrierHP: number;
  maxCarrierHP: number;
}

function FlightScene({
  positionRef,
  rotationRef,
  position,
  rotation,
  missiles,
  flares,
  enemies,
  lockedTargetId,
  showCarrierHP,
  carrierHP,
  maxCarrierHP,
}: FlightSceneProps) {
  return (
    <>
      <CameraFollow positionRef={positionRef} rotationRef={rotationRef} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 100, 50]} intensity={1.2} castShadow />
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={300} depth={50} count={2000} factor={4} />
      <F19Terrain />
      <F19AircraftCarrier
        showHealthBar={showCarrierHP}
        protectHP={carrierHP}
        maxProtectHP={maxCarrierHP}
      />
      <F19Aircraft position={position} rotation={rotation} />
      <F19MissilesRenderer missiles={missiles} />
      <F19FlaresRenderer flares={flares} />
      <F19EnemyTargets enemies={enemies} lockedTargetId={lockedTargetId} />
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function F19FlightSimulatorGame() {
  const navigate = useNavigate();
  const game = useF19FlightSimulatorGame();

  // Stable refs for camera (avoids re-creating camera component on every render)
  const positionRef = useRef<[number, number, number]>(game.position);
  const rotationRef = useRef<[number, number, number]>(game.rotation);
  positionRef.current = game.position;
  rotationRef.current = game.rotation;

  const {
    position, rotation, throttle, fuel, speed, altitude,
    isGameOver, crashReason, score,
    weaponState, enemies,
    openShop, closeShop, purchaseItem, restart,
    modeSelectActive, gameMode,
    selectTutorial, selectFreeplay, selectLevel, exitToModeSelect,
    tutorialActive, tutorialStep, tutorialSteps, tutorialCompleted,
    skipTutorial,
    currentLevelIndex, levelDefinitions, levelUnlockStatus, levelBestScores,
    levelProgress, levelStartActive, levelComplete, levelFailed, levelFailReason,
    beginLevel, retryLevel, nextLevel,
  } = game;

  const currentLevelDef = levelDefinitions[currentLevelIndex] ?? null;
  const showCarrierHP = gameMode === 'level' && !!currentLevelDef?.protectObjectiveHP;
  const carrierHP = levelProgress?.protectHP ?? 100;
  const maxCarrierHP = levelProgress?.maxProtectHP ?? 100;

  // Crash reason type coercion for F19GameOver
  const typedCrashReason = (
    crashReason === 'TERRAIN_IMPACT' || crashReason === 'WATER_IMPACT' || crashReason === 'FUEL_EMPTY'
      ? crashReason
      : null
  ) as 'TERRAIN_IMPACT' | 'WATER_IMPACT' | 'FUEL_EMPTY' | null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-arcade-muted hover:text-neon-green transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-pixel text-sm sm:text-base text-neon-green tracking-widest drop-shadow-neon-green">
          F-19 FLIGHT SIMULATOR
        </h1>
        <span className="font-pixel text-[9px] text-arcade-muted ml-auto">PHASE 3 — CAMPAIGN</span>
      </div>

      {/* Mode Select (full-screen overlay before game starts) */}
      {modeSelectActive && (
        <div
          className="relative rounded-lg overflow-hidden border border-neon-green/30"
          style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}
        >
          <F19ModeSelect
            levelDefinitions={levelDefinitions}
            levelUnlockStatus={levelUnlockStatus}
            levelBestScores={levelBestScores}
            tutorialCompleted={tutorialCompleted}
            onSelectTutorial={selectTutorial}
            onSelectLevel={selectLevel}
            onSelectFreeplay={selectFreeplay}
          />
        </div>
      )}

      {/* Game container */}
      {!modeSelectActive && (
        <div
          className="relative rounded-lg overflow-hidden border border-neon-green/30"
          style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}
        >
          <Canvas
            camera={{ fov: 65, near: 0.5, far: 8000, position: [0, 10, 20] }}
            shadows
            style={{ background: '#050a1a' }}
            gl={{ antialias: true, alpha: false }}
          >
            <FlightScene
              positionRef={positionRef}
              rotationRef={rotationRef}
              position={position}
              rotation={rotation}
              missiles={weaponState.missiles}
              flares={weaponState.flares}
              enemies={enemies}
              lockedTargetId={weaponState.lockedTargetId}
              showCarrierHP={showCarrierHP}
              carrierHP={carrierHP}
              maxCarrierHP={maxCarrierHP}
            />
          </Canvas>

          {/* HUD */}
          <F19HUD
            speed={speed}
            altitude={altitude}
            throttle={throttle}
            fuel={fuel}
            score={score}
            weaponState={weaponState}
            onOpenShop={openShop}
            gameMode={gameMode}
            levelProgress={levelProgress}
            levelDef={currentLevelDef}
          />

          {/* Tutorial overlay */}
          {tutorialActive && (
            <F19TutorialOverlay
              tutorialStep={tutorialStep}
              tutorialSteps={tutorialSteps}
              onSkip={skipTutorial}
              onExit={exitToModeSelect}
            />
          )}

          {/* Level start overlay */}
          {levelStartActive && currentLevelDef && (
            <F19LevelStartOverlay
              levelDef={currentLevelDef}
              onStart={beginLevel}
              onExit={exitToModeSelect}
            />
          )}

          {/* Level complete overlay */}
          {levelComplete && currentLevelDef && levelProgress && (
            <F19LevelCompleteOverlay
              levelDef={currentLevelDef}
              levelProgress={levelProgress}
              finalScore={score}
              onNextLevel={nextLevel}
              onExit={exitToModeSelect}
              hasNextLevel={currentLevelIndex < levelDefinitions.length - 1}
            />
          )}

          {/* Level failed overlay */}
          {levelFailed && !levelComplete && currentLevelDef && (
            <F19LevelFailedOverlay
              levelDef={currentLevelDef}
              failReason={levelFailReason}
              onRetry={retryLevel}
              onExit={exitToModeSelect}
            />
          )}

          {/* Game over (freeplay / tutorial crash) */}
          {isGameOver && gameMode !== 'level' && (
            <F19GameOver crashReason={typedCrashReason} onRestart={restart} />
          )}

          {/* Coin shop */}
          {weaponState.shopOpen && (
            <F19CoinShop
              weaponState={weaponState}
              onPurchase={purchaseItem}
              onClose={closeShop}
            />
          )}
        </div>
      )}

      {/* Info bar */}
      {!modeSelectActive && (
        <div className="mt-3 flex flex-wrap gap-4 justify-center">
          <span className="font-pixel text-[9px] text-arcade-muted">W/S PITCH</span>
          <span className="font-pixel text-[9px] text-arcade-muted">A/D ROLL</span>
          <span className="font-pixel text-[9px] text-arcade-muted">SHIFT/CTRL THROTTLE</span>
          <span className="font-pixel text-[9px] text-arcade-muted">SPACE/F FIRE</span>
          <span className="font-pixel text-[9px] text-arcade-muted">T LOCK</span>
          <span className="font-pixel text-[9px] text-arcade-muted">C FLARE</span>
        </div>
      )}
    </div>
  );
}
