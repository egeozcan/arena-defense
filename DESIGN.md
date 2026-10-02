# Balloon Arena Defense — v1 Game Design Document

Sep 30, 2026 · @ege

## Overview

Balloon Arena Defense is a browser auto-battler: farm and construction vehicles clear balloons out of barns and construction yards before a 3-minute timer runs out. The player's skill is in the garage and in placement, not in driving.

**Platform:** desktop browser first (Chrome, Firefox, Safari), keyboard and mouse. Touch is out of scope for v1.

**Stack:** TypeScript, Three.js via react-three-fiber for rendering, Rapier (WASM) for physics, React for all menus and the garage.

**Design pillars**

1. **Placement is the skill.** Vehicles act on their own, so every decision that matters happens before the round: which vehicles, where, with which targeting mode and upgrades.
2. **Every vehicle has a job.** Each vehicle has one signature tool with a clear strength and a clear blind spot. No vehicle clears every balloon type alone.
3. **Physics makes it lively, not random.** Balloons drift, bounce and flee with real physics. Vehicles move predictably. The same setup gives the same result.
4. **Readable at a glance.** Low-poly, bright, toy-like. A player should see from the isometric view which balloon is which and why a vehicle is struggling.

## Core loop and round flow

Each round has four phases, and the player acts in all of them except the round itself, where only abilities are available.

&#91;embedded content: core loop · 4 phases, 1 decision\]

The loop repeats until lives reach zero; winning the mode's final round only adds a victory screen and the freeplay option.

1. **Garage** (untimed): buy, sell and upgrade vehicles, and buy or upgrade abilities. Owned vehicles persist between rounds.
2. **Setup** (untimed): place owned vehicles on valid cells, rotate them, and set each one's targeting mode. Placements from the last round are kept as a starting point. The next wave's balloon types are shown.
3. **Round** (up to 3:00 of game time): balloons spawn, vehicles act on their own, the player can use abilities, pause and switch speed between 1×, 2× and 3×. The round ends early when every balloon is popped.
4. **Round summary:** cash is paid out, lives are subtracted for leftover balloons, and stats are shown.

Vehicles not placed in setup sit out the round but still count as owned. The timer counts simulation time, so 2× speed finishes a round in 1.5 real minutes.

## Game modes and difficulty

A run is won by surviving the mode's round count; after that the player may continue in freeplay until lives run out.

| Mode | Rounds to win | Starting lives | Starting cash | Price multiplier |
| --- | --- | --- | --- | --- |
| Easy | 20 | 150 | 650 | 0.85 |
| Medium | 40 | 100 | 650 | 1.0 |
| Hard | 60 | 50 | 650 | 1.08 |

All numbers are starting points for playtesting.

**Round definitions.** Rounds 1 to 20 are hand-authored wave scripts shared by all modes, so early rounds teach one balloon type at a time. From round 21 on, waves come from a seeded generator with a difficulty budget: each balloon type has a point cost, and the round's budget grows each round. The generator mixes types under constraints, such as a minimum share of the newest type and a cap on carriers.

**Scaling levers**, applied in this order as rounds climb: more balloons, then tougher types, then more layers per balloon, then armor on more types, then faster movement and shorter spawn gaps. The timer stays at 3:00 in every round and mode; all difficulty comes from the balloons.

**Freeplay.** After the final round, the budget keeps growing by a fixed percentage per round and balloon HP gets a multiplier. There's no end; the score is the highest round reached.

**Arena rotation.** In v1 the player picks the barn or the yard at the start of a run and stays there. Mixed rotation is a later option.

## Arenas and terrain

Both arenas follow the same rules; they differ only in layout, terrain mix and ceiling height. Each arena is a grid of 1 m cells, which drives placement, pathfinding and terrain lookup.

