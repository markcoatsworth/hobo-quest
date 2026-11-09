// The journey in progress, kept in localStorage so Continue can pick it up.
// Storage can throw (private windows, blocked site data); then saving is
// silently skipped and there is never a save to continue.

const KEY = 'hobo-quest.save';

export function newJourney() {
  return {
    route: null, // 'north' | 'south', chosen in New York
    stop: 0, // index into the route's stops: where you are now
    day: 1,
    arrests: 0,
    missed: 0, // trains missed
    riding: false, // aboard a freight between stop and stop + 1
  };
}

export function hasSave() {
  return loadJourney() !== null;
}

export function loadJourney() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...newJourney(), ...JSON.parse(raw) } : null;
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
