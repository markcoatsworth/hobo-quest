// The rail network: which cities are joined by track, and what a ride along
// each line is like. Every line runs one way only, from -> to: there's no
// going back. Which line you take is decided in the yard, by the train you
// climb into.
//
// The data is src/rail/network.json, plain JSON so the GameMaker build can
// load the very same file:
//
// {
//   "lines": [
//     { "from": "dallas", "to": "el_paso",   two city ids (src/locations/); the
//                                           line runs from -> to only
//       "days": 2,                          days the ride takes
//       "miles": 588,                       for the travel panel
//       "via": [[x, y], ...],               track between the two cities on the
//                                           rail map, in source-image pixels
//                                           (source/usa-rail-network-2010.png),
//                                           the cities' own `at` excluded
//       "scenery": [[0, "prairie"], [0.4, "desert"]] }
//                                           what you see from the boxcar door,
//                                           [fraction of the way, region].
//                                           Regions are
//                                           drawn in src/scenes/travel.js.
//   ]
// }
//
// Like everything under src/systems/, these are plain functions on plain
// data with GameMaker-style prefixed names, so they port line for line.

import NETWORK from '../rail/network.json' with { type: 'json' };
import { LOCATIONS } from '../locations/index.js';

/** Every line, as written in network.json (for drawing the map). */
export function rail_lines() {
  return NETWORK.lines;
}

/** The line from one city to another, or null. */
function rail_find(from, to) {
  for (const line of NETWORK.lines) {
    if (line.from === from && line.to === to) return line;
  }
  return null;
}

/** Is there a line from `from` to `to`? */
export function rail_connected(from, to) {
  return rail_find(from, to) !== null;
}

/** Ids of every city a line out of `city` goes to. */
export function rail_lines_from(city) {
  const out = [];
  for (const line of NETWORK.lines) {
    if (line.from === city) out.push(line.to);
  }
  return out;
}

export function rail_leg_days(from, to) {
  return rail_find(from, to).days;
}

export function rail_leg_miles(from, to) {
  return rail_find(from, to).miles;
}

/** The track of a line, both cities included. */
export function rail_leg_path(from, to) {
  return [LOCATIONS[from].at, ...rail_find(from, to).via, LOCATIONS[to].at];
}

/** The scenery region at fraction f (0..1) of the way along a line. */
export function rail_scenery_at(from, to, f) {
  const line = rail_find(from, to);
  let region = line.scenery[0][1];
  for (const [at, r] of line.scenery) if (f >= at) region = r;
  return region;
}

export function rail_path_length(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

/**
 * Problems with the network and the cities' yards, as a list of messages
 * (empty when all is well). Run by `npm run check`.
 */
export function rail_check() {
  const problems = [];
  const seen = [];
  for (const line of NETWORK.lines) {
    const name = `${line.from}-${line.to}`;
    for (const id of [line.from, line.to]) if (!LOCATIONS[id]) problems.push(`line ${name}: no city "${id}"`);
    if (seen.includes(name)) problems.push(`line ${name}: listed twice`);
    if (seen.includes(`${line.to}-${line.from}`)) problems.push(`line ${name}: the reverse is a line too, but there's no going back`);
    seen.push(name);
    if (!(line.days >= 1)) problems.push(`line ${name}: days must be 1 or more`);
    if (!line.scenery.length || line.scenery[0][0] !== 0) problems.push(`line ${name}: scenery must start at 0`);
  }
  for (const city of Object.values(LOCATIONS)) {
    for (const train of city.yard?.trains ?? []) {
      if (!rail_connected(city.id, train.to)) problems.push(`${city.id} yard: train to "${train.to}" but no line runs there from ${city.id}`);
    }
  }
  return problems;
}
