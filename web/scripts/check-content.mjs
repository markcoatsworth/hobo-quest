// Sanity checks on the hand-written content: every rail line joins two real
// cities, every train in a yard runs along a line that exists, every exit
// leads to a real area, and the music's playlists and cues name real
// tracks and cities.
// Run with `npm run check`.

import { LOCATIONS } from '../src/locations/index.js';
import { CUTSCENES } from '../src/cutscenes/index.js';
import { PLAYLISTS, TRACKS } from '../src/music/index.js';
import { ITEMS } from '../src/items/index.js';
import { rail_check } from '../src/systems/rail.js';

const problems = rail_check();

// Exits lead to areas that exist.
for (const loc of Object.values(LOCATIONS)) {
  const areas = { town: loc.town, ...(loc.areas ?? {}) };
  for (const [id, area] of Object.entries(areas)) {
    for (const exit of area?.exits ?? []) {
      if (!areas[exit.to]) problems.push(`${loc.id} area "${id}": exit to "${exit.to}", which isn't an area of ${loc.id}`);
    }
    // Things to take name real items, and have an id to remember them by.
    for (const prop of area?.props ?? []) {
      if (prop.take && !ITEMS[prop.take]) problems.push(`${loc.id} area "${id}": ${prop.name} holds "${prop.take}", which isn't an item`);
      if (prop.take && !prop.id) problems.push(`${loc.id} area "${id}": ${prop.name} holds an item but has no id`);
    }
  }
}

for (const [region, ids] of Object.entries(PLAYLISTS)) {
  if (!LOCATIONS[region]) problems.push(`playlist "${region}": no such city`);
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
