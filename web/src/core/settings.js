// Player settings: music volume, mute, controller rumble. Plain data, kept
// in localStorage separately from the journey so a New Game doesn't reset
// them. Storage can throw (private windows, blocked site data); then the
// settings just last until the page is closed.
//
// The GameMaker build keeps the same fields in its own settings file.

const KEY = 'hobo-quest.settings';

export const MUSIC_STEPS = 10; // music volume runs 0..MUSIC_STEPS

const DEFAULTS = {
  music: 7,
  muted: false,
  rumble: true,
};

let current = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** The current settings (read-only: change them with settings_set). */
export function settings_get() {
  return current;
}

export function settings_set(key, value) {
  current = { ...current, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // no storage; the change lasts for this visit
  }
  for (const fn of listeners) fn(current);
}

/** Call fn(settings) whenever a setting changes. Returns an unsubscribe. */
export function settings_on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
