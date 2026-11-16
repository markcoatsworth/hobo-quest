// Sanity checks on the hand-written content: every rail line joins two real
// cities, and every train in a yard runs along a line that exists.
// Run with `npm run check`.

import { rail_check } from '../src/systems/rail.js';

const problems = rail_check();
for (const p of problems) console.error(`  ✗ ${p}`);
if (problems.length) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'} found.`);
  process.exit(1);
}
console.log('Content checks passed.');
