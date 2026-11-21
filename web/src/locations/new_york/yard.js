// New York: the rail yard. Part of src/locations/new_york/; the format is
// documented in src/locations/index.js.

export default {
  fromMap: false, // only through the city, by the sign at the end of the street
  player: 300,
  office: { x: 512, y: 150 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BB.TBB' },
    { x: 405, moving: 'EBRB', speed: 70, dir: 1, at: 250 },
    { x: 620, cars: 'GB.BBT' },
    { x: 835 }, // kept clear for a departing freight
    { x: 1050, cars: 'TBB.BG' },
  ],
  trains: [
    { to: 'philadelphia', number: '2207', open: 3, departs: 50 },
    { to: 'buffalo', track: 4, number: '3418', open: 5, departs: 80, card: 2 },
  ],
  bulls: [{ x: 1106, y: 420, dir: -1 }],
};
