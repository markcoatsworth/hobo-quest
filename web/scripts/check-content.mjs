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

// Yards: each freight on a real, clear track of its own, with a unique engine number.
for (const loc of Object.values(LOCATIONS)) {
  const yard = loc.yard;
  if (!yard) continue;
  const main = yard.tracks.length + 1;
  const used = new Set();
  const numbers = new Set();
  for (const t of yard.trains) {
    const where = `${loc.id} yard, freight to ${t.to}`;
    const track = t.track ?? main;
    if (track < 1 || track > main) problems.push(`${where}: no track ${track}`);
    else if (track < main && (yard.tracks[track - 1].cars || yard.tracks[track - 1].moving)) problems.push(`${where}: track ${track} isn't kept clear`);
    if (used.has(track)) problems.push(`${where}: another freight is already on track ${track}`);
    used.add(track);
    if (!t.number) problems.push(`${where}: no engine number`);
    else if (numbers.has(t.number)) problems.push(`${where}: engine number ${t.number} used twice`);
    numbers.add(t.number);
    // Only the engine and the first five cars are inside the yard; the rest
    // of the train runs on past the north fence.
    if (!(t.open >= 1 && t.open <= 5)) problems.push(`${where}: open door on car ${t.open}; it has to be on cars 1 to 5, inside the yard`);
    if (t.card != null && !(t.card >= 1 && t.card <= 5)) problems.push(`${where}: card on car ${t.card}; it has to be on cars 1 to 5, inside the yard`);
  }
  // A clue that teaches the notebook names a track with a freight, and a real city.
  for (const clue of yard.clues ?? []) {
    if (!clue.learn) continue;
    const where = `${loc.id} yard, clue "${clue.title}"`;
    if (!yard.trains.some((t) => (t.track ?? main) === clue.learn.track)) problems.push(`${where}: no freight on track ${clue.learn.track}`);
    if (!LOCATIONS[clue.learn.to]) problems.push(`${where}: no such place as "${clue.learn.to}"`);
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
