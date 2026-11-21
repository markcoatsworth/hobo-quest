// Oklahoma City: the rail yard. Part of src/locations/oklahoma_city/; the format is
// documented in src/locations/index.js.

export default {
  player: 360,
  office: { x: 727, y: 450 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'TTB.TT' },
    { x: 405, cars: 'B.BGBB' },
    { x: 620, moving: 'ETTB', speed: 80, dir: 1, at: 150 },
    { x: 835 }, // kept clear for a departing freight
    { x: 1050, cars: 'GB.BBT' },
  ],
  trains: [
    { to: 'dallas', number: '1588', open: 3, departs: 50, card: 5 },
    { to: 'albuquerque', track: 4, number: '3951', open: 4, departs: 80 },
  ],
  bulls: [
    { x: 1106, y: 380, dir: -1 },
    { x: 512, y: 220, dir: 1 },
  ],
};
