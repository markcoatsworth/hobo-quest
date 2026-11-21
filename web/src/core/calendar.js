// Journey days as calendar dates. Day 1 is the morning you leave New York.
const START = new Date(1932, 3, 4); // April 4, 1932

export function dateOf(day) {
  const d = new Date(START);
  d.setDate(d.getDate() + day - 1);
  return d;
}

/** The journey day a date falls on (day 1 is April 4, 1932; earlier dates give 1). */
export function dayOf(date) {
  const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1932, 3, 4);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function formatDate(day) {
  return dateOf(day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** "Apr 9, 1932": for the status plate, where room is short. */
export function formatDateShort(day) {
  return dateOf(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
