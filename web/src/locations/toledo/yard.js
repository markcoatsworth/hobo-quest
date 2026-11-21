// Toledo: the rail yard. Part of src/locations/toledo/; the format is
// documented in src/locations/index.js.

export default {
  player: 380,
  office: { x: 727, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BB.TBB' },
    { x: 405, moving: 'EBRB', speed: 80, dir: 1, at: 120 },
    { x: 620, cars: 'B.BGBB' },
    { x: 835, cars: 'TB.BB.' },
    { x: 1050, cars: 'BB.RBG' },
  ],
  trains: [{ to: 'chicago', number: '2135', open: 4, departs: 50 }],
  bulls: [
    { x: 1106, y: 420, dir: -1 },
    { x: 512, y: 260, dir: 1 },
  ],
};
