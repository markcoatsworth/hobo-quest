// Philadelphia: the rail yard. Part of src/locations/philadelphia/; the format is
// documented in src/locations/index.js.

export default {
  player: 330,
  office: { x: 727, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'B.BBGB' },
    { x: 405, cars: 'TTB.BB' },
    { x: 620, moving: 'EBB', speed: 65, dir: 1, at: 350 },
    { x: 835, cars: 'BB.RBB' },
    { x: 1050, cars: 'B.BGB.' },
  ],
  trains: [
    { to: 'washington_dc', number: '1803', open: 3, departs: 45 },
  ],
  bulls: [{ x: 1106, y: 200, dir: 1 }],
};
