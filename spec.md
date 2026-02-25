# Specification

## Summary
**Goal:** Replace the custom React Three Fiber Football Bros game on the `/football-bros` page with an iframe embedding the actual game from https://footballbros.io.

**Planned changes:**
- Replace the content of `FootballBrosGame.tsx` to render a full-screen iframe with `src="https://footballbros.io"` instead of the custom 3D game scene
- Style the iframe to fill the available viewport height (min 600px, ideally 100vh minus header), with no border, consistent with the retro arcade neon theme
- Remove all Three.js canvas, React Three Fiber Canvas, and `useFootballBrosGame` hook references from the page
- Keep the page title/heading, Leaderboard, and ScoreSubmission sections below the iframe
- Delete the `frontend/src/hooks/useFootballBrosGame.ts` hook file and remove all imports referencing it

**User-visible outcome:** Visiting `/football-bros` now shows the real footballbros.io game embedded in an iframe, with the retro neon title, leaderboard, and score submission still visible below it.
