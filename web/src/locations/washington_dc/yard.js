// Washington, DC: the rail yard. Part of src/locations/washington_dc/; the format is
// documented in src/locations/index.js.

export default {
  player: 480,
  office: { x: 512, y: 400 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BBB.BB' },
    { x: 405, moving: 'EBBT', speed: 75, dir: -1, at: 400 },
    { x: 620, cars: 'B.BB.B' },
    { x: 835, cars: 'RBB.TB' },
    { x: 1050, cars: 'BB.BBB' },
  ],
  trains: [
    { to: 'nashville', number: '2047', open: 4, departs: 45 },
  ],
  bulls: [
    { x: 1106, y: 480, dir: -1 },
    { x: 727, y: 250, dir: 1 },
  ],
};
