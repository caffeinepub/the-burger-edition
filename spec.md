# Specification

## Summary
**Goal:** Build a 2D platformer game (OVO) with multiple levels, portals, and level progression directly in the existing OvoGame files.

**Planned changes:**
- Implement core 2D platformer physics in `useOvoGame.ts`: smooth running, jumping, wall-jumping, wall-sliding, coyote time, and gravity
- Design at least 10 levels with increasing difficulty, varied platform layouts, hazards, gaps, and moving platforms
- Add portal objects to level definitions that teleport the player to a target position or a different level when touched
- Add a level exit/goal object to each level; reaching it progresses the player to the next level, and completing the final level triggers game-complete with elapsed time as score
- Update `OvoGame.tsx` to render portals with an animated visual effect (pulsing glow or swirl), display the current level number in the HUD, and show a game-complete overlay with score submission and leaderboard

**User-visible outcome:** Players can run through 10+ platformer levels, use portals to teleport, and reach the exit to advance. After completing all levels, a game-complete screen shows their time and allows score submission to the leaderboard.
