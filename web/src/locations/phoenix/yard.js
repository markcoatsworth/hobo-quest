// Phoenix: the rail yard. Part of src/locations/phoenix/; the format is
// documented in src/locations/index.js.

export default {
  player: 440,
  office: { x: 512, y: 250 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'RR.RR.' },
    { x: 405, moving: 'ERR', speed: 75, dir: -1, at: 450 },
    { x: 620, cars: 'R.RBRR' },
    { x: 835, moving: 'EBB', speed: 95, dir: 1, at: 100 },
    { x: 1050, cars: 'RRB.RR' },
  ],
  trains: [
    { to: 'los_angeles', number: '2266', cars: 'ERRRRRRRRRRRRRR', open: 3, departs: 45 },
  ],
  bulls: [
    { x: 1106, y: 500, dir: 1 },
    { x: 727, y: 250, dir: -1 },
  ],
};
