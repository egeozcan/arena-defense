import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { wrapSvg } from './upgrade-svg-art/common.js';
import { harvesterArt } from './upgrade-svg-art/harvester.js';
import { sprayerArt } from './upgrade-svg-art/sprayer.js';
import { excavatorArt } from './upgrade-svg-art/excavator.js';
import { craneArt } from './upgrade-svg-art/crane.js';
import { balerArt } from './upgrade-svg-art/baler.js';
import { blowerArt } from './upgrade-svg-art/blower.js';
import { bulldozerArt } from './upgrade-svg-art/bulldozer.js';
import { mixerArt } from './upgrade-svg-art/mixer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../public/upgrades');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export type VehicleKind =
  'harvester' | 'sprayer' | 'excavator' | 'crane' | 'baler' | 'blower' | 'bulldozer' | 'mixer';

export type PathName = 'attack' | 'speed' | 'traction' | 'unique';

export const VEHICLES: VehicleKind[] = [
  'harvester',
  'sprayer',
  'excavator',
  'crane',
  'baler',
  'blower',
  'bulldozer',
  'mixer',
];

export const PATHS: PathName[] = ['attack', 'speed', 'traction', 'unique'];

export const PATH_COLORS: Record<
  PathName,
  { main: string; glow: string; dark: string; light: string }
> = {
  attack: { main: '#ed654e', glow: '#ff8573', dark: '#421410', light: '#ffa394' },
  speed: { main: '#ffd45e', glow: '#ffe394', dark: '#3d3008', light: '#fff0be' },
  traction: { main: '#76b995', glow: '#a0d9b8', dark: '#142c1e', light: '#c4ebd4' },
  unique: { main: '#56cadd', glow: '#8de2f0', dark: '#11333a', light: '#b8f2fc' },
};

export const VEHICLE_COLORS: Record<VehicleKind, { main: string; dark: string; light: string }> = {
  harvester: { main: '#e84332', dark: '#4a110b', light: '#f2786d' },
  sprayer: { main: '#65ae3a', dark: '#1e3810', light: '#8fd367' },
  excavator: { main: '#ffba20', dark: '#4d3606', light: '#ffd166' },
  crane: { main: '#ff852c', dark: '#4d2407', light: '#ffa76b' },
  baler: { main: '#bb73dc', dark: '#3b1c47', light: '#d59eec' },
  blower: { main: '#39b8c9', dark: '#0e343a', light: '#70d1de' },
  bulldozer: { main: '#edaa29', dark: '#453008', light: '#f5c668' },
  mixer: { main: '#f29a51', dark: '#472710', light: '#f7ba84' },
};

const ART_MAP: Record<VehicleKind, Record<PathName, Record<number, string>>> = {
  harvester: harvesterArt,
  sprayer: sprayerArt,
  excavator: excavatorArt,
  crane: craneArt,
  baler: balerArt,
  blower: blowerArt,
  bulldozer: bulldozerArt,
  mixer: mixerArt,
};

let count = 0;

for (const kind of VEHICLES) {
  for (const p of PATHS) {
    for (let tier = 1; tier <= 5; tier++) {
      const art = ART_MAP[kind]?.[p]?.[tier];
      if (!art) {
        throw new Error(`Missing art for ${kind} ${p} tier ${tier}`);
      }
      const svg = wrapSvg(kind, p, tier, art);
      const filename = `${kind}-${p}-${tier}.svg`;
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, svg, 'utf-8');
      count++;
    }
  }
}

console.log(`Successfully generated ${count} upgrade SVGs in ${outputDir}!`);