| Arena | Footprint | Ceiling | Terrain mix | Layout character |
| --- | --- | --- | --- | --- |
| Barn | 24 × 16 m | 9 m, rafters | Hay, mud, packed dirt | Tight aisles between stalls, hay stacks as obstacles, a loft ledge where balloons can hide |
| Construction yard | 32 × 24 m | 14 m, open sky with a net | Gravel, concrete, mud, ramps | Open center, material piles, a raised platform reached by ramps |

**Terrain types.** Each cell has one terrain type. Terrain changes a vehicle's effective speed and turn rate through a grip value, and the Traction upgrade raises the vehicle's grip rating.

| Terrain | Grip | Effect on a vehicle with base traction |
| --- | --- | --- |
| Concrete | 1.0 | Full speed |
| Packed dirt | 0.9 | Almost full speed |
| Gravel | 0.75 | Slower turning |
| Hay | 0.6 | Slower, wider turns |
| Mud | 0.4 | Much slower; vehicles with low traction may stall |
| Ramp | 0.7 | Uphill slowdown; needs a minimum traction to climb |

**Effective speed formula:**

```latex
v_{eff} = v_{base} \cdot \min\left(1,\ g_{terrain} + k \cdot T_{vehicle}\right)
```

Here g is the terrain's grip, T is the vehicle's traction rating (0 to 1), and k is a tuning constant, around 0.5 to start. Pathfinding costs use the same formula, so vehicles route around mud when it's faster.

**Placement zones.** Not every cell accepts a vehicle. Each arena marks valid placement cells; vehicles need a free footprint (1 × 1 to 2 × 3 cells) and can't overlap.

## Vehicles

v1 ships four vehicles, two farm and two construction, each covering a different height band and damage type. Together they cover every v1 balloon, but no single vehicle does.

| Vehicle | Cost | Footprint | Speed | Base traction | Reach height | Tool | Damage type | Damage / hit | Hit interval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Combine harvester | 400 | 2 × 3 | 3.0 m/s | 0.5 | 0 to 1.5 m | Rotating header blades, front arc 3 m wide | Cut | 1 | 0.4 s |
| Crop sprayer | 450 | 2 × 2 | 4.0 m/s | 0.3 | 0 to 4 m | Spray cone, 5 m range, 40° wide, hits all in cone | Spray | 1 | 1.0 s |
| Excavator | 550 | 2 × 2 | 1.5 m/s | 0.8 | 0 to 5 m | Bucket smash, single target within 5 m | Crush | 4 | 1.6 s |
| Mobile crane | 700 | 2 × 3 | 1.2 m/s | 0.6 | 3 to 12 m | Hook swings from the boom, single target | Pierce | 3 | 1.4 s |

**Damage types vs. armor.** Armored balloons ignore Cut and Pierce, take half damage from Spray, and full damage from Crush. Upgrades can change this (see the Upgrade system).

**Roles at a glance**

- **Combine harvester:** the ground-level workhorse. Fast, cheap, great against swarms of low balloons, useless above 1.5 m.
- **Crop sprayer:** crowd control. Hits many balloons in a cone at mid height, low damage per hit, fragile on mud.
- **Excavator:** the anti-armor answer. Slow and hard-hitting, climbs ramps and mud easily.
- **Mobile crane:** the only answer to balloons near the ceiling. Can't hit anything below 3 m, which makes placement near high spots critical.

**Selling.** A vehicle sells for 70% of everything spent on it (purchase plus upgrades), in the garage only.

**Vehicle limit.** No cap: cash and free placement cells are the only limit.

## Upgrade system

Every vehicle has four paths of five tiers each: Attack, Speed, Traction, and one vehicle-specific path. A vehicle can invest in at most two paths; one of them can reach tier 5, the other stops at tier 2.

**Cap rules**

- The first path to reach tier 3 becomes the primary path. From then on, the other invested path is capped at tier 2.
- Once two paths have any tier, the other two are locked.
- Tiers are bought in order within a path; no skipping.
- Upgrades are bought in the garage only.

