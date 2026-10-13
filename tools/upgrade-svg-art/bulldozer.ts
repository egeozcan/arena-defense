import type { PathName } from '../generate-upgrade-svgs.js';

export const bulldozerArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Hardened Blade Edge (+25% damage) -->
    <!-- Heavy dozer blade moldboard -->
    <path d="M 12 24 L 52 24 L 48 42 L 16 42 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Hardened bolt-on cutting edge bar -->
    <rect x="14" y="38" width="36" height="6" rx="1" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1"/>
    <!-- Cutting edge sparks -->
    <circle cx="22" cy="45" r="1.5" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="32" cy="46" r="2" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="42" cy="45" r="1.5" fill="#ffd45e" filter="url(#glow)"/>`,

    2: `    <!-- T2: High-Cycle Hydraulic Lift (-20% interval) -->
    <!-- Heavy hydraulic cylinder -->
    <rect x="16" y="22" width="12" height="24" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="36" y="22" width="12" height="24" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Rapid vertical cycle arrows -->
    <path d="M 22 14 L 22 20 M 19 17 L 22 14 L 25 17" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 42 14 L 42 20 M 39 17 L 42 14 L 45 17" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    3: `    <!-- T3: Armor-Breaker Rippers (75% to armor) -->
    <!-- Heavy single-shank ripper tooth tearing through armor plate -->
    <path d="M 28 16 L 36 16 L 38 34 L 26 48 L 22 42 L 32 32 Z" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="1"/>
    <polygon points="26,48 20,44 23,38" fill="#ffd45e"/>
    <!-- Armor fracture lines -->
    <rect x="12" y="38" width="40" height="8" rx="1.5" fill="#36454f" stroke="#71828a" stroke-width="1"/>
    <path d="M 24 38 L 24 46" stroke="#ed654e" stroke-width="2" filter="url(#glow)"/>`,

    4: `    <!-- T4: Reinforced Heavy Moldboard (Double damage) -->
    <!-- Heavy curved moldboard with welded box-beam braces -->
    <path d="M 10 22 L 54 22 L 50 42 L 14 42 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Heavy horizontal structural ribs -->
    <line x1="12" y1="28" x2="52" y2="28" stroke="url(#metalGrad)" stroke-width="2.5"/>
    <line x1="13" y1="35" x2="51" y2="35" stroke="url(#metalGrad)" stroke-width="2.5"/>
    <line x1="8" y1="46" x2="56" y2="46" stroke="#ed654e" stroke-width="2" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Spiked Ram Blade (Signature tool) -->
    <path d="M 8 20 L 56 20 L 52 42 L 12 42 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <!-- Heavy steel impact spikes -->
    <polygon points="16,42 20,52 24,42" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1"/>
    <polygon points="28,42 32,54 36,42" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1"/>
    <polygon points="40,42 44,52 48,42" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1"/>
    <circle cx="32" cy="50" r="3" fill="#ffd45e" filter="url(#glow)"/>`,
  },

  speed: {
    1: `    <!-- T1: High-Volume Desert Snorkel (+15% move) -->
    <rect x="18" y="26" width="28" height="20" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Desert pre-cleaner snorkel -->
    <rect x="36" y="16" width="6" height="22" rx="2" fill="url(#metalGrad)"/>
    <ellipse cx="39" cy="14" rx="5" ry="3" fill="#ffd45e"/>
    <line x1="12" y1="36" x2="22" y2="36" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: Vertical Straight-Pipe Exhaust (+15% tool) -->
    <rect x="30" y="16" width="7" height="30" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Exhaust smoke & spark embers -->
    <path d="M 31 14 Q 33.5 6 36 14 Z" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="33.5" cy="8" r="2" fill="#ed654e"/>`,

    3: `    <!-- T3: Dual Turbochargers (+30% move) -->
    <circle cx="24" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="40" cy="33" r="9" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="24" cy="33" r="4" fill="#ffd45e"/>
    <circle cx="40" cy="33" r="4" fill="#ffd45e"/>`,

    4: `    <!-- T4: Overdrive Torque Converter (5s overdrive) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="7" fill="#ffd45e" filter="url(#glow)"/>
    <polygon points="32,24 35,31 39,31 34,35 36,42 32,37 28,42 30,35 25,31 29,31" fill="#ffffff"/>`,

    5: `    <!-- T5: Armored Overdrive Power Plant (Permanent overdrive + 15%) -->
    <rect x="12" y="22" width="40" height="22" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <line x1="18" y1="28" x2="46" y2="28" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <line x1="18" y1="33" x2="46" y2="33" stroke="#ffd45e" stroke-width="2.5" filter="url(#glow)"/>
    <line x1="18" y1="38" x2="46" y2="38" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Track Frame Mud Guards (+0.1 traction) -->
    <rect x="10" y="28" width="44" height="16" rx="8" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <!-- Heavy rock shield guard -->
    <rect x="8" y="24" width="48" height="6" rx="2" fill="url(#vehGrad)" stroke="#76b995" stroke-width="1"/>`,

    2: `    <!-- T2: Diagonal Equalizer Bar (+0.1 traction) -->
    <rect x="12" y="34" width="40" height="6" rx="2" fill="url(#metalGrad)"/>
    <!-- Triangular equalizer bar pivot -->
    <polygon points="32,20 18,34 46,34" fill="#18241b" stroke="#76b995" stroke-width="2.5" filter="url(#glow)"/>
    <circle cx="32" cy="23" r="3" fill="#ffffff"/>`,

    3: `    <!-- T3: Serrated Hay Crusher Bar (Mud grip + pushes/crushes hay) -->
    <!-- Heavy crusher roller -->
    <rect x="10" y="30" width="44" height="12" rx="3" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Serrated teeth on roller -->
    <polygon points="14,30 17,24 20,30" fill="url(#vehGrad)"/>
    <polygon points="26,30 29,24 32,30" fill="url(#vehGrad)"/>
    <polygon points="38,30 41,24 44,30" fill="url(#vehGrad)"/>
    <!-- Crushed hay fragments -->
    <rect x="20" y="44" width="8" height="4" rx="1" fill="#ffd45e"/>
    <rect x="36" y="44" width="8" height="4" rx="1" fill="#ffd45e"/>`,

    4: `    <!-- T4: Heavy Towing Winch (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <path d="M 32 41 L 32 52 A 5 5 0 0 1 24 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Extreme-Service Single Grousers (Full grip + 20% speed) -->
    <rect x="10" y="26" width="44" height="18" rx="9" fill="#18241b" stroke="#76b995" stroke-width="2.5" filter="url(#glow)"/>
    <circle cx="18" cy="35" r="5" fill="url(#vehGrad)"/>
    <circle cx="32" cy="35" r="5" fill="url(#metalGrad)"/>
    <circle cx="46" cy="35" r="5" fill="url(#vehGrad)"/>
    <!-- Deep single aggressive grousers -->
    <line x1="16" y1="46" x2="16" y2="54" stroke="#76b995" stroke-width="2.5"/>
    <line x1="32" y1="46" x2="32" y2="54" stroke="#76b995" stroke-width="2.5"/>
    <line x1="48" y1="46" x2="48" y2="54" stroke="#76b995" stroke-width="2.5"/>`,
  },

  unique: {
    1: `    <!-- T1: Extended Blade Wings (Reaches 3.3 m) -->
    <rect x="14" y="26" width="36" height="14" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Angled wing extensions on sides -->
    <polygon points="14,26 6,22 8,40 14,40" fill="#56cadd" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="50,26 58,22 56,40 50,40" fill="#56cadd" stroke="#ffffff" stroke-width="0.8"/>
    <text x="44" y="20" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">3.3m</text>`,

    2: `    <!-- T2: Curved Parabolic Blade (128° wide sweep) -->
    <!-- Wide curved U-blade -->
    <path d="M 8 22 Q 32 38 56 22 L 52 38 Q 32 48 12 38 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Sweeping angular arc -->
    <path d="M 8 40 Q 32 52 56 40" stroke="#56cadd" stroke-width="2" fill="none" filter="url(#glow)"/>
    <text x="32" y="32" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">128°</text>`,

    3: `    <!-- T3: Blade Sweep & Crush (Blade sweep unlock) -->
    <!-- Spiked blade sweeping through crowd -->
    <path d="M 10 24 L 54 24 L 50 40 L 14 40 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Sweep motion blur trail -->
    <path d="M 12 44 Q 32 54 52 44" stroke="#56cadd" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <polygon points="53,42 55,47 49,46" fill="#56cadd"/>
    <!-- Crushed hay icon -->
    <rect x="26" y="28" width="12" height="7" rx="1.5" fill="#ffd45e"/>`,

    4: `    <!-- T4: High-Lift Tower Mast (Reaches 2.8 m high) -->
    <!-- Tall vertical lift mast towers -->
    <rect x="20" y="14" width="6" height="34" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <rect x="38" y="14" width="6" height="34" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Blade hoisted high in air -->
    <rect x="10" y="16" width="44" height="10" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <text x="46" y="34" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">2.8m</text>`,

    5: `    <!-- T5: 4 m Giant Demolition Blade (4 m wide demolition blade) -->
    <!-- Massive heavy armored blade spanning entire width -->
    <path d="M 4 20 L 60 20 L 56 44 L 8 44 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <line x1="4" y1="44" x2="60" y2="44" stroke="#56cadd" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <!-- Reinforced teeth -->
    <polygon points="12,44 16,52 20,44" fill="url(#metalGrad)"/>
    <polygon points="28,44 32,52 36,44" fill="url(#metalGrad)"/>
    <polygon points="44,44 48,52 52,44" fill="url(#metalGrad)"/>
    <text x="32" y="34" font-family="sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">4m DEMO</text>`,
  },
};
