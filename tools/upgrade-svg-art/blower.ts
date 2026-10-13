import type { PathName } from '../generate-upgrade-svgs.js';

export const blowerArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: High-Pressure Fan Blades (+25% damage) -->
    <!-- Fan housing -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="5" fill="url(#metalGrad)"/>
    <!-- 4 High-pressure curved aerofoil blades -->
    <path d="M 32 23 Q 42 25 40 33" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 32 43 Q 22 41 24 33" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 23 33 Q 25 23 33 25" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 43 33 Q 41 43 33 41" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    2: `    <!-- T2: Rapid Pulse Air Valve (-20% interval) -->
    <!-- Rotary pulse valve -->
    <rect x="16" y="24" width="18" height="18" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Pulse shock waves -->
    <path d="M 38 22 A 13 13 0 0 1 38 44" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 45 18 A 18 18 0 0 1 45 48" stroke="#ed654e" stroke-width="2" stroke-linecap="round" fill="none" stroke-dasharray="2 3"/>
    <path d="M 52 14 A 23 23 0 0 1 52 52" stroke="#ed654e" stroke-width="1.5" stroke-linecap="round" fill="none" stroke-dasharray="1 3"/>`,

    3: `    <!-- T3: Armored Vortex Piercer (Ignores armor) -->
    <!-- Armored plate being punctured -->
    <rect x="38" y="20" width="8" height="26" rx="2" fill="#36454f" stroke="#71828a" stroke-width="1.2"/>
    <!-- Concentrated micro-tornado vortex boring through -->
    <path d="M 12 33 Q 24 26 36 31 Q 24 36 36 33 L 44 33" stroke="#ed654e" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <circle cx="44" cy="33" r="3" fill="#ffd45e"/>
    <path d="M 40 27 L 48 30 M 40 39 L 48 36" stroke="#ed654e" stroke-width="1.5"/>`,

    4: `    <!-- T4: Twin Turbine Booster (Double damage) -->
    <!-- Dual turbines -->
    <circle cx="23" cy="33" r="10" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="41" cy="33" r="10" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="23" cy="33" r="4" fill="#ffd45e"/>
    <circle cx="41" cy="33" r="4" fill="#ffd45e"/>
    <!-- Supersonic combined shockwave cone -->
    <path d="M 48 24 L 58 33 L 48 42" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Typhoon Cannon (Signature tool) -->
    <!-- Massive cyclonic cannon barrel -->
    <rect x="12" y="22" width="28" height="22" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="36" y="25" width="16" height="16" rx="2" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1.5"/>
    <!-- Intense atmospheric shock beam -->
    <line x1="46" y1="33" x2="60" y2="33" stroke="#ffd45e" stroke-width="4" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="38" cy="33" r="18" stroke="#ed654e" stroke-width="1.5" stroke-dasharray="2 3" fill="none"/>`,
  },

  speed: {
    1: `    <!-- T1: Aerodynamic Ram Scoop (+15% move) -->
    <rect x="18" y="24" width="28" height="22" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Roof intake scoop -->
    <path d="M 22 24 L 26 15 L 38 15 L 42 24 Z" fill="#202c24" stroke="url(#metalGrad)" stroke-width="1.2"/>
    <line x1="8" y1="35" x2="18" y2="35" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: Tuned Dual Exhaust (+15% tool) -->
    <rect x="22" y="18" width="6" height="28" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="36" y="18" width="6" height="28" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <path d="M 23 14 Q 25 6 27 14 Z" fill="#ffd45e" filter="url(#glow)"/>
    <path d="M 37 14 Q 39 6 41 14 Z" fill="#ffd45e" filter="url(#glow)"/>`,

    3: `    <!-- T3: High-Boost Supercharger (+30% move) -->
    <rect x="16" y="24" width="24" height="20" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="44" cy="34" r="9" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1.2"/>
    <circle cx="44" cy="34" r="4" fill="#ffd45e"/>
    <path d="M 8 34 L 16 34" stroke="#ffd45e" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Overdrive Jet Assist (5s overdrive) -->
    <rect x="18" y="22" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.2"/>
    <!-- Jet nozzle firing rearward -->
    <polygon points="18,27 10,24 10,39 18,36" fill="url(#metalGrad)"/>
    <polygon points="10,28 3,31.5 10,35" fill="#ffd45e" filter="url(#glow)"/>`,

    5: `    <!-- T5: Continuous Turbine Reactor (Permanent overdrive + 15%) -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="7" fill="#ffd45e" filter="url(#glow)"/>
    <line x1="32" y1="13" x2="32" y2="20" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="32" y1="46" x2="32" y2="53" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Splash Fender Guards (+0.1 traction) -->
    <circle cx="32" cy="36" r="13" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <!-- Contoured splash fender -->
    <path d="M 14 36 A 18 18 0 0 1 50 36" stroke="url(#vehGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="32" cy="36" r="4" fill="url(#metalGrad)"/>`,

    2: `    <!-- T2: Anti-Roll Sway Bars (+0.1 traction) -->
    <rect x="12" y="32" width="40" height="6" rx="2" fill="url(#metalGrad)" stroke="#36454f" stroke-width="1"/>
    <!-- U-shaped sway bar linkage -->
    <path d="M 16 32 L 16 22 L 48 22 L 48 32" stroke="#76b995" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <circle cx="16" cy="22" r="3" fill="#ffffff"/>
    <circle cx="48" cy="22" r="3" fill="#ffffff"/>`,

    3: `    <!-- T3: Air-Assisted Ground Plow (Mud grip + pushes hay) -->
    <polygon points="32,20 14,38 18,42 32,30 46,42 50,38" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Clearing airflow vectors -->
    <path d="M 24 34 L 14 42 M 40 34 L 50 42" stroke="#76b995" stroke-width="2" stroke-linecap="round"/>`,

    4: `    <!-- T4: Front Bumper Winch (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <path d="M 32 41 L 32 52 A 5 5 0 0 1 24 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: All-Terrain 6x6 Heavy Drive (Full grip + 20% speed) -->
    <rect x="8" y="30" width="12" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="26" y="30" width="12" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="44" y="30" width="12" height="18" rx="3" fill="#18241b" stroke="#76b995" stroke-width="1.5"/>
    <rect x="6" y="24" width="52" height="6" rx="2" fill="url(#vehGrad)"/>`,
  },

  unique: {
    1: `    <!-- T1: Extended Jet Duct (Reaches 7 m) -->
    <rect x="8" y="28" width="26" height="12" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Telescoping extension barrel -->
    <rect x="32" y="30" width="18" height="8" rx="1.5" fill="url(#metalGrad)"/>
    <line x1="50" y1="34" x2="60" y2="34" stroke="#56cadd" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <text x="46" y="24" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">7m</text>`,

    2: `    <!-- T2: Wide Diffuser Horn (72° wide gust cone) -->
    <!-- Flared trumpet diffuser horn -->
    <path d="M 12 30 L 26 30 L 46 16 L 46 50 L 26 36 L 12 36 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Expansive 72° gust lines -->
    <path d="M 48 20 Q 56 24 60 22" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 48 33 L 60 33" stroke="#56cadd" stroke-width="2" stroke-linecap="round"/>
    <path d="M 48 46 Q 56 42 60 44" stroke="#56cadd" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <text x="32" y="24" font-family="sans-serif" font-size="7" font-weight="900" fill="#ffffff">72°</text>`,

    3: `    <!-- T3: Downburst Turbine (Downburst unlock) -->
    <!-- Vertical downward turbine housing -->
    <rect x="20" y="14" width="24" height="20" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Downward jet exhaust arrows forcing balloons down -->
    <path d="M 32 34 L 32 54 M 26 48 L 32 54 L 38 48" stroke="#56cadd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
    <!-- Pushed-down balloon icon -->
    <circle cx="48" cy="48" r="4" fill="#fa3b46"/>
    <line x1="48" y1="38" x2="48" y2="44" stroke="#ffffff" stroke-width="1.5"/>`,

    4: `    <!-- T4: Telescoping Sky Sweeper (9 m range + 14 m height) -->
    <!-- High-angle telescoping boom -->
    <line x1="16" y1="52" x2="48" y2="16" stroke="url(#vehGrad)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="16" cy="52" r="4" fill="#36454f"/>
    <!-- High-reach nozzle pointing up -->
    <circle cx="48" cy="16" r="4" fill="#56cadd" filter="url(#glow)"/>
    <path d="M 48 16 L 56 8" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <text x="24" y="30" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">14m</text>`,

    5: `    <!-- T5: Gathering Cyclone Vortex (Gathering vortex) -->
    <!-- Swirling cyclone vortex funnel -->
    <ellipse cx="32" cy="33" rx="20" ry="12" fill="#18241b" stroke="#56cadd" stroke-width="1.8" filter="url(#glow)"/>
    <path d="M 32 23 A 9 9 0 0 1 41 33 A 7 7 0 0 1 34 40 A 5 5 0 0 1 27 33" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <!-- Clustered balloon targets drawn in -->
    <circle cx="28" cy="32" r="3" fill="#fa3b46"/>
    <circle cx="36" cy="32" r="3" fill="#fa3b46"/>
    <circle cx="32" cy="36" r="3" fill="#9753ed"/>`,
  },
};
