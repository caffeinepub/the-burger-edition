# Specification

## Summary
**Goal:** Add Tutorial Mode, four new enemy types, a progressive 6-level system, and a Level/Mode Select screen to the F-19 Flight Simulator.

**Planned changes:**
- Add a step-by-step Tutorial Mode accessible from the main menu that walks players through movement, throttle, shooting, lock-on targeting, missile dodging, and flare deployment; each step advances only after the player successfully performs the required action, with a progress indicator and a skip option
- Implement four new enemy types with distinct 3D geometry, behaviors, and coin/score values: Fast Jets (high-speed, hard to track), Armored Enemies (multi-hit with visible health bar), Missile-Launching Drones (fire homing missiles countered by flares), and Ground-to-Air Turrets (static, fire upward at low-altitude players)
- Add a Progressive Levels system with at least 6 levels of escalating difficulty; each level combines at least 2 win conditions (survive X seconds, destroy X enemies, reach a score threshold, protect an objective); objectives are shown at level start and tracked live in the HUD; a level-complete screen and a level-fail screen with retry are included; levels unlock sequentially and progress is persisted to localStorage
- Add a Mode/Level Select screen shown on game start, offering Tutorial Mode, Progressive Levels (with name, difficulty, locked/unlocked status, and best score for completed levels), and a Freeplay option

**User-visible outcome:** Players can choose between Tutorial, Progressive Levels, and Freeplay from a new select screen; encounter four new enemy types across six escalating levels with combined objectives, level-complete/fail screens, and persistent unlock progress.