**Tier cost** is a multiple of the vehicle's base cost, so expensive vehicles have expensive upgrades:

| Tier | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Cost × base | 0.3 | 0.5 | 1.2 | 3.0 | 8.0 |

Tiers 1 and 2 are stat bumps; tiers 3 and 4 change how the vehicle plays; tier 5 is a signature transformation.

**Shared paths** (same stat effects on every vehicle, tier 5 flavored per vehicle)

| Tier | Attack | Speed | Traction |
| --- | --- | --- | --- |
| 1 | +25% damage | +15% drive speed | +0.1 traction |
| 2 | −20% hit interval | +15% tool speed | +0.1 traction |
| 3 | Hits ignore half of armor | +30% drive speed, faster retarget | Ignores ramp minimum; mud grip +0.2 |
| 4 | +100% damage | Double tool speed for 5 s after each pop | Pushes through other vehicles instead of waiting |
| 5 | Harvester: double header · Sprayer: burst spray · Excavator: heavy bucket, 3 × damage · Crane: second hook | All vehicles: overdrive, permanently at tier 4 bonus | All vehicles: all-terrain, grip treated as 1.0 everywhere |

**Unique paths**

| Tier | Combine harvester: Header | Crop sprayer: Chemicals | Excavator: Hydraulics | Mobile crane: Boom |
| --- | --- | --- | --- | --- |
| 1 | Header 1 m wider | +1 m spray range | +1 m arm reach | +2 m boom reach |
| 2 | Reach height up to 2 m | Cone widens to 60° | Smash splashes 1 m radius | Faster hook swing |
| 3 | Rear header, hits behind too | Sticky spray slows balloons 40% | Arm reach 7 m | Wrecking ball: 1.5 m splash |
| 4 | Raised header, reach up to 3 m | Acid: full damage to armor, strips it after 3 hits | Ground shockwave hits all balloons below 1 m within 3 m | Magnet: pulls carriers down to 4 m |
| 5 | Thresher: pulls balloons within 4 m toward the header | Fog cannon: 360° mist, damage over time within 6 m | Demolisher: one hit pops all layers of a balloon | Tower crane: anchors in place, reaches full ceiling, hits 2 targets |

The unique paths deliberately widen each vehicle's coverage, such as a harvester reaching higher or a sprayer beating armor. Those are the choices that let a player cover a gap without buying another vehicle. Tier 3 of every unique path also unlocks that vehicle's active ability (see Player abilities).

## Balloons

v1 has five balloon types plus two modifiers that the wave generator can add to any type. Each type forces a different vehicle choice, and the modifiers test placement.

| Type | HP | Radius | Float height | Movement | Special | Lives if left | Cash per pop |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Basic | 1 | 0.4 m | 0.5 to 3 m | Slow random drift | None | 1 | 1 |
| Layered | 1 per layer, 2 to 4 layers | 0.6 m | 0.5 to 3 m | Slow drift | Each pop of an outer layer spawns 2 balloons of the next layer down | Sum of remaining layers | 1 per layer |
| Armored | 6 | 0.7 m | 0.3 to 1.5 m | Very slow, heavy, pushes back on contact | Immune to Cut and Pierce, half damage from Spray | 3 | 4 |
| High-flyer | 2 | 0.4 m | 6 m to ceiling | Rises to the ceiling, drifts along it | Can hide in rafters or loft; only the crane reaches it without upgrades | 2 | 3 |
| Hay carrier | 4 | 0.9 m | 2 to 4 m | Slow patrol along a path | Drops a hay bale every 20 s; bales are physics obstacles with hay terrain grip; on pop, releases 3 Basic | 5 | 5 |

**Layered balloons.** Layers are colors, outermost first: purple (4), blue (3), green (2), yellow (1). A 4-layer balloon that nobody touches costs 4 lives. Every pop splits it, so the total work is much larger than the HP suggests, which is what makes the harvester and sprayer valuable.

