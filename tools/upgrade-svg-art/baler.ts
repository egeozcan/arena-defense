import type { PathName } from '../generate-upgrade-svgs.js';

export const balerArt: Record<PathName, Record<number, string>> = {
  attack: {
    1: `    <!-- T1: Reinforced Compression Ram (+25% damage) -->
    <!-- Compactor chamber -->
    <rect x="14" y="24" width="36" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.2"/>
    <!-- Heavy hydraulic plunger ram face -->
    <rect x="18" y="26" width="10" height="16" rx="1.5" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Compressed straw block -->
    <rect x="29" y="27" width="16" height="14" rx="2" fill="#ffd45e" stroke="#edaa29" stroke-width="1"/>
    <!-- Forward compaction force arrow -->
    <path d="M 22 18 L 36 18 M 32 14 L 36 18 L 32 22" stroke="#ed654e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: Rapid Cycle Stuffer (-20% interval) -->
    <!-- Rotary packer crank -->
    <circle cx="32" cy="33" r="14" fill="#18241b" stroke="url(#metalGrad)" stroke-width="2"/>
    <circle cx="32" cy="33" r="5" fill="url(#vehGrad)"/>
    <!-- Triple rotary packer tines -->
    <path d="M 32 23 Q 44 26 40 38" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 23 38 Q 21 48 33 46" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>
    <path d="M 38 38 Q 42 22 26 25" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    3: `    <!-- T3: Hardened Core Piercer (Ignores armor) -->
    <!-- Dense bale projectile with solid carbide penetrating core -->
    <rect x="14" y="24" width="26" height="18" rx="3" fill="#ffd45e" stroke="#edaa29" stroke-width="1.2"/>
    <!-- Hardened armor-piercing steel core tip -->
    <polygon points="40,24 54,33 40,42" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Armored shield being shattered -->
    <path d="M 52 20 L 52 46" stroke="#ed654e" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 3" filter="url(#glow)"/>`,

    4: `    <!-- T4: Dual Hydraulic Ram (Double damage) -->
    <!-- Twin heavy cylinders -->
    <rect x="12" y="20" width="22" height="9" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <rect x="12" y="37" width="22" height="9" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Massive compaction face plate -->
    <rect x="34" y="16" width="6" height="34" rx="2" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Extreme force vectors -->
    <line x1="42" y1="24" x2="54" y2="24" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="42" y1="42" x2="54" y2="42" stroke="#ed654e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Signature Titanium Bale Cannon (Signature tool) -->
    <!-- High-pressure accelerator barrel -->
    <rect x="10" y="24" width="34" height="18" rx="4" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="42" y="26" width="14" height="14" rx="2" fill="url(#metalGrad)" stroke="#ed654e" stroke-width="1.5"/>
    <!-- Glowing supercharged bale firing out -->
    <rect x="46" y="28" width="12" height="10" rx="2" fill="#ffd45e" filter="url(#glow)"/>
    <!-- Shockwave blast rings -->
    <path d="M 50 18 Q 58 33 50 48" stroke="#ed654e" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,
  },

  speed: {
    1: `    <!-- T1: High-Flow Tractor Intake (+15% move) -->
    <rect x="18" y="24" width="28" height="22" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Intake louver grilles -->
    <line x1="22" y1="29" x2="42" y2="29" stroke="#ffd45e" stroke-width="1.5"/>
    <line x1="22" y1="35" x2="42" y2="35" stroke="#ffd45e" stroke-width="1.5"/>
    <line x1="22" y1="41" x2="42" y2="41" stroke="#ffd45e" stroke-width="1.5"/>
    <path d="M 12 35 L 20 35 M 16 31 L 20 35 L 16 39" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    2: `    <!-- T2: High-RPM Flywheel (+15% tool) -->
    <circle cx="32" cy="33" r="15" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2.5"/>
    <circle cx="32" cy="33" r="6" fill="url(#metalGrad)"/>
    <!-- Balanced rim counterweights -->
    <circle cx="32" cy="22" r="3" fill="#ffd45e"/>
    <circle cx="32" cy="44" r="3" fill="#ffd45e"/>
    <circle cx="21" cy="33" r="3" fill="#ffd45e"/>
    <circle cx="43" cy="33" r="3" fill="#ffd45e"/>
    <!-- Circular spin trail -->
    <path d="M 44 23 A 17 17 0 0 1 42 45" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" fill="none" filter="url(#glow)"/>`,

    3: `    <!-- T3: Turbo-Intercooled Engine (+30% move) -->
    <path d="M 33 22 A 12 12 0 1 1 21 38 L 13 38 L 13 30 L 23 30 A 12 12 0 0 1 33 22 Z" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <circle cx="33" cy="34" r="6" fill="#18241b" stroke="url(#metalGrad)" stroke-width="1.2"/>
    <circle cx="33" cy="34" r="2.5" fill="#ffd45e"/>
    <path d="M 13 34 L 7 34" stroke="#ffd45e" stroke-width="2.5" stroke-linecap="round" filter="url(#glow)"/>`,

    4: `    <!-- T4: Overdrive Press Booster (5s overdrive) -->
    <rect x="16" y="24" width="32" height="18" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="24" cy="33" r="5" fill="#ffd45e" filter="url(#glow)"/>
    <circle cx="40" cy="33" r="5" fill="#ffd45e" filter="url(#glow)"/>
    <polygon points="32,26 35,33 31,33 34,40 29,33 33,33" fill="#ffd45e" filter="url(#glow)"/>`,

    5: `    <!-- T5: Permanent Overdrive Drivetrain (Permanent overdrive + 15%) -->
    <rect x="12" y="22" width="40" height="22" rx="4" fill="#18241b" stroke="url(#vehGrad)" stroke-width="2"/>
    <line x1="18" y1="28" x2="46" y2="28" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <line x1="18" y1="33" x2="46" y2="33" stroke="#ffd45e" stroke-width="2.5" filter="url(#glow)"/>
    <line x1="18" y1="38" x2="46" y2="38" stroke="#ffd45e" stroke-width="2" filter="url(#glow)"/>
    <circle cx="32" cy="14" r="4" fill="#ffd45e" filter="url(#glow)"/>`,
  },

  traction: {
    1: `    <!-- T1: Wheel Mud Deflectors (+0.1 traction) -->
    <!-- Tandem tires -->
    <circle cx="22" cy="36" r="10" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <circle cx="42" cy="36" r="10" fill="#18241b" stroke="#36454f" stroke-width="1.5"/>
    <!-- Overarching mud deflector fender -->
    <path d="M 12 36 A 14 14 0 0 1 32 26 A 14 14 0 0 1 52 36" stroke="url(#vehGrad)" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,

    2: `    <!-- T2: Tandem Walking Beam Axles (+0.1 traction) -->
    <!-- Walking beam pivot bar -->
    <polygon points="18,36 32,28 46,36 32,32" fill="url(#metalGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Central chassis pivot pin -->
    <circle cx="32" cy="30" r="4.5" fill="url(#vehGrad)" stroke="#76b995" stroke-width="1.5"/>
    <!-- Axle spindles on both ends -->
    <circle cx="18" cy="36" r="4" fill="#76b995"/>
    <circle cx="46" cy="36" r="4" fill="#76b995"/>`,

    3: `    <!-- T3: Front Hay Pusher Wing (Mud grip + pushes hay) -->
    <!-- Swept front wing -->
    <polygon points="32,22 14,40 18,44 32,30 46,44 50,40" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Pushed hay bales -->
    <rect x="8" y="42" width="10" height="6" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>
    <rect x="46" y="42" width="10" height="6" rx="1.5" fill="#ffd45e" stroke="#edaa29" stroke-width="0.8"/>`,

    4: `    <!-- T4: Recovery Winch Unit (Oil grip + recovery) -->
    <rect x="18" y="24" width="28" height="20" rx="3" fill="#18241b" stroke="url(#vehGrad)" stroke-width="1.5"/>
    <circle cx="32" cy="34" r="7" fill="url(#metalGrad)"/>
    <path d="M 32 41 L 32 52 A 5 5 0 0 1 24 50" stroke="#76b995" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#glow)"/>`,

    5: `    <!-- T5: Flotation Caterpillar Tracks (Full grip + 20% speed) -->
    <rect x="10" y="26" width="44" height="18" rx="9" fill="#18241b" stroke="#76b995" stroke-width="2.5" filter="url(#glow)"/>
    <circle cx="18" cy="35" r="5" fill="url(#vehGrad)"/>
    <circle cx="32" cy="35" r="5" fill="url(#metalGrad)"/>
    <circle cx="46" cy="35" r="5" fill="url(#vehGrad)"/>
    <line x1="16" y1="46" x2="16" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="32" y1="46" x2="32" y2="52" stroke="#76b995" stroke-width="2"/>
    <line x1="48" y1="46" x2="48" y2="52" stroke="#76b995" stroke-width="2"/>`,
  },

  unique: {
    1: `    <!-- T1: Long-Range Bale Chute (Reaches 9 m) -->
    <!-- Extended guide chute -->
    <rect x="8" y="28" width="28" height="10" rx="2" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="0.8"/>
    <!-- Long travelling bale in flight -->
    <rect x="42" y="28" width="14" height="10" rx="2" fill="#ffd45e" stroke="#edaa29" stroke-width="1"/>
    <!-- 9m velocity beam -->
    <line x1="34" y1="33" x2="42" y2="33" stroke="#56cadd" stroke-width="2.5" stroke-dasharray="2 2" filter="url(#glow)"/>
    <text x="44" y="22" font-family="sans-serif" font-size="8" font-weight="900" fill="#56cadd">9m</text>`,

    2: `    <!-- T2: Dense Pierce Bale (Pierces 8 balloons) -->
    <!-- Dense travelling bale -->
    <rect x="10" y="28" width="14" height="10" rx="2" fill="#ffd45e" stroke="#edaa29" stroke-width="1"/>
    <!-- Line of pierced balloons -->
    <circle cx="29" cy="33" r="3.5" fill="#fa3b46" opacity="0.8"/>
    <circle cx="38" cy="33" r="3.5" fill="#9753ed" opacity="0.8"/>
    <circle cx="47" cy="33" r="3.5" fill="#fa3b46" opacity="0.8"/>
    <circle cx="56" cy="33" r="3.5" fill="#20bdf2" opacity="0.8"/>
    <!-- Pierce vector line -->
    <line x1="22" y1="33" x2="60" y2="33" stroke="#56cadd" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>`,

    3: `    <!-- T3: Bale Barrage Rack (Bale Barrage unlock) -->
    <!-- Triple ejector rack -->
    <rect x="10" y="24" width="20" height="18" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- 3-way fan of flying bales -->
    <rect x="36" y="16" width="12" height="7" rx="1.5" fill="#ffd45e" transform="rotate(-15 36 16)"/>
    <rect x="38" y="29" width="12" height="7" rx="1.5" fill="#ffd45e"/>
    <rect x="36" y="42" width="12" height="7" rx="1.5" fill="#ffd45e" transform="rotate(15 36 42)"/>
    <!-- Barrage fan vectors -->
    <line x1="28" y1="33" x2="56" y2="18" stroke="#56cadd" stroke-width="1.5"/>
    <line x1="28" y1="33" x2="56" y2="48" stroke="#56cadd" stroke-width="1.5"/>`,

    4: `    <!-- T4: Oversized Wide Bales (Pierces 12 balloons) -->
    <!-- Oversized compaction chamber -->
    <rect x="10" y="20" width="18" height="26" rx="3" fill="url(#vehGrad)" stroke="#ffffff" stroke-width="1"/>
    <!-- Giant wide-bodied bale -->
    <rect x="32" y="18" width="22" height="30" rx="4" fill="#ffd45e" stroke="#edaa29" stroke-width="1.5" filter="url(#glow)"/>
    <!-- Twine cords -->
    <line x1="32" y1="26" x2="54" y2="26" stroke="#36454f" stroke-width="1.2"/>
    <line x1="32" y1="34" x2="54" y2="34" stroke="#36454f" stroke-width="1.2"/>
    <line x1="32" y1="42" x2="54" y2="42" stroke="#36454f" stroke-width="1.2"/>
    <text x="38" y="48" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#36454f">12 HITS</text>`,

    5: `    <!-- T5: Straw-Burst Mega Bale (2 m explosive straw) -->
    <!-- Mega bale bursting at endpoint -->
    <rect x="22" y="25" width="20" height="16" rx="3" fill="#ffd45e" stroke="#edaa29" stroke-width="1.2"/>
    <!-- Radial explosive straw needles / shrapnel -->
    <line x1="12" y1="18" x2="22" y2="25" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="42" y1="25" x2="52" y2="18" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="12" y1="48" x2="22" y2="41" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="42" y1="41" x2="52" y2="48" stroke="#ffd45e" stroke-width="2" stroke-linecap="round" filter="url(#glow)"/>
    <circle cx="32" cy="33" r="18" stroke="#56cadd" stroke-width="2" stroke-dasharray="3 3" fill="none" filter="url(#glow)"/>`,
  },
};
