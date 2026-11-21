// Dallas: the rail yard. Part of src/locations/dallas/; the format is
// documented in src/locations/index.js.

export default {
  player: 520,
  office: { x: 620, y: 220 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'TTT.TT' },
    { x: 362, moving: 'ETTT', speed: 80, dir: -1, at: 300 },
    { x: 534, cars: 'B.BTB.' },
    { x: 706, cars: 'TB.BBT' },
    { x: 878, moving: 'EBB', speed: 90, dir: 1, at: 100 },
    { x: 1050, cars: 'BTB.BB' },
  ],
  trains: [
    { to: 'el_paso', number: '1745', open: 3, departs: 50 },
  ],
  bulls: [
    { x: 1106, y: 420, dir: -1 },
    { x: 448, y: 200, dir: 1 },
  ],
};
