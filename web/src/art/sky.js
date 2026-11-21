// The sky through the day, by the clock (src/systems/clock.js): one set of
// colours for the ride and the towns, so a sunset on the rails and a
// sunset on a main street are the same sunset. April 1932: the sun's up a
// little before 6:30 and down around 7:30 in the evening. (The moon is
// src/systems/moon.js and src/art/moon.js.)
//
// Times are hours, 0 to 24.

// [hour, top of the sky, horizon]
const SKY = [
  [0, '#0e1228', '#232744'],
  [4.5, '#121630', '#2c2e4c'],
  [5.6, '#46426e', '#f0a46c'], // first light
  [7.2, '#6f9bcf', '#d9e8ee'],
  [17.8, '#6a96cc', '#e1e7dc'],
  [19.3, '#4a3b63', '#ec8a52'], // sunset
  [20.5, '#121630', '#2c2e4c'],
  [24, '#0e1228', '#232744'],
];

// [hour, how dark the land is, 0 to 0.62]
const DARK = [
  [0, 0.62],
  [4.5, 0.6],
  [5.6, 0.3],
  [7, 0],
  [18, 0],
  [19.3, 0.32],
  [20.3, 0.56],
  [21, 0.62],
  [24, 0.62],
];
export const DARKEST = 0.62;

export const SUNRISE = 6.2;
export const SUNSET = 19.6;

/** The sky's colours at `hour`: [top, horizon]. */
export function sky_colors(hour) {
  for (let i = 1; i < SKY.length; i++) {
    if (hour <= SKY[i][0]) {
      const [t0, a1, a2] = SKY[i - 1];
      const [t1, b1, b2] = SKY[i];
      const k = (hour - t0) / (t1 - t0);
      return [mix(a1, b1, k), mix(a2, b2, k)];
    }
  }
  return [SKY[0][1], SKY[0][2]];
}

/** How dark the land is at `hour`: 0 by day to DARKEST at night. */
export function sky_dark(hour) {
  return curve(DARK, hour);
}

/** How far the sun is across the sky at `hour` (0 rising, 1 setting), or null while it's down. */
export function sky_sun(hour) {
  return hour >= SUNRISE && hour <= SUNSET ? (hour - SUNRISE) / (SUNSET - SUNRISE) : null;
}

/**
 * A town's sky at `hour`: its own colours by day (`base`: { top, bottom,
 * far }, the area's `sky`), turning to the shared sky through dusk and
 * night and back at dawn.
 */
export function sky_town(base, hour) {
  const [top, bottom] = sky_colors(hour);
  const day = dayness(hour);
  const night = sky_dark(hour) / DARKEST;
  return {
    top: mix(top, base.top, day),
    bottom: mix(bottom, base.bottom, day),
    far: mix(base.far, '#1e2034', night * 0.85),
    lit: night > 0.3, // lamps and windows
  };
}

/** 1 in full day, 0 from dusk to dawn, easing between. */
function dayness(hour) {
  return curve(
    [
      [0, 0],
      [5.6, 0],
      [7.4, 1],
      [17.8, 1],
      [19.4, 0],
      [24, 0],
    ],
    hour,
  );
}

export function curve(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1];
      const [t1, b] = keys[i];
      return a + ((b - a) * (t - t0)) / (t1 - t0);
    }
  }
  return keys[keys.length - 1][1];
}

const hexes = new Map();
function rgb(c) {
  if (c.startsWith('#')) {
    if (!hexes.has(c)) hexes.set(c, [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).concat(1));
    return hexes.get(c);
  }
  const m = c.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
}

/** Mix two colours (hex or rgba()), k = 0 gives a, 1 gives b. */
export function mix(a, b, k) {
  const A = rgb(a);
  const B = rgb(b);
  const v = A.map((x, i) => x + (B[i] - x) * k);
  return `rgba(${Math.round(v[0])}, ${Math.round(v[1])}, ${Math.round(v[2])}, ${v[3].toFixed(3)})`;
}
