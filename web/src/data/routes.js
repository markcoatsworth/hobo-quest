// Routes and the legs between stops.
//
// Coordinates are pixels in source/usa-rail-network-2010.png (1115×862),
// the same space as public/map/*.png. Leg waypoints trace the rail lines on
// that map where one exists; the southern route's missing links are faked.
// The cities themselves live in src/cities/.

import { CITIES } from '../cities/index.js';

export { CITIES };

// Waypoints between consecutive stops, excluding the stops themselves.
// Keyed "from-to".
const LEG_PATHS = {
  // Northern: the Water Level Route up the Hudson and along Lake Erie.
  'nyc-cle': [[992, 296], [980, 268], [955, 262], [900, 272], [872, 300]],
  'cle-chi': [[800, 338], [760, 340]],
  'chi-kc': [[690, 352], [645, 385]],
  'kc-la': [[565, 455], [500, 505], [428, 545], [370, 535], [320, 510], [270, 495], [205, 487], [140, 492]],
  // Southern.
  'nyc-phl': [[987, 337]],
  'phl-dc': [[962, 368]],
  'dc-nas': [[900, 420], [850, 448], [800, 476]],
  'nas-clk': [[730, 513], [697, 527]],
  'clk-dal': [[640, 570], [600, 590]],
  'dal-elp': [[500, 605], [440, 614], [390, 612]],
  'elp-phx': [[300, 585], [258, 562]],
  'phx-la': [[170, 530], [132, 515]],
};

export const ROUTES = {
  north: {
    name: 'Northern Line',
    stops: ['nyc', 'cle', 'chi', 'kc', 'la'],
    pitch: 'Four big yards through the industrial heartland. Fewer hops, more bulls.',
  },
  south: {
    name: 'Southern Line',
    stops: ['nyc', 'phl', 'dc', 'nas', 'clk', 'dal', 'elp', 'phx', 'la'],
    pitch: 'Eight small-town yards through Dixie and the desert. Longer, but quieter.',
  },
};

/** Full polyline for a leg, stops included, in source-image pixels. */
export function legPath(from, to) {
  return [CITIES[from].at, ...LEG_PATHS[`${from}-${to}`], CITIES[to].at];
}

/** Polyline for a whole route. */
export function routePath(routeId) {
  const stops = ROUTES[routeId].stops;
  const pts = [CITIES[stops[0]].at];
  for (let i = 0; i < stops.length - 1; i++) pts.push(...legPath(stops[i], stops[i + 1]).slice(1));
  return pts;
}

export function pathLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return len;
}

/** Point a fraction t (0–1) of the way along a polyline. */
export function pointAlong(pts, t) {
  let remaining = t * pathLength(pts);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (remaining <= seg) {
      const k = seg ? remaining / seg : 0;
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
    remaining -= seg;
  }
  return pts[pts.length - 1];
}

/** Days a leg takes on the train: about 300 miles (110 map pixels) a day on a slow freight. */
export function legDays(from, to) {
  return Math.max(1, Math.round(pathLength(legPath(from, to)) / 110));
}


// ---------------------------------------------------------------- travel

// The source map spans the lower 48 (~2,800 miles) in ~1,020 pixels.
const MILES_PER_PIXEL = 2.75;

export function legMiles(from, to) {
  return Math.round(pathLength(legPath(from, to)) * MILES_PER_PIXEL);
}

/** Miles from the start of the route to stop index i. */
export function milesTo(routeId, i) {
  const stops = ROUTES[routeId].stops;
  let miles = 0;
  for (let k = 0; k < i; k++) miles += legMiles(stops[k], stops[k + 1]);
  return miles;
}

// What the country looks like from the boxcar door along each leg:
// [fraction of the way along, region]. Regions are drawn in
// src/scenes/travel.js.
const SCENERY = {
  'nyc-cle': [[0, 'river'], [0.45, 'hills'], [0.85, 'mill']],
  'cle-chi': [[0, 'mill'], [0.25, 'prairie'], [0.82, 'mill']],
  'chi-kc': [[0, 'mill'], [0.15, 'prairie']],
  'kc-la': [[0, 'prairie'], [0.3, 'desert'], [0.88, 'groves']],
  'nyc-phl': [[0, 'mill'], [0.3, 'hills'], [0.8, 'mill']],
  'phl-dc': [[0, 'mill'], [0.25, 'hills'], [0.85, 'mill']],
  'dc-nas': [[0, 'hills'], [0.2, 'mountains'], [0.8, 'hills']],
  'nas-clk': [[0, 'hills'], [0.4, 'cotton']],
  'clk-dal': [[0, 'cotton'], [0.6, 'prairie']],
  'dal-elp': [[0, 'prairie'], [0.4, 'desert']],
  'elp-phx': [[0, 'desert']],
  'phx-la': [[0, 'desert'], [0.6, 'groves']],
};

/** Region at a fraction (0–1) of the way along a leg. */
export function sceneryAt(from, to, f) {
  const list = SCENERY[`${from}-${to}`];
  let region = list[0][1];
  for (const [at, r] of list) if (f >= at) region = r;
  return region;
}
