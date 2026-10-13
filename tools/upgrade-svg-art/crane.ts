import type { PathName } from '../generate-upgrade-svgs.js';

export const craneArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Hardened Steel Spike (+25% damage) -->
    <!-- Cable block -->
    <rect x="26" y="16" width="12" height="12" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Heavy crane hook with sharp piercing point -->
    <path d="M 32 28 L 32 38 A 7 7 0 0 1 20 38 L 20 34" stroke="url(#metalGrad)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <polygon points="18,34 22,34 20,26" fill="#ed654e" stroke="#ffffff" stroke-width="0.6"/>
    <!-- Pierce spark -->
    <circle cx="20" cy="26" r="2" fill="#ffd45e" filter="url(#glow)"/>`,

    2: `    <!-- T2: High-Speed Hoist Drum (-20% interval) -->
    <!-- Winch drum with coiled cable -->
    <rect x="18" y="24" width="28" height="18" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <line x1="24" y1="24" x2="24" y2="42" stroke="#ffffff" stroke-width="1"/>
    <line x1="32" y1="24" x2="32" y2="42" stroke="#ffffff" stroke-width="1"/>
    <line x1="40" y1="24" x2="40" y2="42" stroke="#ffffff" stroke-width="1"/>
    <!-- Cable rushing down with velocity lines -->
    <line x1="32" y1="42" x2="32" y2="56" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="28" y1="46" x2="28" y2="52" stroke="#ed654e" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="46" x2="36" y2="52" stroke="#ed654e" stroke-width="1.5" stroke-linecap="round"/>`,

    3: `    <!-- T3: Armor Breaker Talon (Ignores armor) -->
    <!-- Pierced steel armor plate -->
    <rect x="16" y="28" width="32" height="18" rx="2" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <!-- Heavy carbide punch talon driving straight through -->
    <path d="M 32 14 L 32 40" stroke="url(#metalGrad)" stroke-width="5" stroke-linecap="round"/>
    <polygon points="29,40 35,40 32,50" fill="#ffd45e" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Fracture lines -->
    <path d="M 32 38 L 22 42 M 32 38 L 42 42" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Heavy Kinetic Ram (Double damage) -->
    <!-- Massive counterweighted hook block -->
    <rect x="20" y="16" width="24" height="20" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="32" cy="26" r="4" fill="url(#metalGrad)"/>
    <!-- Strike energy vectors -->
    <path d="M 32 36 L 32 48" stroke="#ed654e" stroke-width="4.5" stroke-linecap="round" filter="url(#glow)"/>
    <polygon points="28,48 36,48 32,56" fill="#ffd45e"/>
    <circle cx="32" cy="52" r="3" fill="#ffffff" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Twin Hooks (Twin hooks strike two balloons) -->
    <rect x="16" y="16" width="32" height="10" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Left Hook -->
    <path d="M 22 26 L 22 38 A 6 6 0 0 1 12 38 L 12 34" stroke="url(#metalGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="12" cy="34" r="2" fill="#ed654e" filter="url(#glow)"/>
    <!-- Right Hook -->
    <path d="M 42 26 L 42 38 A 6 6 0 0 1 32 38 L 32 34" stroke="url(#metalGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="34" r="2" fill="#ed654e" filter="url(#glow)"/>
    <!-- Double strike energy arc -->
    <path d="M 10 44 Q 27 50 44 44" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,
  },

  speed: {
    1: `    <!-- T1: High-Power Snorkel Intake (+15% move) -->
    <rect x="18" y="26" width="28" height="20" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Tall snorkel intake pipe -->
    <path d="M 38 40 L 38 18 L 44 14" stroke="url(#metalGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <!-- Air intake cap & flow arrows -->
    <ellipse cx="44" cy="14" rx="4" ry="2" fill="#ffd45e"/>
    <path d="M 48 10 L 44 14" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: Rapid Slew Turntable (+15% tool) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="6" fill="url(#metalGrad)"/>
    <!-- Circular slew motion arcs -->
    <path d="M 46 25 A 18 18 0 0 1 42 45" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <polygon points="41,47 46,45 45,40" fill="#ffd45e"/>`,

    3: `    <!-- T3: Twin Turbocharger (+30% move) -->
    <!-- Twin snail turbines -->
    <circle cx="24" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="40" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="24" cy="33" r="4" fill="#ffd45e"/>
    <circle cx="40" cy="33" r="4" fill="#ffd45e"/>
    <line x1="24" y1="20" x2="40" y2="20" stroke="url(#metalGrad)" stroke-width="3"/>`,

    4: `    <!-- T4: Overdrive Hoist Motor (5s overdrive) -->
    <rect x="16" y="24" width="32" height="18" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="24" cy="33" r="5" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="40" cy="33" r="5" fill="#ffd45e" filter="url(#glow)"/>
    <!-- Lightning connection -->
    <path d="M 28 33 L 36 33" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,

    5: `    <!-- T5: Continuous Overdrive Reactor (Permanent overdrive + 15%) -->
    <rect x="12" y="22" width="40" height="22" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <line x1="18" y1="28" x2="46" y2="28" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <line x1="18" y1="33" x2="46" y2="33" stroke="#ffd45e" stroke-width="2.5" filter="url(#glow)"/>
    <line x1="18" y1="38" x2="46" y2="38" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <circle cx="32" cy="14" r="4" fill="#ffd45e" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Outrigger Stabilizer Pads (+0.1 traction) -->
    <!-- Outrigger beam -->
    <rect x="10" y="32" width="44" height="6" rx="1.5" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Heavy ground pads -->
    <rect x="8" y="38" width="8" height="6" rx="1" fill="url(#metalGrad)"/>
    <rect x="48" y="38" width="8" height="6" rx="1" fill="url(#metalGrad)"/>
    <line x1="6" y1="44" x2="18" y2="44" stroke="#76b995" stroke-width="2"/>
    <line x1="46" y1="44" x2="58" y2="44" stroke="#76b995" stroke-width="2"/>`,

    2: `    <!-- T2: Heavy Tubular Crossmembers (+0.1 traction) -->
    <!-- Chassis beams -->
    <rect x="14" y="18" width="6" height="32" rx="2" fill="url(#metalGrad)"/>
    <rect x="44" y="18" width="6" height="32" rx="2" fill="url(#metalGrad)"/>
    <!-- X-Crossmember tubular brace -->
    <line x1="20" y1="22" x2="44" y2="46" stroke="#76b995" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="20" y1="46" x2="44" y2="22" stroke="#76b995" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="32" cy="34" r="3" fill="#ffffff"/>`,

    3: `    <!-- T3: Front Clearance Blade (Mud grip + pushes hay) -->
    <polygon points="32,20 12,38 16,42 32,28 48,42 52,38" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Swept hay blocks -->
    <rect x="6" y="40" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <rect x="48" y="40" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>`,

    4: `    <!-- T4: High-Tonnage Recovery Spool (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <!-- High-tensile cable & heavy hook -->
    <path d="M 32 41 L 32 52 A 5 5 0 0 1 24 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: All-Terrain 8x8 Heavy Drive (Full grip + 20% speed) -->
    <!-- 4 Axle tires on side view -->
    <rect x="8" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="22" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="36" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="48" y="32" width="8" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="6" y="26" width="52" height="6" rx="2" fill="url(#vehGrad)"/>`,
  },

  unique: {
    1: `    <!-- T1: Telescopic Lattice Extension (+2 m reach to 8 m) -->
    <!-- Lattice boom segments -->
    <line x1="12" y1="46" x2="48" y2="16" stroke="url(#vehGrad)" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="48" y1="16" x2="56" y2="10" stroke="#56cadd" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <!-- Internal lattice lacing -->
    <path d="M 16 42 L 20 34 L 28 36 L 32 28 L 40 30 L 44 22" stroke="#ffffff" stroke-width="1" fill="none"/>
    <text x="46" y="32" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">8m</text>`,

    2: `    <!-- T2: Rapid Hook Swing (25% faster swing) -->
    <!-- Boom tip pulley -->
    <circle cx="32" cy="18" r="4" fill="url(#vehGrad)"/>
    <!-- Swinging cable pendulum -->
    <line x1="32" y1="20" x2="44" y2="38" stroke="url(#metalGrad)" stroke-width="2"/>
    <circle cx="44" cy="38" r="3" fill="#ffffff"/>
    <!-- Fast swing motion arc -->
    <path d="M 20 44 Q 32 48 46 38" stroke="#56cadd" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <polygon points="47,36 49,42 43,40" fill="#56cadd"/>`,

    3: `    <!-- T3: Heavy Spiked Wrecking Ball (Hook yank unlock) -->
    <line x1="32" y1="14" x2="32" y2="30" stroke="url(#metalGrad)" stroke-width="2.5"/>
    <!-- Spiked heavy wrecking ball -->
    <circle cx="32" cy="36" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <!-- Steel spikes -->
    <polygon points="32,27 34,23 30,23" fill="url(#metalGrad)"/>
    <polygon points="32,45 34,49 30,49" fill="url(#metalGrad)"/>
    <polygon points="23,36 19,34 19,38" fill="url(#metalGrad)"/>
    <polygon points="41,36 45,34 45,38" fill="url(#metalGrad)"/>
    <!-- Explosive splash shockwave rings -->
    <circle cx="32" cy="36" r="16" stroke="#56cadd" stroke-width="1.8" stroke-dasharray="2 3" fill="none" filter="url(#glow)"/>`,

    4: `    <!-- T4: Electromagnet Array (Magnet slows/lowers carriers) -->
    <!-- Heavy industrial electromagnet coil -->
    <rect x="20" y="20" width="24" height="12" rx="2" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <rect x="24" y="32" width="16" height="4" fill="url(#metalGrad)"/>
    <!-- Magnetic flux lines pulling carrier balloon down -->
    <path d="M 16 36 Q 32 50 48 36" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 20 40 Q 32 52 44 40" stroke="#56cadd" stroke-width="1.5" stroke-linecap="round" fill="none" stroke-dasharray="2 2"/>
    <!-- Carrier balloon silhouette being lowered -->
    <circle cx="32" cy="46" r="4.5" fill="#ffc52b" stroke="#ffffff" stroke-width="0.8"/>`,

    5: `    <!-- T5: Mobile Tower Crane (Dual splash hooks, 12 m reach, 14 m high) -->
    <!-- Tall vertical lattice tower -->
    <line x1="24" y1="56" x2="24" y2="16" stroke="url(#vehGrad)" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Horizontal lattice jib -->
    <line x1="12" y1="18" x2="54" y2="18" stroke="url(#vehGrad)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="18" r="3" fill="#ffffff"/>
    <!-- Dual splash hooks suspended -->
    <line x1="36" y1="20" x2="36" y2="34" stroke="url(#metalGrad)" stroke-width="1.5"/>
    <circle cx="36" cy="36" r="2.5" fill="#56cadd" filter="url(#glow)"/>
    <line x1="48" y1="20" x2="48" y2="34" stroke="url(#metalGrad)" stroke-width="1.5"/>
    <circle cx="48" cy="36" r="2.5" fill="#56cadd" filter="url(#glow)"/>
    <text x="32" y="52" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#56cadd">14m TOWER</text>`,
  },
};
