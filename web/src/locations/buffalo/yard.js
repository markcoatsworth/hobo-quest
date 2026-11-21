// Buffalo: the rail yard. Part of src/locations/buffalo/; the format is
// documented in src/locations/index.js.

export default {
  player: 320,
  office: { x: 512, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BB.GBB' },
    { x: 405, cars: 'B.BBTB' },
    { x: 620, moving: 'EBB', speed: 75, dir: -1, at: 450 },
    { x: 835, cars: 'GB.BB.' },
    { x: 1050, cars: 'BTB.BG' },
  ],
  trains: [{ to: 'cleveland', number: '1477', open: 3, departs: 50 }],
  bulls: [
    { x: 1106, y: 300, dir: 1 },
    { x: 727, y: 520, dir: -1 },
  ],
};