**Modifiers** (introduced from round 15; shown as a visual marker on the balloon)

| Modifier | Effect | Visual |
| --- | --- | --- |
| Fleeing | Pushed away from any vehicle within 4 m | Little flapping wings |
| Regenerating | Recovers 1 HP or 1 layer every 5 s if not hit | Pulsing glow |

**Spawning.** Balloons spawn over the first 30 to 60 seconds of a round from spawn points on the arena edges (barn doors, yard gates), in a scripted order per wave. The player sees the upcoming wave's types in the setup phase, not the exact counts.

**Lives lost** at the timeout are summed over all balloons still alive, using the Lives column. Carrier-released balloons count too.

## Vehicle AI and targeting

Vehicles are kinematic: they follow grid paths at a terrain-adjusted speed, never simulated wheels. That keeps their behavior predictable enough that placement, not luck, decides a round.

**Targeting modes** (set per vehicle in the setup phase; default Nearest)

| Mode | Picks the balloon that is… |
| --- | --- |
| Nearest | Closest by path cost, not straight-line distance |
| Strongest | Highest remaining HP (layers count as HP) |
| Highest | Highest altitude within reach |
| Oldest | Spawned earliest |
| Most lives | Would cost the most lives if left at timeout |

**Eligibility filter**, applied before any mode: the balloon must be within the vehicle's reach height band, and the vehicle must be able to damage it (an unupgraded harvester ignores armored balloons). If nothing is eligible, the vehicle idles at its placement cell.

**Behavior states**

1. **Select:** every 0.5 s, pick a target with the current mode.
2. **Path:** A\* on the arena grid, cost per cell from the effective speed formula. Re-plan every 1 s or when the target moves more than 2 m.
3. **Approach:** drive along the path until the target is within tool range and height band. Turn to face it for directional tools.
4. **Attack:** use the tool on its hit interval. Stay in place while the target is in range.
5. **Recover:** if the vehicle moved less than 0.3 m in 2 s while approaching, it reverses for 1 s, re-plans, and blacklists that target for 3 s.

**Vehicle–vehicle conflicts.** Vehicles reserve the next two cells of their path. A vehicle whose next cell is reserved waits up to 1 s, then re-plans around it. Traction tier 4 lets a vehicle push through instead.

**The crane** is special: it drives only to reposition, then works from a fixed spot as long as its boom reaches a target. It re-positions only when nothing eligible is in boom range for 3 s.

## Player abilities

Abilities are bought in the garage and recharge on a cooldown during the round. There are two kinds: global abilities the player buys once, and vehicle abilities that come with a unique-path upgrade.

**Global abilities.** Each is ready at the start of a round; after use it recharges on its cooldown. Prices follow the mode's price multiplier.

| Ability | Price | Cooldown | Target | Effect |
| --- | --- | --- | --- | --- |
| Gust of wind | 200 | 45 s | A direction, dragged on the arena | Pushes all balloons 6 m in that direction over 3 s; high-flyers get pulled down 3 m |
| Emergency boost | 300 | 60 s | One vehicle | Doubles drive and tool speed for 8 s and clears a stuck state at once |
| Pitchfork | 450 | 75 s | A point on the arena | Pops balloons within 1.5 m, up to 3 HP each; armored balloons take 3 damage |

Each global ability has two garage upgrades: 20% shorter cooldown (0.5 × its price), then a second charge (1 × its price).

**Vehicle abilities.** Reaching tier 3 on a vehicle's unique path unlocks an active ability for that vehicle, triggered by clicking it during the round. Each vehicle keeps its own cooldown, so two tier-3 excavators mean two slams.

