// Toledo, 1932: the Glass City, at the end of Lake Erie where the Maumee
// comes in. Glass furnaces going dark, an auto plant with a lot full of
// cars nobody's buying, and half the city's banks shut since last August.

export default {
  id: 'toledo',
  name: 'Toledo',
  at: [805, 330],
  blurb: 'The Glass City, half its furnaces cold. Half its banks closed too, since August.',

  town: {
    width: 2200,
    start: 160,
    sky: 'haze',
    far: [
      { shape: 'block', x: 40, w: 180, h: 180 },
      { shape: 'tower', x: 260, w: 100, h: 330 }, // the new bank tower, 1930
      { shape: 'block', x: 390, w: 160, h: 200 },
      { shape: 'stack', x: 700, w: 26, h: 240 }, // glass furnaces
      { shape: 'stack', x: 750, w: 26, h: 210 },
      { shape: 'block', x: 680, w: 240, h: 140 },
      { shape: 'block', x: 1060, w: 300, h: 160 }, // the car plant
      { shape: 'stack', x: 1300, w: 24, h: 200 },
      { shape: 'tank', x: 1500, w: 110, h: 180 },
    ],
    buildings: [
      { x: 0, w: 220, h: 210, wall: '#8a5a44' },
      { x: 230, w: 280, h: 240, wall: '#a8a090', sign: 'Closed Bank', place: 'bank' },
      { x: 520, w: 200, h: 190, wall: '#6e5444' },
      { x: 730, w: 300, h: 200, wall: '#7a6a5a', sign: 'Glass Works', place: 'glass', roof: 'gable' },
      { x: 1040, w: 200, h: 170, wall: '#9a7a5a', sign: 'Lunch Wagon', place: 'lunch', roof: 'false-front' },
      { x: 1250, w: 320, h: 180, wall: '#5e5a54', sign: 'Auto Plant', place: 'auto' },
      { x: 1580, w: 240, h: 200, wall: '#7a5040', sign: 'Relief Station', place: 'relief' },
      { x: 1830, w: 370, h: 190, wall: '#6e5444' },
    ],
    places: {
      bank: {
        name: 'Closed Bank',
        kind: 'landmark',
        blurb: 'Shut since last August, when half the banks in town closed their doors in a week. A notice in the window. People still stop and read it, as if it might have changed.',
      },
      glass: {
        name: 'Glass Works',
        kind: 'landmark',
        blurb: 'Bottles, windows, windshield glass: the furnaces used to burn day and night. Now two of every three stand cold.',
      },
      lunch: {
        name: 'Lunch Wagon',
        kind: 'diner',
        blurb: 'A converted streetcar on blocks, a grill, six stools. Hot dogs with chili and onions.',
        stock: [
          ['Hot dog with chili', '5¢'],
          ['Coffee', '5¢'],
        ],
      },
      auto: {
        name: 'Auto Plant',
        kind: 'landmark',
        blurb: 'A plant that built cars by the thousand. The lot out front is full of new ones nobody can afford, gathering dust.',
      },
      relief: {
        name: 'Relief Station',
        kind: 'mission',
        blurb: 'The city hands out grocery orders to families here. Single men get a bowl of soup and directions out of town.',
      },
    },
    npcs: [
      {
        id: 'glassblower',
        name: 'Glassblower',
        x: 680,
        look: { coat: '#5a4a3e', pants: '#3a3632', hat: 'cap', skin: '#d8a882' },
        lines: [
          'Twenty years at the furnace. Got lungs like a bellows and nothing to blow.',
          'Had my savings in the bank on Summit Street. Went to get it out in August. So did everybody.',
        ],
      },
      {
        id: 'autoworker',
        name: 'Auto Worker',
        x: 1210,
        look: { coat: '#3e4248', pants: '#2a2a2e', hat: 'fedora', skin: '#a8724c' },
        lines: [
          'Came up from Alabama for the car plant in ’28. Five dollars a day. Now it’s nothing a day.',
          'Freights for Chicago go along the lake shore. Bulls are rough there; a fellow I know lost two teeth.',
        ],
      },
    ],
    lamps: [225, 725, 1245, 1825],
    yardSign: 2100,
  },

  yard: {
    player: 380,
    office: { x: 727, y: 300 }, // the yard office, its board in the window
    tracks: [
      { x: 190, cars: 'BB.TBB' },
      { x: 405, moving: 'EBRB', speed: 80, dir: 1, at: 120 },
      { x: 620, cars: 'B.BGBB' },
      { x: 835, cars: 'TB.BB.' },
      { x: 1050, cars: 'BB.RBG' },
    ],
    trains: [{ to: 'chicago', number: '2135', open: 4, departs: 50 }],
    bulls: [
      { x: 1106, y: 420, dir: -1 },
      { x: 512, y: 260, dir: 1 },
    ],
  },
};
