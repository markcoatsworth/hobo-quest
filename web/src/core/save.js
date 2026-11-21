// The journey in progress, kept in localStorage so Continue can pick it up.
// Storage can throw (private windows, blocked site data); then saving is
// silently skipped and there is never a save to continue.
//
// The journey is plain data only (numbers, strings, arrays, plain objects),
// referring to cities and characters by id, so it saves as JSON as it is.
// The GameMaker build keeps the same shape in global.journey, so this format
// is shared between the two. When the shape changes, bump SAVE_VERSION and
// teach upgradeJourney() to bring older saves forward.

import { START_MONEY } from '../systems/money.js';
import { party_new } from '../systems/party.js';
import { DAY_STARTS } from '../systems/clock.js';

const KEY = 'hobo-quest.save';

export const SAVE_VERSION = 4;
export const START_CITY = 'new_york';
export const GOAL_CITY = 'los_angeles';

export function newJourney() {
  return {
    version: SAVE_VERSION,
    at: START_CITY, // city id: where you are, or where you boarded if riding
    riding: null, // { from, to, departs } while aboard a freight (departs: minutes, src/systems/clock.js)
    trail: [START_CITY], // every city reached, in order (repeats and all)
    day: 1, // 1 = April 4, 1932 (src/core/calendar.js)
    time: DAY_STARTS, // minutes since midnight (src/systems/clock.js)
    arrests: 0,
    missed: 0, // trains missed
    money: START_MONEY, // cents, shared by the party (src/systems/money.js)
    party: party_new(), // party[0] is Scout (src/systems/party.js)
    taken: {}, // things picked up, so they stay gone: { 'location:area:prop': true }
  };
}

export function hasSave() {
  return loadJourney() !== null;
}

export function loadJourney() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? upgradeJourney(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveJourney(journey) {
  try {
    localStorage.setItem(KEY, JSON.stringify(journey));
  } catch {
    // no storage; play on without saves
  }
}

export function clearJourney() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

// Stops on the two fixed routes of the first prototype, for upgrading saves
// made before the rail network.
const OLD_ROUTES = {
  north: ['new_york', 'cleveland', 'chicago', 'kansas_city', 'los_angeles'],
  south: ['new_york', 'philadelphia', 'washington_dc', 'nashville', 'clarksdale', 'dallas', 'el_paso', 'phoenix', 'los_angeles'],
};

// Stops added on the northern line in version 3, between two cities that
// used to be joined directly.
const NORTHERN_STOPS = { 'new_york>cleveland': 'buffalo', 'cleveland>chicago': 'toledo' };

/** Bring a save of any version up to SAVE_VERSION. */
export function upgradeJourney(old) {
  let j = old;
  if (!j.version) {
    // Unversioned: a route ('north' | 'south' | null) and a stop index on it.
    const stops = OLD_ROUTES[j.route] ?? [START_CITY];
    const stop = j.route ? j.stop : 0;
    j = {
      version: 1,
      at: stops[stop],
      riding: j.riding && j.route ? { from: stops[stop], to: stops[stop + 1] } : null,
      trail: stops.slice(0, stop + 1),
      day: j.day,
      arrests: j.arrests,
      missed: j.missed,
    };
  }
  if (j.version === 1) {
    // Version 1 had no party or money: Scout alone, the sheriff's five dollars.
    j = { ...j, version: 2, money: START_MONEY, party: party_new() };
  }
  if (j.version === 2) {
    // Version 3 put Buffalo and Toledo on the northern line: a trail that
    // rode straight from New York to Cleveland, or Cleveland to Chicago,
    // went through them, and a ride on either is now its first stop.
    const trail = [j.trail[0]];
    for (const city of j.trail.slice(1)) {
      const between = NORTHERN_STOPS[`${trail[trail.length - 1]}>${city}`];
      if (between) trail.push(between);
      trail.push(city);
    }
    const r = j.riding;
    const riding = r && NORTHERN_STOPS[`${r.from}>${r.to}`] ? { from: r.from, to: NORTHERN_STOPS[`${r.from}>${r.to}`] } : r;
    j = { ...j, version: 3, trail, riding };
  }
  if (j.version === 3) {
    // Version 4 keeps the time of day: mid-morning, or on a freight, the
    // night it left.
    j = { ...j, version: 4, time: j.riding ? 22 * 60 : 8 * 60 };
  }
  // Fill in anything newer than the save itself.
  return { ...newJourney(), ...j };
}
