import type { PathName } from '../generate-upgrade-svgs.js';

export const sprayerArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Pressurized Jet Nozzles (+25% damage) -->
    <!-- Heavy brass/steel nozzle body -->
    <path d="M 18 33 L 30 25 L 30 41 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="12" y="29" width="8" height="8" rx="1.5" fill="url(#metalGrad)"/>
    <!-- High-velocity jet spray particles -->
    <path d="M 30 33 L 52 23 M 30 33 L 54 33 M 30 33 L 52 43" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="42" cy="27" r="2" fill="#ffd45e"/>
    <circle cx="48" cy="33" r="2.5" fill="#ed654e"/>
    <circle cx="42" cy="39" r="2" fill="#ffd45e"/>`,

    2: `    <!-- T2: Rapid Pulse Solenoid (-20% interval) -->
    <!-- Solenoid electric valve cylinder -->
    <rect x="16" y="24" width="18" height="18" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <rect x="22" y="19" width="6" height="6" fill="url(#metalGrad)"/>
    <rect x="22" y="41" width="6" height="6" fill="url(#metalGrad)"/>
    <!-- Pulse wave ripple rings -->
    <path d="M 38 23 A 12 12 0 0 1 38 43" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 44 19 A 17 17 0 0 1 44 47" stroke="#ed654e" stroke-width="2" stroke-linecap="round" fill="none" stroke-dasharray="2 3"/>
    <circle cx="25" cy="33" r="3" fill="#ffd45e"/>`,

    3: `    <!-- T3: Armor-Piercing Corrosive Jet (Ignores armor) -->
    <!-- Armor shield being dissolved -->
    <path d="M 32 18 L 48 24 L 44 46 L 32 50 Z" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <!-- Acid eating through center with sizzling bubbles -->
    <path d="M 12 34 L 38 34" stroke="#ed654e" stroke-width="3.5" stroke-linecap="round" filter="url(#glow)"/>
    <ellipse cx="38" cy="34" rx="4" ry="7" fill="#65ae3a" filter="url(#glow)"/>
    <circle cx="44" cy="31" r="1.5" fill="#ffd45e"/>
    <circle cx="42" cy="38" r="1.2" fill="#ffd45e"/>
    <path d="M 36 26 Q 42 22 46 25" stroke="#ffffff" stroke-width="1" fill="none"/>`,

    4: `    <!-- T4: Dual Boom Pressure Manifold (Double damage) -->
    <!-- High-pressure manifold tube -->
    <rect x="10" y="30" width="44" height="6" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <rect x="27" y="18" width="10" height="14" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Dual spray jets firing downward -->
    <path d="M 15 36 L 10 50 M 15 36 L 22 50" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <path d="M 49 36 L 42 50 M 49 36 L 54 50" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="16" cy="46" r="2" fill="#ffd45e"/>
    <circle cx="48" cy="46" r="2" fill="#ffd45e"/>`,

    5: `    <!-- T5: Signature Chemic Cannon (Signature tool) -->
    <!-- Massive chemical cannon housing -->
    <rect x="12" y="24" width="22" height="18" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <rect x="30" y="27" width="18" height="12" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Hazard skull/droplet glow -->
    <circle cx="23" cy="33" r="5" fill="#18241b" stroke="#ed654e" stroke-width="1.5"/>
    <polygon points="23,30 25,34 21,34" fill="#ffd45e"/>
    <!-- Supercharged caustic blast beam -->
    <path d="M 48 33 L 58 27 L 55 33 L 58 39 Z" fill="#ed654e" filter="url(#glow)"/>
    <line x1="48" y1="33" x2="55" y2="33" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
  },

  speed: {
    1: `    <!-- T1: Cold Air Induction (+15% move) -->
    <!-- Aero cowl -->
    <path d="M 16 26 L 36 20 L 48 26 L 48 42 L 16 42 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Air intake scoop -->
    <ellipse cx="26" cy="33" rx="6" ry="4" fill="#0c140e" stroke="url(#metalGrad)" stroke-width="1"/>
    <!-- Airflow speed lines -->
    <line x1="8" y1="28" x2="20" y2="28" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="6" y1="33" x2="20" y2="33" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="8" y1="38" x2="20" y2="38" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: Tuned Exhaust Headers (+15% tool) -->
    <!-- 4 into 1 exhaust header pipes -->
    <path d="M 18 18 Q 28 22 34 32" stroke="url(#metalGrad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M 22 16 Q 30 22 36 32" stroke="url(#metalGrad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M 26 15 Q 32 22 38 32" stroke="url(#metalGrad)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Collector pipe -->
    <rect x="33" y="32" width="7" height="16" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Hot exhaust discharge flame -->
    <path d="M 34 48 Q 36.5 56 39 48 Z" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="36.5" cy="52" r="1.5" fill="#ed654e"/>`,

    3: `    <!-- T3: Twin-Scroll Supercharger (+30% move) -->
    <!-- Supercharger body -->
    <rect x="16" y="24" width="24" height="20" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Belt pulley wheel -->
    <circle cx="44" cy="34" r="9" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1.2"/>
    <circle cx="44" cy="34" r="4" fill="#ffd45e"/>
    <!-- Drive belt -->
    <path d="M 24 24 L 44 25" stroke="#36454f" stroke-width="2"/>
    <path d="M 24 44 L 44 43" stroke="#36454f" stroke-width="2"/>
    <path d="M 8 34 L 16 34" stroke="#ffd45e" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Nitro-Injected Booms (5s overdrive) -->
    <!-- Nitrous oxide cylinders mounted on boom -->
    <rect x="18" y="20" width="8" height="24" rx="3" fill="#20bdf2" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="38" y="20" width="8" height="24" rx="3" fill="#20bdf2" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Valve caps -->
    <rect x="20" y="16" width="4" height="4" fill="url(#metalGrad)"/>
    <rect x="40" y="16" width="4" height="4" fill="url(#metalGrad)"/>
    <!-- Booster flames blasting down -->
    <polygon points="19,44 22,54 25,44" fill="#ffd45e" filter="url(#glow)"/>
    <polygon points="39,44 42,54 45,44" fill="#ffd45e" filter="url(#glow)"/>`,

    5: `    <!-- T5: Overdrive Fusion Engine (Permanent overdrive + 15%) -->
    <circle cx="32" cy="34" r="13" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="34" r="7" fill="#ffd45e" filter="url(#glow)"/>
    <!-- Radiating lightning conduits -->
    <line x1="32" y1="14" x2="32" y2="21" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="32" y1="47" x2="32" y2="54" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="12" y1="34" x2="19" y2="34" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="45" y1="34" x2="52" y2="34" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: High-Clearance Mud Flaps (+0.1 traction) -->
    <!-- Tall narrow row-crop tire -->
    <ellipse cx="32" cy="35" rx="6" ry="16" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <!-- Deep chevron lugs -->
    <line x1="28" y1="26" x2="36" y2="28" stroke="#76b995" stroke-width="1.5"/>
    <line x1="28" y1="34" x2="36" y2="36" stroke="#76b995" stroke-width="1.5"/>
    <line x1="28" y1="42" x2="36" y2="44" stroke="#76b995" stroke-width="1.5"/>
    <!-- Tall mud flap fender -->
    <path d="M 22 20 L 42 20 L 40 40 L 24 40" stroke="url(#vehGrad)" stroke-width="3" fill="none" stroke-linecap="round"/>`,

    2: `    <!-- T2: Reinforced Portal Struts (+0.1 traction) -->
    <!-- High-clearance stilt leg -->
    <rect x="28" y="14" width="8" height="34" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- Triangular bracing struts -->
    <path d="M 14 44 L 28 20 M 50 44 L 36 20" stroke="#76b995" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="28" cy="20" r="2.5" fill="#ffffff"/>
    <circle cx="36" cy="20" r="2.5" fill="#ffffff"/>
    <rect x="25" y="44" width="14" height="6" rx="2" fill="url(#vehGrad)"/>`,

    3: `    <!-- T3: Crop/Hay Deflector Wedge (Mud grip + pushes hay) -->
    <!-- Pointed divider nose -->
    <polygon points="32,18 18,44 46,44" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <line x1="32" y1="18" x2="32" y2="44" stroke="#76b995" stroke-width="2"/>
    <!-- Parted hay tracks on both sides -->
    <path d="M 16 38 L 8 46 M 48 38 L 56 46" stroke="#ffd45e" stroke-width="2" stroke-linecap="round"/>`,

    4: `    <!-- T4: Self-Recovery Capstan (Oil grip + winch) -->
    <!-- Center capstan spool drum -->
    <circle cx="32" cy="34" r="12" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <!-- Wound steel rope -->
    <circle cx="32" cy="34" r="4" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <path d="M 40 38 L 48 48 A 4 4 0 0 1 42 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Quad All-Terrain Track Pods (Full grip + 20% speed) -->
    <!-- Triangular crawler track assembly -->
    <polygon points="32,18 14,46 50,46" fill="#18241b" stroke="#76b995" stroke-width="2.5" stroke-linejoin="round" filter="url(#glow)"/>
    <circle cx="32" cy="26" r="4" fill="url(#vehGrad)"/>
    <circle cx="22" cy="40" r="4" fill="url(#metalGrad)"/>
    <circle cx="42" cy="40" r="4" fill="url(#metalGrad)"/>
    <!-- Grousers -->
    <line x1="20" y1="49" x2="24" y2="49" stroke="#76b995" stroke-width="2"/>
    <line x1="40" y1="49" x2="44" y2="49" stroke="#76b995" stroke-width="2"/>`,
  },

  unique: {
    1: `    <!-- T1: Long-Range Booster Nozzle (Reaches 6 m) -->
    <rect x="8" y="30" width="30" height="7" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <path d="M 38 29 L 46 26 L 46 41 L 38 38 Z" fill="url(#metalGrad)"/>
    <!-- Extended high-pressure jet reaching far -->
    <line x1="46" y1="33.5" x2="60" y2="33.5" stroke="#56cadd" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
    <text x="50" y="24" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">6m</text>`,

    2: `    <!-- T2: Wide Fan Spray Boom (60° spray cone) -->
    <!-- Angled spray boom -->
    <line x1="12" y1="24" x2="52" y2="24" stroke="url(#vehGrad)" stroke-width="4" stroke-linecap="round"/>
    <!-- 5 Nozzles with 60° fan mist -->
    <path d="M 16 26 L 10 46 L 22 46 Z" fill="#56cadd" fill-opacity="0.25"/>
    <path d="M 32 26 L 24 48 L 40 48 Z" fill="#56cadd" fill-opacity="0.35"/>
    <path d="M 48 26 L 42 46 L 54 46 Z" fill="#56cadd" fill-opacity="0.25"/>
    <path d="M 12 44 Q 32 52 52 44" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    3: `    <!-- T3: Sticky Slime Cloud (Sticky cloud unlock) -->
    <!-- Cloud cluster of sticky droplet bubbles -->
    <circle cx="26" cy="30" r="9" fill="#65ae3a" fill-opacity="0.6"/>
    <circle cx="38" cy="28" r="11" fill="#56cadd" fill-opacity="0.6"/>
    <circle cx="32" cy="40" r="9" fill="#65ae3a" fill-opacity="0.6"/>
    <!-- Slowing drip trails -->
    <path d="M 24 37 Q 24 45 28 47" stroke="#ffd45e" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M 40 37 Q 40 45 36 47" stroke="#ffd45e" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="28" cy="47" r="1.5" fill="#ffd45e"/>
    <circle cx="36" cy="47" r="1.5" fill="#ffd45e"/>`,

    4: `    <!-- T4: Acid Strips Armor (Acid wash) -->
    <!-- Corrosive chemical flask dripping on armor -->
    <path d="M 26 18 L 38 18 L 42 30 A 10 10 0 1 1 22 30 Z" fill="#18241b" stroke="#56cadd" stroke-width="1.5"/>
    <path d="M 25 32 Q 32 30 39 32 A 8 8 0 0 1 25 32" fill="#65ae3a" filter="url(#glow)"/>
    <!-- Acid drips corroding metal shield -->
    <rect x="22" y="46" width="20" height="6" rx="1.5" fill="#36454f" stroke="#71828a" stroke-width="1"/>
    <line x1="32" y1="36" x2="32" y2="46" stroke="#65ae3a" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="46" r="2.5" fill="#ffd45e"/>`,

    5: `    <!-- T5: 360° Omnidirectional Fog Cannon (360° fog cannon) -->
    <!-- Central rotating cannon dome -->
    <circle cx="32" cy="33" r="10" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="32" cy="33" r="5" fill="#18241b" stroke="#56cadd" stroke-width="1.5"/>
    <!-- 8 radial fog spray nozzles -->
    <circle cx="32" cy="33" r="19" stroke="#56cadd" stroke-width="2" stroke-dasharray="3 4" filter="url(#glow)"/>
    <path d="M 32 18 L 32 10 M 32 48 L 32 56 M 17 33 L 9 33 M 47 33 L 55 33" stroke="#56cadd" stroke-width="2" stroke-linecap="round"/>
    <path d="M 22 23 L 16 17 M 42 43 L 48 49 M 42 23 L 48 17 M 22 43 L 16 49" stroke="#56cadd" stroke-width="2" stroke-linecap="round"/>`,
  },
};
