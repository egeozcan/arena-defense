import type { PathName } from '../generate-upgrade-svgs.js';

export const harvesterArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Sharp Cutter Blades (+25% damage) -->
    <path d="M 16 44 L 32 18 L 38 21 L 22 47 Z" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <path d="M 48 44 L 32 18 L 26 21 L 42 47 Z" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="32,23 35,32 30,35" fill="url(#vehGrad)"/>
    <!-- Cutting edges & slash arc -->
    <path d="M 12 36 Q 32 12 52 36" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="28" y1="26" x2="36" y2="18" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="34" cy="20" r="2" fill="#ffd45e"/>
    <circle cx="20" cy="34" r="1.2" fill="#ed654e"/>
    <circle cx="44" cy="34" r="1.2" fill="#ed654e"/>`,

    2: `    <!-- T2: High-Speed Rotary Reel (-20% interval) -->
    <circle cx="32" cy="33" r="15" stroke="#495d67" stroke-width="2.5" stroke-dasharray="3 3"/>
    <circle cx="32" cy="33" r="6" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- 4 Spiral Cutter Blades -->
    <path d="M 32 27 Q 44 26 45 19" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 38 33 Q 39 45 46 46" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 32 39 Q 20 40 19 47" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 26 33 Q 25 21 18 20" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Velocity arcs -->
    <path d="M 46 22 A 18 18 0 0 1 48 40" stroke="#ed654e" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3"/>
    <path d="M 18 44 A 18 18 0 0 1 16 26" stroke="#ed654e" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3"/>
    <circle cx="32" cy="33" r="2.5" fill="#ffd45e"/>`,

    3: `    <!-- T3: Armor-Piercing Teeth (Ignores armor) -->
    <!-- Steel armor plate with crack -->
    <path d="M 20 20 L 44 20 L 41 46 L 23 46 Z" fill="#36454f" stroke="#71828a" stroke-width="1.5"/>
    <path d="M 32 20 L 30 31 L 35 36 L 31 46" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <!-- Heavy carbide teeth smashing through -->
    <polygon points="26,14 32,28 30,14" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="38,14 32,28 34,14" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="32,10 32,30 30,10" fill="url(#vehGrad)" stroke="#ffd45e" stroke-width="0.8"/>
    <!-- Impact shock sparks -->
    <circle cx="32" cy="28" r="3" fill="#ffd45e" filter="url(#glow)"/>
    <line x1="28" y1="25" x2="23" y2="23" stroke="#ffd45e" stroke-width="1.2"/>
    <line x1="36" y1="25" x2="41" y2="23" stroke="#ffd45e" stroke-width="1.2"/>`,

    4: `    <!-- T4: Heavy Dual Serrated Sickle Bar (Double damage) -->
    <!-- Backing bar -->
    <rect x="12" y="29" width="40" height="7" rx="1.5" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Top serrations -->
    <polygon points="15,29 19,20 23,29" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="24,29 28,19 32,29" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="33,29 37,19 41,29" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="42,29 46,20 50,29" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Bottom opposed serrations -->
    <polygon points="19,36 23,45 27,36" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="28,36 32,46 36,36" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <polygon points="37,36 41,45 45,36" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Electric slash line -->
    <line x1="8" y1="32.5" x2="56" y2="32.5" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Titanium Thresher (Signature tool) -->
    <!-- Heavy central housing -->
    <circle cx="32" cy="33" r="10" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="32" cy="33" r="5" fill="#18241b" stroke="#ed654e" stroke-width="1.5"/>
    <!-- 6 Titanium curved scythe blades -->
    <path d="M 32 23 Q 48 16 51 24 Q 42 27 35 27" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M 40 28 Q 55 36 50 44 Q 42 38 37 34" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M 38 38 Q 42 54 33 55 Q 33 45 33 39" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M 32 43 Q 16 50 13 42 Q 22 39 29 39" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M 24 38 Q 9 30 14 22 Q 22 28 27 32" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <path d="M 26 28 Q 22 12 31 11 Q 31 21 31 27" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <!-- Radial energy burst -->
    <circle cx="32" cy="33" r="21" stroke="#ed654e" stroke-width="1.8" stroke-dasharray="2 4" filter="url(#glow)"/>
    <polygon points="32,29 34,33 32,37 30,33" fill="#ffd45e"/>`,
  },

  speed: {
    1: `    <!-- T1: Ram Air Intake (+15% move) -->
    <!-- Engine cowl -->
    <rect x="18" y="22" width="28" height="26" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Intake scoop -->
    <path d="M 22 22 L 26 14 L 38 14 L 42 22 Z" fill="#202c24" stroke="url(#metalGrad)" stroke-width="1.2"/>
    <rect x="26" y="16" width="12" height="4" rx="1" fill="#0c140e"/>
    <!-- Flow arrows -->
    <path d="M 28 10 L 32 15 L 36 10" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <line x1="32" y1="6" x2="32" y2="14" stroke="#ffd45e" stroke-width="2" stroke-linecap="round"/>`,

    2: `    <!-- T2: Dual Chrome Exhaust (+15% tool) -->
    <!-- Twin vertical pipes -->
    <rect x="22" y="18" width="6" height="28" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="36" y="18" width="6" height="28" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Rain caps -->
    <line x1="20" y1="16" x2="29" y2="13" stroke="url(#vehGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="34" y1="16" x2="43" y2="13" stroke="url(#vehGrad)" stroke-width="2" stroke-linecap="round"/>
    <!-- Exhaust flame bursts -->
    <path d="M 23 13 Q 25 6 27 13 Z" fill="#ffd45e" filter="url(#glow)"/>
    <path d="M 37 13 Q 39 6 41 13 Z" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="25" cy="8" r="1.5" fill="#ed654e"/>
    <circle cx="39" cy="8" r="1.5" fill="#ed654e"/>`,

    3: `    <!-- T3: Heavy Turbocharger (+30% move) -->
    <!-- Snail housing -->
    <path d="M 32 20 A 13 13 0 1 1 20 38 L 13 38 L 13 28 L 22 28 A 13 13 0 0 1 32 20 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Center impeller -->
    <circle cx="33" cy="33" r="8" fill="#18241b" stroke="url(#metalGrad)" stroke-width="1.2"/>
    <circle cx="33" cy="33" r="2.5" fill="#ffd45e"/>
    <!-- Vanes -->
    <path d="M 33 27 Q 38 29 37 32" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M 39 33 Q 37 38 34 37" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M 33 39 Q 28 37 29 34" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M 27 33 Q 29 28 32 29" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <!-- Velocity pressure stream -->
    <path d="M 12 33 L 5 33" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Overdrive Spoiler & Nitrous (5s overdrive) -->
    <!-- Wing mounts -->
    <line x1="20" y1="36" x2="23" y2="24" stroke="#495d67" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="44" y1="36" x2="41" y2="24" stroke="#495d67" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Rear aerodynamic wing -->
    <rect x="13" y="21" width="38" height="5" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Nitrous bottles & twin purge jets -->
    <rect x="25" y="32" width="6" height="12" rx="2" fill="#20bdf2" stroke="#ffffff" stroke-width="0.6"/>
    <rect x="33" y="32" width="6" height="12" rx="2" fill="#20bdf2" stroke="#ffffff" stroke-width="0.6"/>
    <!-- Nitrous purge flames -->
    <path d="M 16 26 L 8 36" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 48 26 L 56 36" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Dual Overdrive Reactor Cores (Permanent overdrive + 15%) -->
    <rect x="13" y="20" width="16" height="25" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <rect x="35" y="20" width="16" height="25" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <!-- Glowing core coils -->
    <line x1="16" y1="26" x2="26" y2="26" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="16" y1="32" x2="26" y2="32" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="16" y1="38" x2="26" y2="38" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="38" y1="26" x2="48" y2="26" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="38" y1="32" x2="48" y2="32" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="38" y1="38" x2="48" y2="38" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <!-- Lightning bridge -->
    <path d="M 28 32 L 31 29 L 33 35 L 36 32" stroke="#ffffff" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Mud Guard Deflectors (+0.1 traction) -->
    <!-- Heavy wheel -->
    <circle cx="32" cy="36" r="14" fill="#18241b" stroke="#36454f" stroke-width="2"/>
    <!-- Deep tractor tread lugs -->
    <rect x="30" y="20" width="4" height="4" fill="#76b995"/>
    <rect x="30" y="48" width="4" height="4" fill="#76b995"/>
    <rect x="16" y="34" width="4" height="4" fill="#76b995"/>
    <rect x="44" y="34" width="4" height="4" fill="#76b995"/>
    <!-- Overarching mudguard deflector -->
    <path d="M 14 36 A 18 18 0 0 1 50 36" stroke="url(#vehGrad)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 14 36 A 18 18 0 0 1 50 36" stroke="#ffffff" stroke-width="1" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="36" r="5" fill="url(#metalGrad)"/>`,

    2: `    <!-- T2: Heavy Axle Braces (+0.1 traction) -->
    <!-- Central differential case -->
    <circle cx="32" cy="34" r="8" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Solid axle tubes -->
    <rect x="8" y="31" width="48" height="6" rx="1.5" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Diagonal triangular tubular braces -->
    <path d="M 14 31 L 32 18 L 50 31" stroke="#76b995" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)"/>
    <circle cx="32" cy="18" r="3" fill="#ffffff"/>
    <circle cx="32" cy="34" r="3" fill="#76b995"/>`,

    3: `    <!-- T3: Front Hay/Mud Plow (Mud grip + pushes hay) -->
    <!-- Heavy V-plow blade -->
    <polygon points="32,18 12,36 17,40 32,26 47,40 52,36" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Pushed hay bales / debris -->
    <rect x="8" y="38" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <rect x="46" y="38" width="10" height="7" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <!-- Steel skid shoes -->
    <polygon points="32,26 30,38 34,38" fill="url(#metalGrad)"/>
    <line x1="22" y1="28" x2="16" y2="34" stroke="#76b995" stroke-width="1.5"/>
    <line x1="42" y1="28" x2="48" y2="34" stroke="#76b995" stroke-width="1.5"/>`,

    4: `    <!-- T4: Recovery Winch & Spikes (Oil grip + winch) -->
    <!-- Heavy winch housing -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <!-- Cable drum with steel wire -->
    <rect x="22" y="27" width="20" height="14" rx="2" fill="url(#metalGrad)"/>
    <line x1="25" y1="27" x2="25" y2="41" stroke="#36454f" stroke-width="1"/>
    <line x1="29" y1="27" x2="29" y2="41" stroke="#36454f" stroke-width="1"/>
    <line x1="33" y1="27" x2="33" y2="41" stroke="#36454f" stroke-width="1"/>
    <line x1="37" y1="27" x2="37" y2="41" stroke="#36454f" stroke-width="1"/>
    <!-- Hook extending out -->
    <path d="M 32 41 L 32 50 A 4 4 0 0 1 26 48" stroke="#76b995" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    5: `    <!-- T5: Continuous Caterpillar Tracks (Full grip + 20% speed) -->
    <!-- Heavy track loop -->
    <rect x="10" y="24" width="44" height="20" rx="10" fill="#141e17" stroke="#76b995" stroke-width="2.5" filter="url(#glow)"/>
    <!-- Drive sprockets & road wheels -->
    <circle cx="18" cy="34" r="6" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <circle cx="32" cy="34" r="5" fill="url(#metalGrad)"/>
    <circle cx="46" cy="34" r="6" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Deep track grousers -->
    <line x1="12" y1="22" x2="16" y2="22" stroke="#76b995" stroke-width="2"/>
    <line x1="24" y1="22" x2="28" y2="22" stroke="#76b995" stroke-width="2"/>
    <line x1="36" y1="22" x2="40" y2="22" stroke="#76b995" stroke-width="2"/>
    <line x1="48" y1="22" x2="52" y2="22" stroke="#76b995" stroke-width="2"/>
    <line x1="12" y1="46" x2="16" y2="46" stroke="#76b995" stroke-width="2"/>
    <line x1="24" y1="46" x2="28" y2="46" stroke="#76b995" stroke-width="2"/>
    <line x1="36" y1="46" x2="40" y2="46" stroke="#76b995" stroke-width="2"/>
    <line x1="48" y1="46" x2="52" y2="46" stroke="#76b995" stroke-width="2"/>`,
  },

  unique: {
    1: `    <!-- T1: Wide Reel (+0.5 m horizontal range) -->
    <!-- Wide reel cylinder -->
    <rect x="6" y="27" width="52" height="12" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Reel bats / dividers -->
    <line x1="10" y1="24" x2="10" y2="42" stroke="url(#metalGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="24" x2="21" y2="42" stroke="url(#metalGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="32" y1="24" x2="32" y2="42" stroke="url(#metalGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="43" y1="24" x2="43" y2="42" stroke="url(#metalGrad)" stroke-width="2" stroke-linecap="round"/>
    <line x1="54" y1="24" x2="54" y2="42" stroke="url(#metalGrad)" stroke-width="2" stroke-linecap="round"/>
    <!-- Width expansion arrows -->
    <path d="M 8 33 L 4 33 M 6 30 L 3 33 L 6 36" stroke="#56cadd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <path d="M 56 33 L 60 33 M 58 30 L 61 33 L 58 36" stroke="#56cadd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: High Reach (Reaches 2 m) -->
    <!-- Chassis base -->
    <rect x="18" y="44" width="28" height="6" rx="2" fill="url(#vehGrad)"/>
    <!-- Twin hydraulic lift cylinders elevating reel -->
    <rect x="22" y="26" width="5" height="18" rx="1.5" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <rect x="37" y="26" width="5" height="18" rx="1.5" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Raised cutting reel at height -->
    <rect x="12" y="16" width="40" height="10" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Height elevation marker -->
    <path d="M 32 40 L 32 18 M 28 22 L 32 16 L 36 22" stroke="#56cadd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <text x="50" y="24" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">2m</text>`,

    3: `    <!-- T3: Rear Header + Full Throttle (Ability unlock) -->
    <!-- Front header -->
    <rect x="10" y="16" width="44" height="7" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Chassis body -->
    <rect x="20" y="25" width="24" height="16" rx="3" fill="#202e24" stroke="url(#metalGrad)" stroke-width="1"/>
    <!-- Rear header -->
    <rect x="10" y="43" width="44" height="7" rx="2" fill="url(#vehGrad)" stroke="#56cadd" stroke-width="1.2"/>
    <!-- Throttle lightning badge -->
    <polygon points="32,26 27,33 32,33 30,40 37,32 32,32" fill="#ffd45e" stroke="#56cadd" stroke-width="0.8" filter="url(#glow)"/>`,

    4: `    <!-- T4: Raised Header (Reaches 3 m) -->
    <!-- High scissor lift / boom mast -->
    <line x1="20" y1="46" x2="38" y2="20" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="44" y1="46" x2="26" y2="20" stroke="url(#metalGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="32" cy="33" r="2.5" fill="#56cadd"/>
    <!-- Header elevated way high -->
    <rect x="10" y="12" width="44" height="9" rx="2.5" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- 3m marker -->
    <path d="M 12 36 L 12 14 M 9 17 L 12 12 L 15 17" stroke="#56cadd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <text x="50" y="20" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">3m</text>`,

    5: `    <!-- T5: Suction Thresher (Pulls balloons in) -->
    <!-- Giant central intake auger -->
    <ellipse cx="32" cy="34" rx="20" ry="12" fill="#121b14" stroke="url(#vehGrad)" stroke-width="2"/>
    <path d="M 14 34 Q 32 20 50 34 Q 32 48 14 34 Z" fill="none" stroke="#56cadd" stroke-width="2" filter="url(#glow)"/>
    <!-- Spiral suction vortex -->
    <path d="M 32 24 A 10 10 0 0 1 42 34 A 8 8 0 0 1 34 42 A 6 6 0 0 1 26 34" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <!-- Inbound balloon suction particles -->
    <circle cx="16" cy="22" r="3.5" fill="#fa3b46" opacity="0.8"/>
    <circle cx="48" cy="22" r="3" fill="#fa3b46" opacity="0.8"/>
    <path d="M 18 25 L 25 29" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 46 25 L 39 29" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`,
  },
};
