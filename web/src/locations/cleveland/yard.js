// Cleveland: the rail yard. Part of src/locations/cleveland/; the format is
// documented in src/locations/index.js.

export default {
  player: 420,
  office: { x: 448, y: 200 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'GGG.GG' },
    { x: 362, moving: 'EGGG', speed: 85, dir: -1, at: 500 },
    { x: 534, cars: 'BB.BTB' },
    { x: 706, cars: 'T.TTB.' },
    { x: 878, moving: 'EBB', speed: 60, dir: 1, at: 150 },
    { x: 1050, cars: 'GB.BBG' },
  ],
  trains: [
    { to: 'toledo', number: '1146', open: 4, departs: 50 },
  ],
  bulls: [
    { x: 1106, y: 250, dir: 1 },
    { x: 620, y: 520, dir: -1 },
  ],

  // Jesse (src/characters/jesse/), just inside the gate, waiting for a
  // freight west. He stops Scout on the way in and joins the party.
  meet: {
    joins: 'jesse',
    x: 118,
    y: 420,
    lines: [
      'Psst. Over here, by the fence. Don’t look so worried, I’m no railroad bull.',
      'Name’s Jesse. I run. The hundred, the two-twenty, the broad jump.',
      'There are trials for the Olympic team this summer, and the Games are in Los Angeles. Coach says I’ve got a real chance. Nobody’s got the fare.',
      { by: 'scout', text: 'I’m going west too. My family’s out there somewhere.' },
      'Then let’s go together. Two pairs of eyes see the bulls coming, and the road’s safer for me with company.',
    ],
  },
};
