// Starting somewhere other than the title screen, from the address bar,
// for trying out a particular place:
//
//   ?location=kansas_city                    the map, at Kansas City
//   ?location=kansas_city&area=town          its main street
//   ?location=kansas_city&area=yard          its rail yard
//   ?location=new_york&area=family_home_house
//                                            any of a location's other areas
//
// location: a location id (src/locations/). area: 'map' (the default),
// 'town', 'yard', or the id of one of the location's areas. The journey is
// made up to match: the shortest way there by rail from New York, and the
// days it would have taken. It's saved like any journey, so it replaces
// the one you had.

import { music_follow_trail } from './core/music.js';
import { newJourney, START_CITY } from './core/save.js';
import { LOCATIONS } from './locations/index.js';
import { rail_leg_days, rail_lines_from } from './systems/rail.js';
import { AreaScene } from './scenes/area.js';
import { MapScene } from './scenes/map.js';
import { YardScene } from './scenes/yard.js';

/** The scene to start in, from the URL, or null to start at the title. */
export function startFromUrl(game) {
  const query = new URLSearchParams(location.search);
  const id = query.get('location');
  if (!id) return null;
  const loc = LOCATIONS[id];
  if (!loc) {
    game.toast = { text: `No location "${id}" (the console lists them)`, t: 6 };
    console.warn(`?location=${id}: no such location. Locations: ${Object.keys(LOCATIONS).join(', ')}`);
    return null;
  }

  const journey = newJourney();
  journey.at = id;
  journey.trail = routeTo(id);
  for (let i = 1; i < journey.trail.length; i++) journey.day += rail_leg_days(journey.trail[i - 1], journey.trail[i]);
  music_follow_trail(journey.trail);

  const area = query.get('area') ?? 'map';
  const areas = ['town', ...Object.keys(loc.areas ?? {})];
  if (area === 'yard' && loc.yard) return new YardScene(game, journey);
  if (areas.includes(area)) return new AreaScene(game, journey, id, area);
  if (area !== 'map') {
    const options = ['map', ...areas, ...(loc.yard ? ['yard'] : [])];
    game.toast = { text: `${loc.name} has no area "${area}". Try: ${options.join(', ')}`, t: 8 };
  }
  return new MapScene(game, journey);
}

/** The cities on the shortest way by rail from New York to `to` (fewest stops). */
function routeTo(to) {
  const from = { [START_CITY]: null };
  const queue = [START_CITY];
  while (queue.length) {
    const city = queue.shift();
    if (city === to) break;
    for (const next of rail_lines_from(city)) {
      if (!(next in from)) {
        from[next] = city;
        queue.push(next);
      }
    }
  }
  if (!(to in from)) return [to]; // no way there by rail: just be there
  const trail = [];
  for (let c = to; c; c = from[c]) trail.unshift(c);
  return trail;
}