| Vehicle | Ability | Cooldown | Effect |
| --- | --- | --- | --- |
| Combine harvester | Full throttle | 40 s | Dashes 3 s toward the densest cluster of eligible balloons with double header damage |
| Crop sprayer | Sticky cloud | 50 s | Cloud of 5 m radius around the sprayer slows balloons 60% for 6 s |
| Excavator | Ground slam | 60 s | 3 damage to every balloon below 2 m within 4 m, armor included |
| Mobile crane | Hook yank | 45 s | Pulls one balloon in boom range down to 2 m and holds it there for 5 s |

**Determinism.** An ability use enters the simulation as a timestamped input event (tick number, ability, target). Cooldowns count sim ticks, not real time, so replays and speed changes stay exact.

## Economy and lives

Cash comes from three sources: pops during the round, a fixed income after every round, and a speed bonus for clearing early. Lives are lost only at timeout, weighted by the leftover balloons.

**Income per round**

```latex
cash_{round} = \sum_{pops} c_{balloon} + (100 + r) + cleared \cdot 2 \cdot t_{left}
```

Here c is the cash-per-pop value from the Balloons table, r is the round number, cleared is 1 if every balloon was popped before the timer ended (else 0), and t\_left is the seconds remaining when the last balloon popped. Clearing round 12 with 60 s left adds 120 on top of the 112 base income.

**Lives lost at timeout**

```latex
lives_{lost} = \sum_{alive} l_{balloon}
```

The round still pays its fixed income when lives are lost, so a bad round doesn't cause a death spiral.

**Mode price multiplier** (see Game modes) applies to vehicle purchases and upgrades, not to income.

**Balancing targets for playtests on Medium**

| By round | Player should typically own | Lives lost by a competent player |
| --- | --- | --- |
| 5 | 2 vehicles, a few tier 1–2 upgrades | 0 |
| 15 | 3 to 4 vehicles, one at tier 3 | 0 to 5 total |
| 30 | 5 to 6 vehicles, one or two at tier 4 | 10 to 30 total |
| 40 | First tier 5, a mixed fleet | Run survives with 20+ lives |

These targets get checked with headless simulation runs of scripted strategies (see Technical architecture), before any human playtest.

## Technical architecture

The simulation is a separate TypeScript package with no dependency on Three.js, React or the DOM. It advances in fixed 60 Hz ticks, takes commands in and puts snapshots and events out, so the same code runs in the browser and headless in Node.

&#91;embedded content: architecture · simulation core, UI, render, headless runner\]

The render layer draws the sim; it never changes it. Anything that affects gameplay goes through the command queue.

**Game loop.** The browser loop accumulates real time scaled by the speed setting (1×, 2×, 3×) and runs as many 1/60 s sim ticks as fit, capped at 8 per frame to avoid a spiral after a tab switch. The renderer then draws the scene interpolated between the last two snapshots with the leftover fraction as alpha.

**Determinism rules**

- All randomness comes from one seeded generator per round (for example a small PCG or xoshiro implementation), never `Math.random`.
- No `Date.now`, `performance.now` or frame delta inside the sim; only the tick counter.
- Iterate collections in a stable order (arrays or maps keyed by integer id), never by object identity or insertion from async code.
- Player inputs during a round (ability uses) are recorded as `{tick, command}` and applied at the start of that tick. Speed and pause change only how many ticks run per frame, so they never enter the sim.
- A round is fully described by: arena, wave definition, seed, starting fleet with upgrades, and the command log. That tuple is the replay format.

**Package layout**

| Package | Contents | Depends on |
| --- | --- | --- |
| `sim` | Tick loop, systems, Rapier world, grid and A\*, wave generator, data tables for vehicles, balloons and upgrades | Rapier (deterministic build) |
| `render` | react-three-fiber scene, camera, instanced balloons, vehicle models, particles, interpolation | `sim` types only, Three.js, R3F |
| `ui` | React screens, garage, HUD, run state store | `sim` types only, React |
| `app` | Vite entry that wires loop, sim, render and ui together, save and load | All of the above |
| `tools` | Headless balance runner, replay checker, determinism test | `sim` |

