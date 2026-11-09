// Kansas City: stockyards on one side of town, jazz on the other.

export default {
  id: 'kc',
  name: 'Kansas City',
  at: [597, 417],
  blurb: 'Stockyards and switchyards. West of here it is a long, dry ride.',

  town: {
    width: 2400,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'block', x: 60, w: 200, h: 150 },
      { shape: 'tank', x: 300, w: 130, h: 180 },
      { shape: 'tower', x: 480, w: 90, h: 300 },
      { shape: 'block', x: 600, w: 170, h: 200 },
      { shape: 'tower', x: 820, w: 70, h: 260 }, // war memorial on the hill
      { shape: 'block', x: 930, w: 200, h: 170 },
      { shape: 'tank', x: 1180, w: 110, h: 170 },
      { shape: 'block', x: 1340, w: 240, h: 140 },
      { shape: 'stack', x: 1620, w: 28, h: 220 },
      { shape: 'block', x: 1680, w: 180, h: 160 },
    ],
    buildings: [
      { x: 0, w: 240, h: 200, wall: '#8a6a4c' },
      { x: 250, w: 340, h: 170, wall: '#7a5a3a', sign: 'Stock Yards', place: 'stockyards', roof: 'gate' },
      { x: 600, w: 200, h: 240, wall: '#6a5444' },
      { x: 810, w: 220, h: 170, wall: '#9a6a46', sign: 'Barbecue', place: 'bbq', roof: 'false-front' },
      { x: 1040, w: 200, h: 260, wall: '#5e4a40' },
      { x: 1250, w: 240, h: 220, wall: '#3a3048', sign: 'Club Vine', place: 'jazz' },
      { x: 1500, w: 200, h: 200, wall: '#6a6050', sign: 'Pawn · Loans', place: 'pawn' },
      { x: 1710, w: 260, h: 250, wall: '#5a4a3e' },
      { x: 1980, w: 420, h: 190, wall: '#6e5a48' },
    ],
    places: {
      stockyards: {
        name: 'The Stock Yards',
        kind: 'game',
        blurb: 'Pens to the horizon and the smell to match. A boss pays a day’s wage to anyone who can drive a pen of steers into the chutes.',
        game: 'Cattle drive',
      },
      bbq: {
        name: 'Barbecue Stand',
        kind: 'diner',
        blurb: 'Slow-smoked meat wrapped in newspaper, sauce that’ll make your eyes water.',
        stock: [
          ['Rib ends', '10¢'],
          ['Slice of bread and sauce', '2¢'],
        ],
      },
      jazz: {
        name: 'Club Vine',
        kind: 'landmark',
        blurb: 'Jazz drifting out the door all night long. The town’s wide open; nobody in City Hall seems to mind.',
      },
      pawn: {
        name: 'Pawn & Loans',
        kind: 'store',
        blurb: 'Saddles, fiddles and a box of somebody’s war letters.',
        stock: [
          ['Canteen', '20¢'],
          ['Work gloves', '15¢'],
        ],
      },
    },
    npcs: [
      {
        id: 'drover',
        name: 'Cattle Drover',
        x: 700,
        look: { coat: '#7a5a3a', pants: '#3a4a5a', hat: 'straw', skin: '#c8946a' },
        lines: [
          'Prices so low the ranchers can’t pay the freight to ship ’em.',
          'Out west the water tanks are a hundred miles apart. Fill your canteen here.',
        ],
      },
      {
        id: 'player',
        name: 'Horn Player',
        x: 1440,
        look: { coat: '#2a2a3e', pants: '#22222e', hat: 'fedora', skin: '#7a4e34' },
        lines: [
          'We play till sunup. Cutting contests, cat against cat.',
          'Heading for California? Plenty of folks are. Not so many coming back.',
        ],
      },
    ],
    lamps: [200, 600, 1000, 1480, 1800, 2200],
    yardSign: 2300,
  },

  yard: {
    departs: 55,
    player: 250,
    tracks: [
      { x: 190, cars: 'RR.RRR' },
      { x: 333, moving: 'ERRR', speed: 70, dir: 1, at: 300 },
      { x: 476, cars: 'B.BBTB' },
      { x: 620, moving: 'EBBB', speed: 95, dir: -1, at: 450 },
      { x: 763, cars: 'TT.BBR' },
      { x: 906, cars: 'B.RB.B' },
      { x: 1050, moving: 'EBBGB', speed: 80, dir: 1, at: 0 },
    ],
    train: { open: 4 },
    bulls: [
      { x: 1106, y: 300, dir: 1 },
      { x: 404, y: 500, dir: -1 },
      { x: 691, y: 150, dir: 1 },
    ],
  },
};
