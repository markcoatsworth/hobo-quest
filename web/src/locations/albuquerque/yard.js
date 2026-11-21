// Albuquerque: the rail yard. Part of src/locations/albuquerque/; the format is
// documented in src/locations/index.js.

export default {
  player: 300,
  office: { x: 512, y: 220 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'B.BBRB' },
    { x: 405, moving: 'EBB', speed: 85, dir: -1, at: 500 },
    { x: 620 }, // kept clear for a departing freight
    { x: 835, cars: 'RB.BTB' },
    { x: 1050, cars: 'BB.GBB' },
  ],
  trains: [
    { to: 'flagstaff', number: '3760', open: 3, departs: 50 },
    { to: 'el_paso', track: 3, number: '2412', open: 4, departs: 75, card: 2 },
  ],
  bulls: [
    { x: 1106, y: 280, dir: 1 },
    { x: 727, y: 460, dir: -1 },
  ],
};
