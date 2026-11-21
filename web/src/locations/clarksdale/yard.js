// Clarksdale: the rail yard. Part of src/locations/clarksdale/; the format is
// documented in src/locations/index.js.

export default {
  player: 400,
  office: { x: 620, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'B.BB.B' },
    { x: 477, cars: 'BBB.BB' },
    { x: 763, moving: 'EBB', speed: 60, dir: 1, at: 300 },
    { x: 1050, cars: 'BB.BB.' },
  ],
  trains: [
    { to: 'dallas', number: '931', open: 4, departs: 40 },
  ],
  bulls: [{ x: 1106, y: 250, dir: 1 }],
};
