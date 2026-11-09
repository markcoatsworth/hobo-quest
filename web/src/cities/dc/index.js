// Washington: marble on Pennsylvania Avenue, breadlines a block away.

export default {
  id: 'dc',
  name: 'Washington, DC',
  at: [948, 385],
  blurb: 'Congress argues over relief while the breadlines grow. Veterans talk of marching for their bonus.',

  town: {
    width: 2300,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'block', x: 60, w: 200, h: 130 },
      { shape: 'dome', x: 330, w: 220, h: 230 }, // the Capitol
      { shape: 'block', x: 600, w: 180, h: 140 },
      { shape: 'spire', x: 880, w: 40, h: 380 }, // the Monument
      { shape: 'block', x: 980, w: 240, h: 120 },
      { shape: 'block', x: 1280, w: 200, h: 150 },
      { shape: 'dome', x: 1540, w: 160, h: 150 },
    ],
    buildings: [
      { x: 0, w: 220, h: 200, wall: '#8a6a54' },
      { x: 230, w: 320, h: 260, wall: '#cfc6b2', sign: 'Union Station', place: 'station', roof: 'gable' },
      { x: 560, w: 200, h: 220, wall: '#7a5a48' },
      { x: 770, w: 220, h: 190, wall: '#8e7a5e', sign: 'Lunch Room', place: 'lunch', roof: 'false-front' },
      { x: 1000, w: 220, h: 240, wall: '#6e5444', sign: 'Gospel Mission', place: 'mission' },
      { x: 1230, w: 340, h: 200, wall: '#d8d0bc', sign: 'Capitol Grounds', place: 'capitol', roof: 'gate' },
      { x: 1580, w: 220, h: 230, wall: '#7a6250' },
      { x: 1810, w: 490, h: 210, wall: '#6a5646' },
    ],
    places: {
      station: {
        name: 'Union Station',
        kind: 'landmark',
        blurb: 'Marble and gold leaf, built for senators. The station police know a man off a freight at a glance.',
      },
      lunch: {
        name: 'Lunch Room',
        kind: 'diner',
        blurb: 'Clerks from the departments eat standing up. The counterman saves the heels of the bread.',
        stock: [
          ['Bean soup', '10¢'],
          ['Coffee', '5¢'],
        ],
      },
      mission: {
        name: 'Gospel Mission',
        kind: 'mission',
        blurb: 'Bread, coffee and a cot. Lights out at nine and no talking.',
      },
      capitol: {
        name: 'Capitol Grounds',
        kind: 'game',
        blurb: 'Men with petitions work the steps, trying to catch a congressman’s eye.',
        game: 'Petition the Congressman',
      },
    },
    npcs: [
      {
        id: 'vet',
        name: 'Doughboy',
        x: 1180,
        look: { coat: '#5a5a3a', pants: '#3a3a2a', hat: 'fedora', skin: '#e0b896' },
        lines: [
          'I went to France in ’18. They promised us a bonus, payable 1945.',
          'Some of the fellows say we ought to march on this town and camp till they pay. Come summer, maybe.',
        ],
      },
      {
        id: 'porter',
        name: 'Sleeping-Car Porter',
        x: 600,
        look: { coat: '#2a2a3a', pants: '#22222e', hat: 'cap', skin: '#6a4430' },
        lines: [
          'I ride the same rails you do, but on the inside, making beds.',
          'The southbound freight leaves from the yards past the river. Bulls there are lazy before noon.',
        ],
      },
    ],
    lamps: [180, 560, 980, 1300, 1780, 2120],
    yardSign: 2200,
  },

  yard: {
    departs: 45,
    player: 480,
    tracks: [
      { x: 190, cars: 'BBB.BB' },
      { x: 405, moving: 'EBBT', speed: 75, dir: -1, at: 400 },
      { x: 620, cars: 'B.BB.B' },
      { x: 835, cars: 'RBB.TB' },
      { x: 1050, cars: 'BB.BBB' },
    ],
    train: { open: 4 },
    bulls: [
      { x: 1106, y: 480, dir: -1 },
      { x: 727, y: 250, dir: 1 },
    ],
  },
};