**Sim data model.** Entities are plain objects in typed arrays or maps keyed by integer id: vehicles, balloons, bales, spawners. Systems run in a fixed order each tick: apply commands, spawn, balloon forces, Rapier step, vehicle AI and movement, tool hits, pops and splits, economy and round end.

**Snapshot.** Per tick the sim exposes a read-only view of transforms and render-relevant state (balloon type and layer, vehicle state, tool pose). Events such as pop, split, bale drop, stuck, and life lost go into a per-tick list the renderer and UI consume for effects and numbers.

**Data-driven tuning.** Vehicle stats, upgrade tiers, balloon types and wave scripts live in JSON or TypeScript data files, not in code, so the headless runner can sweep values.

**Saving.** A run saves between rounds only: mode, arena, round number, cash, lives, owned vehicles with upgrades and last placements, and the run seed. No mid-round saves in v1.

## Physics design with Rapier

Rapier simulates balloons, hay bales and collisions; vehicles are kinematic bodies that push balloons but aren't pushed by the simulation. Damage is decided by game logic, never by collision events alone.

**Build.** Use Rapier's deterministic build (the rapier3d deterministic-compat package) so a seed plus inputs reproduces a round on any machine. Step at a fixed 60 Hz inside the simulation loop.

**Bodies**

| Object | Rapier body | Colliders | Notes |
| --- | --- | --- | --- |
| Arena floor, walls, ceiling, stalls, piles | Fixed | Cuboids; ramps as convex hulls | Built from the arena definition file |
| Vehicle chassis | Kinematic, position-based | Compound cuboids | Moved each tick to the path position; pushes balloons and bales |
| Vehicle tool | Kinematic child or none | Excavator bucket and crane hook as colliders; blades and spray as query shapes only | The bucket and hook physically knock balloons around |
| Balloon | Dynamic | Ball, low density | Gravity scale 0; buoyancy and drift as forces |
| Hay bale | Dynamic | Cuboid, heavy | Once asleep, marks its cells as obstacles and hay terrain |

**Balloon forces**, applied every tick:

- **Buoyancy:** a spring-damper force pulls the balloon toward its target float height.
- **Drift:** a small force whose direction changes every 2 to 4 s, from the seeded random number generator.
- **Flee** (modifier): a force away from any vehicle within 4 m, falling off with distance.
- **Gust** (ability): a uniform force in the chosen direction for 3 s.
- **Linear damping** around 2, so balloons feel floaty and settle instead of bouncing forever.

**Hit detection.** On each hit interval, the tool runs a shape query (a box for the header, a cone approximated by a convex hull for the spray, a sphere for the bucket and hook) against balloon colliders. The query result, sorted by balloon id for determinism, decides who takes damage.

**Collision groups**

| Group | Collides with |
| --- | --- |
| Arena | Balloons, bales, tools |
| Vehicle | Balloons, bales |
| Balloon | Arena, vehicles, other balloons, bales, tools |
| Bale | Arena, vehicles, balloons, other bales |
| Query shapes | Balloons only, never solid |

**Budget.** Plan for up to 300 live balloons and 20 bales at once. Pool balloon bodies and colliders; a popped balloon is disabled and reused, not destroyed, which also keeps handle ids stable.

## UI screens and art direction

All menus and overlays are React DOM on top of the canvas; only the arena itself is 3D. The garage is a 3D showroom with a React panel beside it.

**Screens**

