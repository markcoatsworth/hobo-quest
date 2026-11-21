// Nashville: the rail yard. Part of src/locations/nashville/; the format is
// documented in src/locations/index.js.

export default {
  player: 230,
  office: { x: 727, y: 200 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'B.BBB.' },
    { x: 405, moving: 'EBB', speed: 80, dir: 1, at: 100 },
    { x: 620 }, // kept clear for a departing freight
    { x: 835, moving: 'EGG', speed: 70, dir: -1, at: 550 },
    { x: 1050, cars: 'BB.BTB' },
  ],
  trains: [
    { to: 'clarksdale', number: '1630', open: 3, departs: 45 },
    { to: 'oklahoma_city', track: 3, number: '4471', open: 4, departs: 75, card: 2 },
  ],
  bulls: [{ x: 1106, y: 350, dir: 1 }],
};
