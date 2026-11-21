// Flagstaff: the rail yard. Part of src/locations/flagstaff/; the format is
// documented in src/locations/index.js.

export default {
  player: 420,
  office: { x: 727, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'GG.GGB' },
    { x: 405, cars: 'B.GGBB' },
    { x: 620, moving: 'EGG', speed: 70, dir: 1, at: 200 },
    { x: 835 }, // kept clear for a departing freight
    { x: 1050, cars: 'GGB.BG' },
  ],
  trains: [
    { to: 'phoenix', number: '2930', open: 3, departs: 45, card: 5 },
    { to: 'los_angeles', track: 4, number: '3811', open: 4, departs: 75 },
  ],
  bulls: [
    { x: 1106, y: 320, dir: -1 },
    { x: 298, y: 500, dir: 1 },
  ],
};
