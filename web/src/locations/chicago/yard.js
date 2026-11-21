// Chicago: the rail yard. Part of src/locations/chicago/; the format is
// documented in src/locations/index.js.

export default {
  fromMap: false, // walk through the city to reach it
  player: 360,
  office: { x: 691, y: 400 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'BB.BRB' },
    { x: 333, cars: 'RR.RRB' },
    { x: 476, moving: 'EBBRB', speed: 90, dir: 1, at: 100 },
    { x: 620, cars: 'B.TBB.' },
    { x: 763, cars: 'GBB.BB' },
    { x: 906, moving: 'ETTB', speed: 75, dir: -1, at: 600 },
    { x: 1050, cars: 'BRB.BB' },
  ],
  trains: [
    { to: 'kansas_city', number: '2591', open: 3, departs: 55 },
  ],
  bulls: [
    { x: 1106, y: 500, dir: -1 },
    { x: 548, y: 200, dir: 1 },
    { x: 834, y: 450, dir: -1 },
  ],
};
