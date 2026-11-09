// Phoenix: a desert farm town of canals, citrus and cotton.

export default {
  id: 'phx',
  name: 'Phoenix',
  at: [220, 548],
  blurb: 'Citrus groves and blazing sun. A closed boxcar out here is an oven.',

  town: {
    width: 2100,
    start: 160,
    sky: 'desert',
    far: [
      { shape: 'mountain', x: 0, w: 700, h: 120 },
      { shape: 'mountain', x: 500, w: 420, h: 200 }, // the camel-backed mountain
      { shape: 'block', x: 900, w: 160, h: 170 },
      { shape: 'tower', x: 1080, w: 70, h: 210 },
      { shape: 'mountain', x: 1150, w: 900, h: 140 },
    ],
    buildings: [
      { x: 0, w: 220, h: 160, wall: '#d8bc94' },
      { x: 230, w: 320, h: 180, wall: '#c8a878', sign: 'Packing House', place: 'packing' },
      { x: 560, w: 200, h: 150, wall: '#b8946a', roof: 'false-front' },
      { x: 770, w: 220, h: 170, wall: '#a8b0b8', sign: 'Ice House', place: 'ice' },
      { x: 1000, w: 220, h: 160, wall: '#c89a70', sign: 'Café', place: 'cafe', roof: 'false-front' },
      { x: 1230, w: 300, h: 120, wall: '#7a8a6a', sign: 'Canal', place: 'canal', roof: 'gate' },
      { x: 1540, w: 560, h: 170, wall: '#c4a47c' },
    ],
    places: {
      packing: {
        name: 'Citrus Packing House',
        kind: 'game',
        blurb: 'Grapefruit and oranges down the belt, into crates, onto reefers bound east. They pay by the box.',
        game: 'Packing line',
      },
      ice: {
        name: 'Ice House',
        kind: 'store',
        blurb: 'Blocks of ice for the reefer cars. The iceman lets you stand in the doorway for a minute.',
        stock: [['Chip of ice', '1¢']],
      },
      cafe: {
        name: 'Café',
        kind: 'diner',
        blurb: 'Ceiling fans pushing the heat around. Pie under a glass bell.',
        stock: [
          ['Iced tea', '5¢'],
          ['Tamales, two', '10¢'],
        ],
      },
      canal: {
        name: 'The Canal',
        kind: 'landmark',
        blurb: 'Water from the river dam, running through town in a ditch. Men from the freights wash their shirts here.',
      },
    },
    npcs: [
      {
        id: 'picker',
        name: 'Cotton Picker',
        x: 640,
        look: { coat: '#9a8a6a', pants: '#4a5a6a', hat: 'straw', skin: '#c8946a' },
        lines: [
          'Came out from Oklahoma for the picking. A dollar for a hundred pounds.',
          'Last leg to California? They say the oranges grow so thick you can pick ’em from the boxcar.',
        ],
      },
      {
        id: 'iceman',
        name: 'Iceman',
        x: 1180,
        look: { coat: '#c8c8c0', pants: '#3a3a4a', hat: 'cap', skin: '#e0b896' },
        lines: [
          'Reefers ice up here for the run to the coast. Those cars are cold as a church.',
          'A man could ride a reefer bunker all the way to Los Angeles, if he don’t freeze.',
        ],
      },
    ],
    lamps: [250, 750, 1250, 1750],
    yardSign: 2000,
  },

  yard: {
    departs: 45,
    player: 440,
    tracks: [
      { x: 190, cars: 'RR.RR.' },
      { x: 405, moving: 'ERR', speed: 75, dir: -1, at: 450 },
      { x: 620, cars: 'R.RBRR' },
      { x: 835, moving: 'EBB', speed: 95, dir: 1, at: 100 },
      { x: 1050, cars: 'RRB.RR' },
    ],
    train: { cars: 'ERRRRRRRRRRRRRR', open: 3 },
    bulls: [
      { x: 1106, y: 500, dir: 1 },
      { x: 727, y: 250, dir: -1 },
    ],
  },
};
