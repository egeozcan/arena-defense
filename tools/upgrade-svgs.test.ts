import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VEHICLES, PATHS } from '../src/sim/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upgradesDir = path.resolve(__dirname, '../public/upgrades');

test('all 160 upgrade SVG graphics exist and are valid SVGs', () => {
  const kinds = Object.keys(VEHICLES) as (keyof typeof VEHICLES)[];
  let checked = 0;

  for (const kind of kinds) {
    for (const p of PATHS) {
      for (let tier = 1; tier <= 5; tier++) {
        const filename = `${kind}-${p}-${tier}.svg`;
        const filePath = path.join(upgradesDir, filename);
        assert.ok(fs.existsSync(filePath), `File missing: ${filename}`);

        const content = fs.readFileSync(filePath, 'utf-8');
        assert.ok(content.length > 200, `File too short: ${filename}`);
        assert.ok(content.includes('<svg'), `Missing <svg tag in ${filename}`);
        assert.ok(content.includes('</svg>'), `Missing </svg> in ${filename}`);
        assert.ok(content.includes('viewBox="0 0 64 64"'), `Missing viewBox in ${filename}`);
        assert.ok(
          content.includes(`>T${tier}</text>`),
          `Missing tier T${tier} badge in ${filename}`,
        );
        checked++;
      }
    }
  }

  assert.equal(checked, 160, 'Expected exactly 160 upgrade SVGs');
});
