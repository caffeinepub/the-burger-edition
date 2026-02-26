# Specification

## Summary
**Goal:** Extend the Minecraft Classic 3D game with mobs, survival bars, a crafting/food system, and an XP bar.

**Planned changes:**
- Add three mob types (Zombie, Skeleton, Spider) with procedural spawning, chase behavior, and attack logic in `useMinecraftClassic3DGame.ts`; expose mob state from the hook
- Render each mob as a distinct 3D mesh in `MinecraftClassicGame.tsx` using React Three Fiber; render Skeleton arrows as travelling projectile meshes
- Add Health (0–20), Hunger (0–20), and Stamina (0–100) survival stats to the hook; hunger drains over time and damages health when empty; stamina depletes on sprint/attack and regenerates when idle; reaching 0 health respawns the player with an empty inventory
- Display Health (red), Hunger (orange/yellow), and Stamina (cyan/green) bars in the HUD above the hotbar, labelled with icons and numeric values, styled with the retro neon arcade theme
- Add a food and crafting system to the hook: player starts with no items; mining wood/stone drops resources; at least 3 recipes (Wooden Pickaxe, Bread, Apple); consuming food restores Hunger; stone mines very slowly without a pickaxe; expose inventory, recipes, and `craftItem` callback
- Add a crafting panel (opened/closed with `E` or `Escape`) listing recipes with ingredient requirements and a Craft button, styled with the retro neon arcade theme
- Add an XP system to the hook: mining diamond grants +10 XP, killing mobs grants 5–7 XP; every 100 XP increments the level and resets XP; expose `xp`, `xpToNextLevel`, and `level`
- Add an XP bar to the HUD alongside the survival bars, showing current level and fill progress, styled with the retro neon arcade theme

**User-visible outcome:** Players can now encounter and fight Zombie, Skeleton, and Spider mobs, monitor their Health, Hunger, Stamina, and XP in a neon HUD, gather resources to craft tools and food, and level up by mining diamonds or defeating enemies.
