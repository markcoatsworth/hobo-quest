// Sanity checks on the hand-written content: every rail line joins two real
// cities, every train in a yard runs along a line that exists, and the
// music's playlists and cues name real tracks and cities.
// Run with `npm run check`.

import { CITIES } from '../src/cities/index.js';
import { CUTSCENES } from '../src/cutscenes/index.js';
import { PLAYLISTS, TRACKS } from '../src/music/index.js';
import { rail_check } from '../src/systems/rail.js';

const problems = rail_check();

for (const [region, ids] of Object.entries(PLAYLISTS)) {
  if (!CITIES[region]) problems.push(`playlist "${region}": no such city`);
  for (const id of ids) if (!TRACKS[id]) problems.push(`playlist "${region}": no track "${id}"`);
}
for (const c of Object.values(CUTSCENES)) {
  if (c.music && !TRACKS[c.music]) problems.push(`cutscene "${c.id}": no track "${c.music}"`);
}

for (const p of problems) console.error(`  ✗ ${p}`);
if (problems.length) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'} found.`);
  process.exit(1);
}
console.log('Content checks passed.');
