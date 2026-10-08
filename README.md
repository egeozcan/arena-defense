# Balloon Arena Defense

[![CI and deployment](https://github.com/egeozcan/arena-defense/actions/workflows/pages.yml/badge.svg)](https://github.com/egeozcan/arena-defense/actions/workflows/pages.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

**[Visit the landing page](https://egeozcan.github.io/arena-defense/) · [Play now](https://egeozcan.github.io/arena-defense/play/)**

A playable desktop browser auto-battler based on [the supplied design document](DESIGN.md). Build a fleet of toy farm and construction vehicles, place them in an isometric arena, and clear every balloon within three simulation minutes. Waves arrive in tight packs, with a 0.7-second launch and chain-triggered Pop Rush overdrive to keep the action moving.

## Screenshots

Pop Rush in the barn arena:

![A harvester popping balloons during fleet-wide Pop Rush](public/screenshots/pop-rush.png)

The preparation workshop, with upgrades and an incoming-wave briefing:

![Harvester attack and speed upgrades in the workshop](public/screenshots/workshop.png)

## Run locally

```sh
git clone https://github.com/egeozcan/arena-defense.git
cd arena-defense
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173) for the landing page; append `/play/` for the game. Requires Node.js 22.12 or newer (CI uses Node.js 24). Playing needs a desktop browser with WebGL, a mouse, and a keyboard. No account or backend is required; saves stay in your browser.

```sh
npm run build       # TypeScript checks and production bundle
npm test            # Determinism and gameplay regression tests
npm run balance     # Full Easy, Medium and Hard campaigns in both arenas
npm run balance -- --plan=basic # Compare a modest four-vehicle fleet
npm run balance -- --mode=hard --arena=yard --seed=73429
```

## GitHub Pages deployment

[The Pages workflow](.github/workflows/pages.yml) runs the gameplay tests and production build on pushes to `main` and pull requests. Successful pushes to `main` deploy `dist/` through GitHub Actions to [the live site](https://egeozcan.github.io/arena-defense/). Pull requests validate without publishing; the workflow also supports manual runs.

The build includes a lightweight landing page at `/` and the game at `/play/`. CI sets Vite's base to the repository path so JavaScript, styles, vehicle images, and screenshots work on GitHub Pages. To preview that exact deployment locally:

```sh
npm run build -- --base=/arena-defense/
npm run preview -- --base=/arena-defense/
# Open http://127.0.0.1:4173/arena-defense/
```

For a fork, enable **Settings → Pages → Source → GitHub Actions**. CI derives the base path from your repository name; update the account-specific README, landing-page, and package links for your fork.

## Play

1. Buy a vehicle from the bottom tray (**1–4**) and click a clear area to deploy its ghost. **R** rotates; **Esc** cancels placement. Select a deployed vehicle to move it or change targeting.
2. Press **Enter** or **Start wave**. After the countdown, vehicles drive and attack automatically. **Space** or **Esc** pauses; **1–3** set simulation speed, which persists between waves. Round earnings open directly in the preparation workshop with your upgrade options and the next wave briefing.
3. Chain **10 pops**, with no gap longer than **2.5 simulation seconds**, to trigger **Pop Rush**: the entire fleet moves **45% faster** and attacks **60% faster** for **5 seconds**. The gold meter shows charge and remaining overdrive; the chain badge shows your streak. Pops during Rush grow the streak but do not refill or extend it. Paid boosts stack with Rush up to 2.5× movement / 2.6× tool speed. Round results record Rush count and best chain.
4. Select a vehicle in the arena or the live fleet panel to change its **Strategy** during a wave, inspect its current activity, or activate its unlocked unique ability. Use **Q**, **W**, and **E** for purchased global abilities.
5. Between waves, press **G** to open the garage for upgrades, purchases, and abilities. The workshop opens automatically after each match. Its wave briefing lists exact incoming counts, initial height bands, armor, splitting cargo and other modifiers. Coverage is checked against deployed vehicles, including upgrades; uncovered bands offer deployment or purchase suggestions. New types and higher flight bands are announced a round ahead. Review deployment before launching; uncovered balloons or undeployed vehicles trigger a pre-launch check that you can choose to proceed through. If every remaining balloon is outside your fleet’s coverage, **End wave** lets you accept the displayed life loss rather than wait for the timer; abilities remain available if you want to rescue the wave.

Use the view buttons to zoom and rotate; right-drag pans. **V** rotates the camera; **+ / −** zoom. The settings icon starts a new run with Easy, Medium, or Hard difficulty in either arena. Progress saves locally during preparation. Reloading during a round returns to its saved preparation state. The sound icon toggles synthesized effects. Round summaries can export JSON replays.

## Implemented

- Four detailed procedural vehicles with reflective glass, sculpted tires, chevron treads, metal wheel spokes, grilles, steps, and working headlamps, brake lamps, reversing lamps, and steering indicators. Wheeled vehicles use individual steering angles and signed wheel rotation; crawlers animate belt links and rollers independently on each side. Textured cutaway arenas include scenery, foliage, lighting, and shadows.
- Every upgrade tier adds cumulative physical hardware and blends the body paint with its path color. Attack reinforces and transforms tools; Speed adds intakes, exhausts, turbo hardware and overdrive cores; Traction adds larger tires, rotating tire chains, wider crawler cleats, guards, plows and recovery equipment. Specialist tiers add vehicle-specific equipment including rear and raised headers, thresher turbines, radial fog cannons, demolition jaws, wrecking balls, magnets and tower-crane outriggers. Mounting zones keep both paths visible in combined builds. Upgraded models appear in the arena, placement ghosts and the garage's selected-vehicle preview; stock purchase icons remain baked images. The icon studio has primary and secondary path controls for inspecting all tiers and combinations.
- Vehicle handling uses gradual acceleration and braking, momentum, limited steering, slower corners, reversing, terrain-dependent grip, and separate differential steering for crawlers. Harvester rear steering and sprayer front steering follow the motion model. Damped chassis pitch and roll show weight transfer; crawler upper bodies slew independently of their tracks. Heading, suspension, tools, wheels, and tracks follow simulation ticks and interpolation, including pause and speed changes. Visible route lookahead rounds grid corners. Wheeled vehicles predict collision-free sequences of turns and reverses, brake before route endpoints, and recover when small maneuvers stop making progress. Unreachable approaches ask parked vehicles to yield early. Harvesters face their primary target with the front cutter; the upgraded rear header adds secondary hits behind the chassis.
- Vehicle icons are transparent renders of those same models, shared across the garage, fleet controls, inspector, and help. To regenerate them, open `/tools/vehicle-icons.html` on the development server and bake each icon into `public/vehicles/`.
- Expanded arenas: a 48 × 36 m barn and a 64 × 48 m yard, with wider circulation lanes, crop fields, a pond and windmill, loading bays, marked roads, a site office, lights, and a tower crane. Camera framing adapts to arena dimensions.
- Vehicles retain their fast movement and attacks. The opening wave now has 30 balloons; later scripted counts are 1.8× their base scripts before difficulty scaling. Packs hold 10/13/16 balloons before difficulty scaling and arrive within roughly 4–11 seconds. After the opening, entrances alternate and packs use a wider spread of lanes. Specialist roles, upgrade costs, life rules, and payouts retain their existing rules.
- Layered pop bursts with radial sparks, colorful shards, expanding shockwaves, balloon hit flashes, weapon recoil, brighter spray, dust trails, wind streaks, and boost glows. Small camera kicks respect reduced-motion preferences.
- Pop Rush turns chains into five seconds of fleet-wide overdrive. A tick-driven charge meter and chain fuse freeze when paused and follow the selected simulation speed. Golden exhaust, synchronized ignition rings, a brief camera push, a comic callout, and a rising synthesized chord mark the payoff. Locally drawn, instanced POP! stamps appear at bursts without font downloads or per-pop draw calls; screen flashes are reserved for Rush ignition. Camera motion and callout animations respect reduced-motion preferences.
- Synthesized impact sounds rise with a streak, with a wave-clear jingle and round highlights for best chain and Rush activations. The Rush mechanic and highlights are deterministic in replays.
- Camera controls, terrain-sensitive movement, A* routing to reachable attack positions, and immediate retargeting after a pop or loss of eligibility. Nearest uses travel cost to tool range; balloons already in range are ordered by distance. Other vehicles' target claims only break ties, so they cannot override a strategy.
- Live per-vehicle strategy controls and activity indicators, including explicit height and armor limits when a specialist idles. Strategy changes are timestamped replay commands and carry forward to the next wave.
- Chassis collisions use swept movement checks, vehicle-width clearance around obstacles, and occupied space in A*. Vehicles replan blocked routes, pull aside for traffic, and rotate right of way to avoid starvation. Blocked attackers ask idle or attacking vehicles on their route to move aside, then keep the exit clear until they finish moving. Pulling aside continues if the last eligible target is popped; losing that target previously froze the vehicle in place. Traction tier 4 speeds recovery while retaining collisions. Older saves relocate conflicting deployments to the nearest clear placement.
- Five balloon types; layered splitting, armor resistance, hay drops, fleeing and regeneration.
- Visible balloon drift with distinct speeds: Basic 0.95, Layered 0.8, High-flyer 0.75, Carrier 0.5, and Armored 0.32 m/s before difficulty and physics effects. Balloons begin drifting inward, hold a heading for 3–5 simulation seconds, and may dodge nearby vehicles at their next decision. Fleeing modifiers dodge more aggressively. Heading choices avoid walls and low scenery; physics still handles contact and bounces.
- A 60 Hz simulation using deterministic Rapier WASM, seeded waves, physics body reuse, stable entity order and timestamped ability commands.
- Vehicle purchases, 70% resale, all four five-tier upgrade paths with the two-path/5+2 cap, targeting modes, persistent placement and local saves.
- Three global abilities with cooldown and charge upgrades; four vehicle abilities unlocked through unique upgrades.
- 20 scripted waves, generated later waves, three difficulty modes, victory, game over, and freeplay.
- Confetti, optional synthesized pop sounds, live HUD, time controls and round payouts.

## Difficulty and balance

Modes share the same introductions, so armor arrives at round 6, high-flyers at round 8, and carriers at round 10. Difficulty changes the actual wave pressure:

| Mode | Win / lives | Crowd vs. Easy | Wave pressure |
| --- | --- | --- | --- |
| Easy | 20 rounds / 150 | 1× | Lower prices, light late modifiers, no added armor during the campaign |
| Medium | 40 rounds / 100 | 1.15× | Tighter packs, faster drift, growing specialist HP, added armor from round 30 |
| Hard | 60 rounds / 50 | 1.35× | Faster packs and drift, stronger specialist HP, earlier fleeing/regrowth, added armor from round 22 |

Basic and layered balloons retain one HP during the campaign to preserve fast popping. Durable specialist targets gain HP after round 8 in Medium and Hard. Starting cash stays $650; price multipliers remain 0.85 / 1 / 1.08. Income is $160 + $2 per round, plus normal pop earnings. A successful wave adds a speed bonus of $0.65 per remaining second, capped at $100 / $85 / $70, so a fast opening no longer grants an oversized windfall. Timer and weighted life penalties remain consistent across modes. Overflow balloons queued beyond the 300-body physics limit count toward life loss at timeout.

The balance runner uses actual affordability, placement, legal upgrades, collisions, and ability cooldowns. Its balanced plan buys all four roles, grows the fleet, and invests in advanced upgrades and abilities. Its basic plan keeps four vehicles with upgrades capped at tier 2 and uses no abilities. Reports include every round and are saved under `artifacts/balance-*.json`. These are deterministic scenario checks, not measured human win rates.

The checked-in balance reports predate the larger arenas and denser rounds. Run `npm run balance` for current campaign results; the earlier reports remain available as historical baselines.

## Code

- `src/sim/data.ts`: costs, stats, upgrade descriptions, terrain, arenas, wave scripts and run model.
- `src/sim/pathfinding.ts`: A* and terrain-weighted target distance fields.
- `src/sim/traffic.ts`: swept chassis collisions, occupied route cells, and pull-aside recovery.
- `src/sim/vehicle-motion.ts`: fixed-step vehicle handling, steering, signed running-gear travel, and suspension.
- `src/sim/vehicle-driving.ts`: collision-checked steering and reversing sequences, with front-cutter positioning for harvesters.
- `src/sim/balloon-motion.ts`: timed drifting, evasive heading choices, and clearance around scenery.
- `src/sim/pop-rush.ts`: simulation-tick chain tracking, charge and bounded overdrive duration.
- `src/sim/engine.ts`: browser-independent fixed-tick physics, AI, combat, commands and payouts.
- `src/render/`: React Three Fiber scene, instanced balloons and procedural toy models.
- `src/ui/`: React garage, HUD, run flow and styling.
- `tools/`: Node-based determinism tests and balance runner.

The renderer reads simulation state; user actions enter a command queue. Pause and speed only change tick scheduling. The replay export records the starting run and each input tick.

## Prototype limits

This is a first playable implementation, rather than the design document's fully validated release. Models are procedural rather than Blender/glTF assets. Chassis use circular collision proxies and planar steering dynamics; suspension and articulated tools remain visual. Barn loft hiding, true ramp climbing, and exact tool collider shape queries are still simplified. Later waves use seeded per-type counts rather than the proposed constraint-based budget generator. The fog cannon uses repeated radial hits instead of a persistent damage-over-time volume. Freeplay beyond the scripted balance scenarios needs more playtesting; the 300-balloon frame-rate target has not been certified on a mid-range laptop. There is replay export and deterministic replay verification in tests, but no in-app replay viewer.

The compatibility physics package embeds WASM, so the production bundle is currently sizable. Fonts use Google Fonts with local sans-serif fallbacks. No external image or model assets are required.

## License

Copyright © 2026 Yavuz Ege Özcan. This game, its procedural artwork, and the screenshots in this repository are licensed under the **GNU General Public License, version 3 only** (`GPL-3.0-only`). See [LICENSE](LICENSE) for the full terms. The program is provided without warranty. Third-party dependencies retain their respective licenses.