| Screen | Contents | Main actions |
| --- | --- | --- |
| Main menu | Title, continue, new run | Start or resume |
| New run | Mode (Easy, Medium, Hard), arena (Barn, Yard) | Confirm |
| Garage | Owned vehicles on a turntable, shop, upgrade tree per vehicle, cash, lives, next round number | Buy, sell, upgrade, buy abilities, go to setup |
| Setup | Isometric arena with placement grid overlay, vehicle tray, targeting mode per vehicle, preview of the next wave's balloon types | Place, move, rotate, remove from arena, set targeting, start round |
| Round HUD | Timer, balloons remaining, lives, cash, ability buttons with cooldown rings, speed toggle (1×, 2×, 3×), pause | Use abilities, change speed, pause |
| Round summary | Pops, cash earned, clear bonus, lives lost, top vehicle | Continue to garage |
| Game over / victory | Round reached, stats, freeplay option after victory | Retry, freeplay, main menu |

**Upgrade tree UI.** Four columns of five tier buttons per vehicle, with locked paths grayed out and the tier 2 cap drawn as a line across the secondary path. Hovering a tier shows its effect and cost; the vehicle in the showroom previews cosmetic changes.

**Camera.** Fixed isometric angle (about 35° pitch, 45° yaw) with pan and zoom; four-way rotation in 90° steps. No free orbit, so readability stays consistent.

**Art direction**

- **Shapes:** low-poly, chunky, slightly oversized wheels and tools, like toys. Flat shading, no textures beyond a small color palette atlas.
- **Color:** farm vehicles in reds and greens, construction vehicles in yellows and oranges. Balloon types each get one saturated color that stays readable from far away; layered balloons change color per layer.
- **Feedback:** every pop gets a burst of confetti particles and a short squeaky sound. A vehicle that is stuck shows a small exclamation icon; an ineligible target shows a dim outline when hovered.
- **Lighting:** one directional light with soft shadows plus hemisphere ambient. Barn is warm and dusty; the yard is bright midday.
- **Assets:** built in Blender, exported as glTF with Draco compression; balloons rendered with instanced meshes.

## v1 scope, milestones and decisions

v1 is done when a player can finish a 20-round Easy run in either arena with all four vehicles, five balloon types, both modifiers, all abilities and the full upgrade trees.

**In scope:** 4 vehicles, 5 balloon types, 2 modifiers, 2 arenas, 3 modes, freeplay, 3 global and 4 vehicle abilities, garage with buy, sell and upgrade, local save of a run in progress.

**Out of scope for v1:** touch controls, more vehicles, arena rotation within a run, meta-progression between runs, sound design beyond placeholder effects, multiplayer, leaderboards.

**Milestones**, each ending with something playable:

1. **Sim skeleton.** Headless sim package with fixed timestep, seeded random number generator, Rapier world, one arena as colliders, balloons floating and drifting. Exit: the same seed gives the same balloon positions after 10,000 ticks, checked by a test.
2. **Render bridge.** react-three-fiber scene reading snapshots with interpolation, isometric camera, instanced balloons. Exit: 300 balloons at 60 fps on a mid-range laptop.
3. **One vehicle, one balloon.** Grid pathfinding with terrain cost, harvester AI states, Basic balloons, round timer, lives. Exit: a complete round from placement to summary.
4. **The roster.** All four vehicles, five balloon types, modifiers, targeting modes, the second arena. Exit: each balloon type has at least two vehicle answers in playtest.
5. **The meta loop.** Garage, economy, upgrade trees with caps, modes, save. Exit: a full Easy run is playable start to finish.
6. **Balance and polish.** Headless balance runs of scripted strategies, abilities, art pass, pop feedback. Exit: Medium balancing targets hit in simulated runs; three outside playtesters finish Easy.

**Decisions**

- [x] Abilities are bought in the garage and recharge on a cooldown; tier 3 of each unique path grants a vehicle ability.
- [x] The timer stays at 3:00 in every round; difficulty scales through balloons only.
- [x] No cap on vehicles per arena; cash and placement cells are the limit.
- [x] Before a round, the player sees the next wave's balloon types, not counts or timing.
- [x] The crane keeps its 3 m minimum reach, to push players toward mixed fleets.
- [x] The game is called Balloon Arena Defense.
