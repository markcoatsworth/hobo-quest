// El Paso: the rail yard. Part of src/locations/el_paso/; the format is
// documented in src/locations/index.js.

export default {
  player: 280,
  office: { x: 727, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BB.B.B' },
    { x: 405, cars: 'GBB.BB' },
    { x: 620, moving: 'EBRB', speed: 85, dir: 1, at: 200 },
    { x: 835, cars: 'B.BBRB' },
    { x: 1050, cars: 'BB.BB.' },
  ],
  trains: [
    { to: 'phoenix', number: '3394', open: 4, departs: 45 },
  ],
  bulls: [
    { x: 1106, y: 300, dir: -1 },
    { x: 512, y: 450, dir: 1 },
  ],
};
