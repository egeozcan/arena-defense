import type { PathName } from '../generate-upgrade-svgs.js';

export const mixerArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Pressurized Slurry Jet (+25% damage) -->
    <!-- Heavy discharge chute nozzle -->
    <path d="M 16 33 L 30 25 L 30 41 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="10" y="29" width="8" height="8" rx="1.5" fill="url(#metalGrad)"/>
    <!-- Concrete slurry splatter droplets -->
    <circle cx="38" cy="27" r="3" fill="#cfdade"/>
    <circle cx="48" cy="33" r="4.5" fill="#cfdade" stroke="#ed654e" stroke-width="1.2" filter="url(#glow)"/>
    <circle cx="40" cy="40" r="3" fill="#cfdade"/>
    <circle cx="56" cy="35" r="2" fill="#ffd45e"/>`,

    2: `    <!-- T2: High-Speed Drum Rotation (-20% interval) -->
    <!-- Concrete mixer rotating drum barrel -->
    <polygon points="18,33 26,20 42,20 48,33 42,46 26,46" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Spiral internal churning flight blades -->
    <path d="M 26 20 Q 34 33 42 46" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <!-- Circular rotation arrows -->
    <path d="M 44 16 A 18 18 0 0 1 48 40" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" fill="none"/>`,

    3: `    <!-- T3: Armor-Crushing Slag (Ignores armor) -->
    <!-- Armored plate cracked in half -->
    <rect x="36" y="20" width="8" height="26" rx="2" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <!-- Dense concrete boulder laced with rebar spikes -->
    <circle cx="24" cy="33" r="10" fill="#8ba0ab" stroke="#ffffff" stroke-width="1"/>
    <line x1="20" y1="25" x2="38" y2="33" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="38" cy="33" r="3" fill="#ed654e" filter="url(#glow)"/>`,

    4: `    <!-- T4: Dual Pneumatic Discharge Pump (Double damage) -->
    <!-- Heavy pump housing -->
    <rect x="14" y="22" width="22" height="22" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <rect x="32" y="27" width="16" height="12" rx="2" fill="url(#metalGrad)"/>
    <!-- Intense dual slurry blast jets -->
    <line x1="46" y1="30" x2="58" y2="24" stroke="#ed654e" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="46" y1="36" x2="58" y2="42" stroke="#ed654e" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Concrete Mortar Cannon (Signature tool) -->
    <!-- Massive heavy mortar cannon barrel -->
    <path d="M 14 42 L 38 18 L 46 26 L 22 50 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <!-- Massive explosive concrete projectile launched -->
    <rect x="42" y="12" width="14" height="14" rx="3" fill="#cfdade" stroke="#ed654e" stroke-width="1.5" filter="url(#glow)"/>
    <!-- Explosive muzzle flash aura -->
    <circle cx="40" cy="20" r="14" stroke="#ffd45e" stroke-width="2" stroke-dasharray="2 3" fill="none" filter="url(#glow)"/>`,
  },

  speed: {
    1: `    <!-- T1: High-Flow Truck Snorkel (+15% move) -->
    <rect x="18" y="26" width="28" height="20" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Snorkel tube -->
    <path d="M 38 40 L 38 18 L 44 14" stroke="url(#metalGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <ellipse cx="44" cy="14" rx="4" ry="2" fill="#ffd45e"/>
    <line x1="10" y1="36" x2="20" y2="36" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: High-Torque Drum Drive Motor (+15% tool) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="6" fill="url(#metalGrad)"/>
    <path d="M 46 25 A 18 18 0 0 1 42 45" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    3: `    <!-- T3: Turbo-Diesel Power Pack (+30% move) -->
    <circle cx="24" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="40" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="24" cy="33" r="4" fill="#ffd45e"/>
    <circle cx="40" cy="33" r="4" fill="#ffd45e"/>`,

    4: `    <!-- T4: Overdrive Drum Accelerator (5s overdrive) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="7" fill="#ffd45e" filter="url(#glow)"/>
    <polygon points="32,24 35,31 39,31 34,35 36,42 32,37 28,42 30,35 25,31 29,31" fill="#ffffff"/>`,

    5: `    <!-- T5: Heavy Overdrive Power Plant (Permanent overdrive + 15%) -->
    <rect x="12" y="22" width="40" height="22" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <line x1="18" y1="28" x2="46" y2="28" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <line x1="18" y1="33" x2="46" y2="33" stroke="#ffd45e" stroke-width="2.5" filter="url(#glow)"/>
    <line x1="18" y1="38" x2="46" y2="38" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Flared Wheel Mud Guards (+0.1 traction) -->
    <circle cx="32" cy="36" r="13" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <path d="M 14 36 A 18 18 0 0 1 50 36" stroke="url(#vehGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="36" r="4" fill="url(#metalGrad)"/>`,

    2: `    <!-- T2: Heavy Tandem Bogie Axle Bracing (+0.1 traction) -->
    <polygon points="18,36 32,28 46,36 32,32" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <circle cx="32" cy="30" r="4.5" fill="url(#vehGrad)" stroke="#76b995" stroke-width="1.5"/>
    <circle cx="18" cy="36" r="4" fill="#76b995"/>
    <circle cx="46" cy="36" r="4" fill="#76b995"/>`,

    3: `    <!-- T3: Front Clearance Wedge (Mud grip + pushes hay) -->
    <polygon points="32,20 12,38 16,42 32,28 48,42 52,38" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <rect x="6" y="40" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <rect x="48" y="40" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>`,

    4: `    <!-- T4: Heavy Capstan Winch (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <path d="M 32 41 L 32 52 A 5 5 0 0 1 24 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: All-Wheel 8x8 Traction Drive (Full grip + 20% speed) -->
    <rect x="8" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="22" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="36" y="32" width="10" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="48" y="32" width="8" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="6" y="26" width="52" height="6" rx="2" fill="url(#vehGrad)"/>`,
  },

  unique: {
    1: `    <!-- T1: Telescopic Concrete Chute (Reaches 8 m) -->
    <!-- Telescoping discharge chute trough -->
    <path d="M 12 44 L 28 32 L 46 22 L 54 18" stroke="url(#vehGrad)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="28" cy="32" r="3" fill="#ffffff"/>
    <circle cx="46" cy="22" r="3" fill="#ffffff"/>
    <!-- Concrete flow stream -->
    <line x1="54" y1="18" x2="60" y2="15" stroke="#56cadd" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <text x="44" y="34" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">8m</text>`,

    2: `    <!-- T2: Swirl Nozzle Splash (Splash grows to 1.75 m) -->
    <!-- Flared discharge chute nozzle -->
    <path d="M 18 33 L 32 24 L 32 42 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Expanding 1.75m circular splash puddle -->
    <ellipse cx="44" cy="33" rx="14" ry="9" fill="#56cadd" fill-opacity="0.25" stroke="#56cadd" stroke-width="1.5" filter="url(#glow)"/>
    <circle cx="44" cy="33" r="3" fill="#ffffff"/>
    <circle cx="48" cy="30" r="1.5" fill="#56cadd"/>
    <text x="36" y="20" font-family="sans-serif" font-size="7" font-weight="900" fill="#56cadd">1.75m</text>`,

    3: `    <!-- T3: Wet Concrete & Slab Drop (Slab drop unlock) -->
    <!-- Heavy solid slab falling -->
    <rect x="20" y="16" width="24" height="12" rx="2" fill="#8ba0ab" stroke="#ffffff" stroke-width="1"/>
    <!-- Downward drop impact -->
    <path d="M 32 28 L 32 46 M 26 40 L 32 46 L 38 40" stroke="#56cadd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <!-- Wet splash slowing ring -->
    <ellipse cx="32" cy="48" rx="16" ry="6" fill="#18241b" stroke="#ffd45e" stroke-width="1.5"/>`,

    4: `    <!-- T4: Steel-Fiber Reinforced Mix (Full damage to armor) -->
    <!-- Dense concrete cube block -->
    <rect x="20" y="20" width="24" height="24" rx="3" fill="#8ba0ab" stroke="#ffffff" stroke-width="1.2"/>
    <!-- Interlaced steel rebar mesh inside -->
    <line x1="26" y1="20" x2="26" y2="44" stroke="#56cadd" stroke-width="1.5" filter="url(#glow)"/>
    <line x1="38" y1="20" x2="38" y2="44" stroke="#56cadd" stroke-width="1.5" filter="url(#glow)"/>
    <line x1="20" y1="26" x2="44" y2="26" stroke="#56cadd" stroke-width="1.5" filter="url(#glow)"/>
    <line x1="20" y1="38" x2="44" y2="38" stroke="#56cadd" stroke-width="1.5" filter="url(#glow)"/>
    <!-- Shattered armor symbol -->
    <path d="M 46 16 L 54 24" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round"/>`,

    5: `    <!-- T5: Mega Crater Slurry Mortar (2.5 m splash) -->
    <!-- Massive explosive concrete crater -->
    <ellipse cx="32" cy="34" rx="22" ry="12" fill="#18241b" stroke="#56cadd" stroke-width="2" filter="url(#glow)"/>
    <ellipse cx="32" cy="34" rx="14" ry="7" fill="#cfdade" fill-opacity="0.3"/>
    <!-- Concrete blast shrapnel flying out -->
    <circle cx="16" cy="24" r="2.5" fill="#ffffff" filter="url(#glow)"/>
    <circle cx="48" cy="24" r="2.5" fill="#ffffff" filter="url(#glow)"/>
    <circle cx="20" cy="44" r="2" fill="#ffffff"/>
    <circle cx="44" cy="44" r="2" fill="#ffffff"/>
    <text x="32" y="37" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#ffd45e" text-anchor="middle">2.5m CRATER</text>`,
  },
};
