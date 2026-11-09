// Dallas: oil money downtown, Deep Ellum by the tracks.

export default {
  id: 'dal',
  name: 'Dallas',
  at: [553, 600],
  blurb: 'Oil money downtown, dust and empty pockets everywhere else.',

  town: {
    width: 2300,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'block', x: 60, w: 160, h: 180 },
      { shape: 'tower', x: 260, w: 100, h: 320 }, // the tallest bank in Texas
      { shape: 'block', x: 380, w: 180, h: 220 },
      { shape: 'tower', x: 600, w: 80, h: 260 },
      { shape: 'tank', x: 760, w: 140, h: 120 },
      { shape: 'block', x: 940, w: 200, h: 160 },
      { shape: 'tank', x: 1200, w: 120, h: 110 },
      { shape: 'block', x: 1360, w: 220, h: 140 },
    ],
    buildings: [
      { x: 0, w: 240, h: 220, wall: '#a48a6a' },
      { x: 250, w: 260, h: 260, wall: '#c8b898', sign: 'Oil Company', place: 'oil' },
      { x: 520, w: 200, h: 200, wall: '#8a6a50' },
      { x: 730, w: 240, h: 180, wall: '#5a3a3a', sign: 'Deep Ellum', place: 'ellum', roof: 'gate' },
      { x: 980, w: 200, h: 190, wall: '#9a7a58', sign: 'Chili Parlor', place: 'chili', roof: 'false-front' },
      { x: 1190, w: 220, h: 200, wall: '#6a5a4a', sign: 'Pawn Shop', place: 'pawn' },
      { x: 1420, w: 260, h: 230, wall: '#8a7258' },
      { x: 1690, w: 610, h: 200, wall: '#7a644e' },
    ],
    places: {
      oil: {
        name: 'Oil Company Office',
        kind: 'landmark',
        blurb: 'East Texas struck a gusher and every company in the state is drilling. They want roughnecks with experience.',
      },
      ellum: {
        name: 'Deep Ellum',
        kind: 'game',
        blurb: 'Pawnshops by day, guitars and dominoes by night. A domino game is running on an upturned crate.',
        game: 'Dominoes',
      },
      chili: {
        name: 'Chili Parlor',
        kind: 'diner',
        blurb: 'A bowl of red with all the crackers you can eat.',
        stock: [
          ['Bowl of chili', '10¢'],
          ['Coffee', '5¢'],
        ],
      },
      pawn: {
        name: 'Pawn Shop',
        kind: 'store',
        blurb: 'Guitars hanging on every wall. Half of them were pawned to buy a ticket out.',
        stock: [
          ['Harmonica', '25¢'],
          ['Bandana', '5¢'],
        ],
      },
    },
    npcs: [
      {
        id: 'roughneck',
        name: 'Roughneck',
        x: 560,
        look: { coat: '#5a4a3a', pants: '#3a3a3a', hat: 'cap', skin: '#d0a07a' },
        lines: [
          'Crude went to ten cents a barrel. Governor sent the guard to shut the wells.',
          'West of here it’s all desert. The freight to El Paso stops for water, so be ready for the bulls at the tanks.',
        ],
      },
      {
        id: 'singer',
        name: 'Street Singer',
        x: 1650,
        look: { coat: '#4a3a3a', pants: '#2a2a2a', hat: 'fedora', skin: '#6a4430' },
        lines: [
          'Got a song for every railroad in Texas.',
          'Sing for your supper long enough and you’ll know every town by its echo.',
        ],
      },
    ],
    lamps: [180, 600, 980, 1380, 1780, 2120],
    yardSign: 2200,
  },

  yard: {
    departs: 50,
    player: 520,
    tracks: [
      { x: 190, cars: 'TTT.TT' },
      { x: 362, moving: 'ETTT', speed: 80, dir: -1, at: 300 },
      { x: 534, cars: 'B.BTB.' },
      { x: 706, cars: 'TB.BBT' },
      { x: 878, moving: 'EBB', speed: 90, dir: 1, at: 100 },
      { x: 1050, cars: 'BTB.BB' },
    ],
    train: { open: 3 },
    bulls: [
      { x: 1106, y: 420, dir: -1 },
      { x: 448, y: 200, dir: 1 },
    ],
  },
};
