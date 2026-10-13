import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('pause menu Resume button takes focus on open regardless of driver mode', () => {
  const src = readFileSync(new URL('../src/ui/App.tsx', import.meta.url), 'utf8');
  const menuStart = src.indexOf('className="pause-menu"');
  const resumeStart = src.indexOf('Resume<kbd>', menuStart);
  assert.ok(menuStart > 0 && resumeStart > menuStart, 'pause menu markup not found');
  const resumeOpen = src.slice(menuStart, resumeStart);
  assert.ok(
    !/autoFocus=\{/.test(resumeOpen),
    'pause menu Resume button must always take autoFocus, not only when driverId is set',
  );
  assert.ok(/\bautoFocus\b/.test(resumeOpen), 'pause menu Resume button must have autoFocus');
});
