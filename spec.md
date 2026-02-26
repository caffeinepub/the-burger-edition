# Specification

## Summary
**Goal:** Add a 3D first-person 1v1 FPS battle game to the Arcade Hub with four weapons, four AI difficulty levels, and a full in-game HUD.

**Planned changes:**
- Create `use1v1Lol3DGame.ts` hook managing player state, AI bot state, projectile physics, collision detection, and a requestAnimationFrame game loop
- Implement four weapons (Sniper, Shotgun, Pistol, Machine Gun) switchable via keys 1–4, each with unique ammo capacity, reload time, and damage values
- Implement four AI difficulty levels (Easy, Medium, Hard, Extreme) with scaled reaction time and accuracy; AI dynamically switches weapons based on distance to player
- Build `OneLolGame.tsx` page using React Three Fiber with a 3D arena (ground, perimeter walls, 6+ cover obstacles), WASD + mouse pointer-lock controls, a visible AI bot mesh, and visible projectile meshes
- Add an in-game HUD overlay showing player HP bar, bot HP bar, current weapon + ammo, reload progress bar, crosshair, and difficulty label
- Add a difficulty selection screen before the match starts
- Add a game-over screen showing win/loss result, a "Play Again" button returning to difficulty selection, and score submission + leaderboard on win (reusing existing components)

**User-visible outcome:** Players can select a difficulty, enter a 3D arena, move and aim with mouse/keyboard, switch between four weapons, and battle an AI opponent until one side reaches 0 HP, then view results and submit their score.
