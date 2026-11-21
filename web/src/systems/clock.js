// The time of day. The journey keeps the day (journey.day, 1 = the morning
// Scout leaves home, April 4, 1932) and the minute of that day
// (journey.time, 0 = midnight .. 1439), and the clock runs at a different
// speed depending on where you are:
//
//   areas (towns, the family home)  slowest: half a minute a second
//   rail yards                      faster: a minute a second
//   riding the rails                fastest: an hour a second (a one-day
//                                   hop about 24 seconds, five times
//                                   quicker held at a hurry)
//
// The map, menus, the journal and conversations stop it. Nothing skips it
// ahead except a night in jail (out at 7 a.m.).
//
// The yards work around the clock. Each freight leaves on a repeating
// schedule: every `every` minutes (the yard's, by default two hours, or one
// for a yard with a single freight), at its `departs` minutes past the
// start of each run, counted from midnight. Walk in at any time and each
// one is made up for its next departure. A ride takes its line's days
// (src/rail/network.json `days`) to the minute.
//
// Plain functions on plain data, GameMaker-style, like every system here.

export const MINUTES_PER_DAY = 24 * 60;

// Game minutes per real second.
export const CLOCK_RATE = {
  area: 0.5,
  yard: 1,
  ride: 60,
};

export const ARRIVES = 7 * 60; // 7 a.m.: when a URL start (src/start.js) has you just in
export const RELEASED = 7 * 60; // 7 a.m.: let out after a night in jail
export const DAY_STARTS = 9 * 60; // 9 a.m.: a new journey's first morning
export const YARD_EVERY = 120; // minutes between a freight's runs, in a yard of several
export const YARD_EVERY_ONE = 60; // and in a yard with just the one
export const YARD_LEAD = 15; // a freight leaving sooner than this after you walk in has already gone

/** Minutes since the journey began (midnight before day 1). */
export function clock_now(journey) {
  return (journey.day - 1) * MINUTES_PER_DAY + (journey.time ?? DAY_STARTS);
}

/** Set the journey's day and time from minutes since the journey began. */
export function clock_set(journey, minutes) {
  const m = Math.max(0, minutes);
  journey.day = Math.floor(m / MINUTES_PER_DAY) + 1;
  journey.time = m - (journey.day - 1) * MINUTES_PER_DAY;
}

/** Let `minutes` go by. */
export function clock_pass(journey, minutes) {
  clock_set(journey, clock_now(journey) + minutes);
}

/** Midnight at the start of the day `minutes` falls on. */
export function clock_midnight(minutes) {
  return Math.floor(minutes / MINUTES_PER_DAY) * MINUTES_PER_DAY;
}

/** The next time the clock reads `minuteOfDay`, at or after `minutes`. */
export function clock_next(minutes, minuteOfDay) {
  const t = clock_midnight(minutes) + minuteOfDay;
  return t >= minutes ? t : t + MINUTES_PER_DAY;
}

/** The hour of the day, 0 to 24 with fractions, for skies. */
export function clock_hour(minutes) {
  return (((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY) / 60;
}

/** A minute of the day (or any minutes count) as "9:45 p.m.". */
export function clock_format(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

/** How often a yard's freights run (minutes): its own `every`, or the default for its size. */
export function clock_yard_every(yard) {
  return yard.every ?? (yard.trains.length > 1 ? YARD_EVERY : YARD_EVERY_ONE);
}

/**
 * The next time a freight leaves, walking into its yard at `now`: its
 * `departs` minutes past each run of `every`, counted from midnight, and
 * at least YARD_LEAD minutes off.
 */
export function clock_next_departure(departs, every, now) {
  let t = clock_midnight(now) + departs;
  while (t < now + YARD_LEAD) t += every;
  return t;
}

/** When a freight leaving at `departs` gets in: its line's `days` later, to the minute. */
export function clock_arrival(departs, days) {
  return departs + days * MINUTES_PER_DAY;
}
