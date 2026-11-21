// The moon: its phase, how much of it is lit, and when it's up, all from
// the journey clock (src/systems/clock.js: minutes since midnight before
// day 1, April 4, 1932). Drawing it is src/art/moon.js.
//
// Measured from one known full moon, 10 p.m. on April 20, 1932, and the
// length of a lunar month: the phase is how far round the cycle from there,
// 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. The journey opens
// two days before a new moon (April 6), so Scout's first nights out are
// near moonless.
//
// It rises about 50 minutes later each day: a new moon rises and sets with
// the sun, a full moon rises at sunset and sets at sunrise.
//
// Plain functions on plain numbers, GameMaker-style, like every system here.

import { MINUTES_PER_DAY, clock_midnight } from './clock.js';

export const LUNAR_MONTH = 29.530589 * MINUTES_PER_DAY; // minutes, new moon to new moon
export const MOON_FULL = (17 - 1) * MINUTES_PER_DAY + 22 * 60; // April 20, 1932 (day 17), 10 p.m.

const NEW_MOON_RISES = 6.9; // hour: with the sun, near enough (src/art/sky.js SUNRISE)
const MOON_UP = 12.4 * 60; // minutes it's in the sky, rise to set

/** Where the moon is in its cycle at `minutes`: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
export function moon_phase(minutes) {
  const since = (minutes - MOON_FULL) / LUNAR_MONTH + 0.5;
  return since - Math.floor(since);
}

/** How much of the disc is lit at `minutes`, 0 (new) to 1 (full). */
export function moon_lit(minutes) {
  return (1 - Math.cos(2 * Math.PI * moon_phase(minutes))) / 2;
}

/** The phase in words: "new moon", "waxing crescent" ... "waning crescent". */
export function moon_name(minutes) {
  const names = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'];
  return names[Math.round(moon_phase(minutes) * 8) % 8];
}

/** The hour the moon rises on the day `minutes` falls in, 0 to 24. */
export function moon_rises(minutes) {
  return (NEW_MOON_RISES + moon_phase(minutes) * 24) % 24;
}

/**
 * Where the moon is at `minutes`: how far across the sky, 0 rising to 1
 * setting, or null while it's down.
 */
export function moon_up(minutes) {
  let rose = clock_midnight(minutes) + moon_rises(minutes) * 60;
  if (rose > minutes) rose -= MINUTES_PER_DAY; // it rose yesterday
  const since = minutes - rose;
  return since <= MOON_UP ? since / MOON_UP : null;
}
