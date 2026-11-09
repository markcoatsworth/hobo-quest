// Philadelphia: rowhouses and shuttered mills near the river.

export default {
  id: 'phl',
  name: 'Philadelphia',
  at: [978, 350],
  blurb: 'Mills shut, rents due. Men sleep in doorways along the river.',

  town: {
    width: 2200,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'block', x: 40, w: 180, h: 180 },
      { shape: 'tower', x: 260, w: 110, h: 300 }, // City Hall tower
      { shape: 'block', x: 400, w: 160, h: 220 },
      { shape: 'stack', x: 620, w: 26, h: 230 },
      { shape: 'block', x: 680, w: 220, h: 160 },
      { shape: 'tower', x: 940, w: 90, h: 260 },
      { shape: 'block', x: 1060, w: 200, h: 200 },
      { shape: 'stack', x: 1300, w: 26, h: 210 },
      { shape: 'block', x: 1360, w: 220, h: 170 },
    ],
    buildings: [
      { x: 0, w: 180, h: 220, wall: '#8a4a3a' },
      { x: 190, w: 180, h: 220, wall: '#7e4636' },
      { x: 380, w: 300, h: 230, wall: '#9a8a6a', sign: 'Terminal Market', place: 'market' },
      { x: 690, w: 180, h: 220, wall: '#844a3a' },
      { x: 880, w: 240, h: 240, wall: '#7a5a4a', sign: 'Sunday Breakfast', place: 'mission' },
      { x: 1130, w: 180, h: 220, wall: '#8a4e3c' },
      { x: 1320, w: 300, h: 260, wall: '#b09a7a', sign: 'State House', place: 'hall', roof: 'gable' },
      { x: 1630, w: 180, h: 220, wall: '#7a4636' },
      { x: 1820, w: 380, h: 200, wall: '#6a5444' },
    ],
    places: {
      market: {
        name: 'Terminal Market',
        kind: 'store',
        blurb: 'Under the train shed: Dutch farmers, fishmongers, and a pretzel man who gives away the broken ones.',
        stock: [
          ['Soft pretzel', '1¢'],
          ['Scrapple sandwich', '10¢'],
          ['Apples, a sack', '15¢'],
        ],
      },
      mission: {
        name: 'Sunday Breakfast Mission',
        kind: 'mission',
        blurb: 'Hot oatmeal and a bed for the night, if you get in line before dark.',
      },
      hall: {
        name: 'The Old State House',
        kind: 'landmark',
        blurb: 'Where they wrote down that all men are created equal. The guard moves you along if you sit too long.',
      },
    },
    npcs: [
      {
        id: 'weaver',
        name: 'Mill Girl',
        x: 640,
        look: { coat: '#6a4a5a', pants: '#3a2e3a', hat: 'cloche', skin: '#ecc8a8' },
        lines: [
          'The hosiery mill cut us to two days a week, then none.',
          'My brother went south on the freights. Wrote once from Washington.',
        ],
      },
      {
        id: 'cop',
        name: 'Beat Cop',
        x: 1580,
        look: { coat: '#1e2a44', pants: '#1a2236', hat: 'cap', skin: '#e2b896' },
        lines: [
          'Keep moving, pal. No loitering on my beat.',
          'Yard’s down past the market. Not that I told you.',
        ],
      },
    ],
    lamps: [150, 430, 900, 1350, 1750, 2020],
    yardSign: 2100,
  },

  yard: {
    departs: 45,
    player: 330,
    tracks: [
      { x: 190, cars: 'B.BBGB' },
      { x: 405, cars: 'TTB.BB' },
      { x: 620, moving: 'EBB', speed: 65, dir: 1, at: 350 },
      { x: 835, cars: 'BB.RBB' },
      { x: 1050, cars: 'B.BGB.' },
    ],
    train: { open: 3 },
    bulls: [{ x: 1106, y: 200, dir: 1 }],
  },
};
