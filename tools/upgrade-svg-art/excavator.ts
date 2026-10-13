import type { PathName } from '../generate-upgrade-svgs.js';

export const excavatorArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Hardened Bucket Teeth (+25% damage) -->
    <!-- Curved heavy bucket shell -->
    <path d="M 16 22 L 38 20 L 46 36 L 24 38 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- 4 Hardened Chisel Teeth -->
    <polygon points="38,20 44,14 42,22" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <polygon points="41,25 48,20 45,28" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <polygon points="44,30 52,26 47,33" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <polygon points="46,36 54,34 47,40" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.6"/>
    <!-- Slash impact sparks -->
    <circle cx="50" cy="24" r="2" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="54" cy="30" r="1.5" fill="#ed654e"/>`,

    2: `    <!-- T2: Quick-Cycle Hydraulics (-20% interval) -->
    <!-- Heavy hydraulic cylinder -->
    <rect x="14" y="27" width="22" height="12" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Hard-chrome cylinder rod -->
    <rect x="36" y="30" width="16" height="6" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Dual-action fluid ports -->
    <circle cx="20" cy="23" r="3" fill="#ed654e"/>
    <circle cx="30" cy="23" r="3" fill="#ed654e"/>
    <!-- Rapid cyclic stroke arrows -->
    <path d="M 40 24 L 52 24 M 48 20 L 52 24 L 48 28" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 48 42 L 36 42 M 40 38 L 36 42 L 40 46" stroke="#ed654e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    3: `    <!-- T3: Armor Shatter Wedge (50% bonus vs armor) -->
    <!-- Thick armor plate shattering into two -->
    <polygon points="26,18 42,18 36,32 20,32" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <polygon points="22,36 38,36 44,50 28,50" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <!-- Heavy tungsten wedge punch driving through -->
    <polygon points="32,10 46,34 32,38 18,34" fill="url(#metalGrad)" stroke="#ffd45e" stroke-width="1.2"/>
    <circle cx="32" cy="34" r="4" fill="#ffd45e" filter="url(#glow)"/>
    <path d="M 24 34 L 14 36 M 40 34 L 50 36" stroke="#ed654e" stroke-width="2" stroke-linecap="round"/>`,

    4: `    <!-- T4: Reinforced Heavy Dipper (Double damage) -->
    <!-- Heavy box-beam dipper arm -->
    <path d="M 12 36 L 44 18 L 48 25 L 16 43 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Steel gusset reinforcement plates -->
    <polygon points="22,30 38,21 39,26 23,35" fill="url(#metalGrad)" stroke="#36454f" stroke-width="0.8"/>
    <circle cx="15" cy="40" r="3" fill="#36454f"/>
    <circle cx="45" cy="22" r="3" fill="#36454f"/>
    <!-- Heavy strike energy line -->
    <line x1="8" y1="46" x2="56" y2="19" stroke="#ed654e" stroke-width="2" stroke-dasharray="3 3" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Demolition Jaw (Signature tool) -->
    <!-- Hydraulic pulverizer main jaw -->
    <path d="M 14 33 L 34 22 L 48 18 L 42 27 L 34 29 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Moving lower jaw -->
    <path d="M 14 33 L 34 37 L 48 48 L 42 39 L 34 37 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Massive jagged crushing teeth -->
    <polygon points="38,25 44,22 41,28" fill="url(#metalGrad)"/>
    <polygon points="38,38 44,42 41,35" fill="url(#metalGrad)"/>
    <polygon points="32,27 36,25 34,30" fill="url(#metalGrad)"/>
    <polygon points="32,36 36,38 34,33" fill="url(#metalGrad)"/>
    <!-- Main pivot pin & crushing burst -->
    <circle cx="20" cy="33" r="5" fill="#18241b" stroke="#ed654e" stroke-width="2"/>
    <circle cx="42" cy="33" r="3" fill="#ffd45e" filter="url(#glow)"/>`,
  },

  speed: {
    1: `    <!-- T1: Turbo Diesel Intake (+15% move) -->
    <rect x="18" y="24" width="28" height="22" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Honeycomb intake mesh -->
    <rect x="22" y="28" width="20" height="14" rx="1.5" fill="#18241b" stroke="url(#metalGrad)" stroke-width="1"/>
    <line x1="26" y1="28" x2="26" y2="42" stroke="#36454f" stroke-width="1"/>
    <line x1="32" y1="28" x2="32" y2="42" stroke="#36454f" stroke-width="1"/>
    <line x1="38" y1="28" x2="38" y2="42" stroke="#36454f" stroke-width="1"/>
    <!-- Velocity inflow arrows -->
    <path d="M 12 35 L 20 35 M 16 31 L 20 35 L 16 39" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: High-Volume Slew Motor (+15% tool) -->
    <!-- Heavy slewing bearing ring -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#metalGrad)" stroke-width="2.5"/>
    <circle cx="32" cy="33" r="7" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Circular rotation arrows -->
    <path d="M 46 25 A 18 18 0 0 1 42 45" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 18 41 A 18 18 0 0 1 22 21" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <polygon points="41,47 46,45 45,40" fill="#ffd45e"/>
    <polygon points="23,19 18,21 19,26" fill="#ffd45e"/>`,

    3: `    <!-- T3: High-Torque Turbo System (+30% move) -->
    <path d="M 34 22 A 12 12 0 1 1 22 38 L 14 38 L 14 30 L 24 30 A 12 12 0 0 1 34 22 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="34" cy="34" r="7" fill="#18241b" stroke="url(#metalGrad)" stroke-width="1.5"/>
    <circle cx="34" cy="34" r="3" fill="#ffd45e"/>
    <!-- Intercooler tube -->
    <path d="M 14 34 L 8 34" stroke="#ffd45e" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Kinetic Energy Booster (5s overdrive) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <!-- Spinning counterweights -->
    <rect x="22" y="31" width="20" height="4" rx="1" fill="url(#metalGrad)"/>
    <rect x="30" y="23" width="4" height="20" rx="1" fill="url(#metalGrad)"/>
    <circle cx="24" cy="33" r="3" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="40" cy="33" r="3" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="32" cy="25" r="3" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="32" cy="41" r="3" fill="#ffd45e" filter="url(#glow)"/>`,

    5: `    <!-- T5: Permanent Overdrive Core (Permanent overdrive + 15%) -->
    <rect x="14" y="22" width="36" height="22" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.8"/>
    <!-- Glowing core conduits -->
    <line x1="20" y1="27" x2="44" y2="27" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <line x1="20" y1="33" x2="44" y2="33" stroke="#ffd45e" stroke-width="2.5" filter="url(#glow)"/>
    <line x1="20" y1="39" x2="44" y2="39" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <polygon points="32,15 36,22 28,22" fill="#ffd45e" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Track Mud Scrapers (+0.1 traction) -->
    <!-- Steel track drive sprocket -->
    <circle cx="28" cy="34" r="11" fill="url(#vehGrad)" stroke="#36454f" stroke-width="1.5"/>
    <circle cx="28" cy="34" r="5" fill="url(#metalGrad)"/>
    <!-- Heavy scraper blade clearing debris -->
    <path d="M 39 25 L 49 29 L 45 43 L 37 39" fill="url(#metalGrad)" stroke="#76b995" stroke-width="1.2"/>
    <path d="M 46 38 L 52 44" stroke="#76b995" stroke-width="2" stroke-linecap="round"/>`,

    2: `    <!-- T2: Undercarriage Rock Guards (+0.1 traction) -->
    <!-- Armored belly skid plate -->
    <path d="M 12 36 L 52 36 L 46 46 L 18 46 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Bottom skid runners -->
    <line x1="22" y1="41" x2="42" y2="41" stroke="#76b995" stroke-width="2" stroke-linecap="round"/>
    <!-- Deflected jagged rocks -->
    <polygon points="16,52 20,48 24,52" fill="#36454f"/>
    <polygon points="38,52 42,47 46,51" fill="#36454f"/>`,

    3: `    <!-- T3: Counter-Dozer Push Blade (Mud grip + pushes hay) -->
    <!-- Undercarriage-mounted push blade -->
    <rect x="12" y="28" width="40" height="12" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <line x1="12" y1="38" x2="52" y2="38" stroke="#76b995" stroke-width="2"/>
    <!-- Pushed hay bales and mud mounds -->
    <rect x="8" y="42" width="12" height="6" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <circle cx="48" cy="44" r="4" fill="#36454f"/>`,

    4: `    <!-- T4: Heavy Anchor Winch (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="18" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.2"/>
    <circle cx="32" cy="33" r="6" fill="url(#metalGrad)"/>
    <!-- Ground spade anchor digging in -->
    <polygon points="32,42 22,54 42,54" fill="#76b995" stroke="#ffffff" stroke-width="1" filter="url(#glow)"/>
    <line x1="32" y1="33" x2="32" y2="42" stroke="#76b995" stroke-width="2"/>`,

    5: `    <!-- T5: Double-Grouser Bedrock Treads (Full grip + 20% speed) -->
    <rect x="10" y="26" width="44" height="18" rx="9" fill="#18241b" stroke="#76b995" stroke-width="2.5" filter="url(#glow)"/>
    <!-- Track rollers -->
    <circle cx="18" cy="35" r="5" fill="url(#vehGrad)"/>
    <circle cx="32" cy="35" r="5" fill="url(#metalGrad)"/>
    <circle cx="46" cy="35" r="5" fill="url(#vehGrad)"/>
    <!-- Double grousers on bottom -->
    <line x1="14" y1="46" x2="14" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="18" y1="46" x2="18" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="28" y1="46" x2="28" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="32" y1="46" x2="32" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="42" y1="46" x2="42" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="46" y1="46" x2="46" y2="52" stroke="#76b995" stroke-width="2"/>`,
  },

  unique: {
    1: `    <!-- T1: Long Reach Boom (Reaches 6 m) -->
    <!-- Two-piece articulated boom reaching far -->
    <line x1="12" y1="44" x2="28" y2="22" stroke="url(#vehGrad)" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="28" y1="22" x2="52" y2="18" stroke="url(#vehGrad)" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="28" cy="22" r="3.5" fill="#ffffff"/>
    <!-- Bucket at the tip -->
    <path d="M 52 18 L 56 26 L 48 30 Z" fill="url(#metalGrad)"/>
    <text x="44" y="38" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">6m</text>`,

    2: `    <!-- T2: Shockwave Teeth (1 m splash) -->
    <!-- Bucket impacting ground -->
    <path d="M 22 20 L 40 18 L 38 36 L 24 38 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Impact shockwave rings -->
    <ellipse cx="32" cy="44" rx="14" ry="5" stroke="#56cadd" stroke-width="2" fill="none" filter="url(#glow)"/>
    <ellipse cx="32" cy="44" rx="22" ry="7" stroke="#56cadd" stroke-width="1.2" stroke-dasharray="2 3" fill="none"/>
    <circle cx="32" cy="40" r="3" fill="#ffd45e"/>`,

    3: `    <!-- T3: Ground Slam Boom (Ground slam unlock) -->
    <!-- Massive impact hammer boom -->
    <rect x="26" y="14" width="12" height="26" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <rect x="22" y="38" width="20" height="6" rx="1" fill="url(#metalGrad)"/>
    <!-- Radial earthquake shock cracks -->
    <path d="M 32 44 L 20 54 M 32 44 L 32 58 M 32 44 L 44 54 M 32 44 L 14 46 M 32 44 L 50 46" stroke="#56cadd" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="32" cy="44" r="4" fill="#ffd45e"/>`,

    4: `    <!-- T4: Radial Ground Shockwave (Shockwave below 1 m) -->
    <!-- Low-slung ground ram -->
    <rect x="18" y="36" width="28" height="10" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Expanding ground wave pulses -->
    <path d="M 6 48 Q 32 38 58 48" stroke="#56cadd" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 12 54 Q 32 44 52 54" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" stroke-dasharray="2 3"/>
    <line x1="32" y1="24" x2="32" y2="36" stroke="#56cadd" stroke-width="2"/>`,

    5: `    <!-- T5: Demolisher Multi-Ripper (Removes all layers) -->
    <!-- Massive heavy shear claws ripping through all layers -->
    <path d="M 16 22 L 32 34 L 48 22" stroke="url(#metalGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="34" r="6" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <!-- Layered balloon popping at once -->
    <circle cx="32" cy="34" r="16" stroke="#56cadd" stroke-width="2" stroke-dasharray="3 3" fill="none" filter="url(#glow)"/>
    <circle cx="32" cy="34" r="22" stroke="#fa3b46" stroke-width="1.5" stroke-dasharray="2 4" fill="none"/>
    <polygon points="32,20 34,26 30,26" fill="#ffd45e"/>`,
  },
};
