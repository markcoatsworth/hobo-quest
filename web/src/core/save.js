// The journey in progress, kept in localStorage so Continue can pick it up.
// Storage can throw (private windows, blocked site data); then saving is
// silently skipped and there is never a save to continue.
//
// The journey is plain data only (numbers, strings, arrays, plain objects),
// referring to cities and characters by id, so it saves as JSON as it is.
// The GameMaker build keeps the same shape in global.journey, so this format
// is shared between the two. When the shape changes, bump SAVE_VERSION and
// teach upgradeJourney() to bring older saves forward.

const KEY = 'hobo-quest.save';

export const SAVE_VERSION = 1;
export const START_CITY = 'new_york';
export const GOAL_CITY = 'los_angeles';

export function newJourney() {
  return {
    version: SAVE_VERSION,
    at: START_CITY, // city id: where you are, or where you boarded if riding
    riding: null, // { from, to } while aboard a freight
    trail: [START_CITY], // every city reached, in order (repeats and all)
    day: 1,
    arrests: 0,
    missed: 0, // trains missed
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
  // Fill in anything newer than the save itself.
  return { ...newJourney(), ...j };
}
