// Buffalo, 1932: the biggest grain port in the world, its concrete
// elevators lining the harbour and half the lake boats laid up. A brand-new
// railroad terminal (1929) and a brand-new City Hall tower (1931) on a city
// that can't fill either. Steel down the lake at Lackawanna, laying men off.

export default {
  id: 'buffalo',
  name: 'Buffalo',
  at: [894, 278],
  blurb: 'Grain elevators along the harbour and lake boats laid up for want of cargo. A cold wind off the lake.',

  town: {
    width: 2300,
    start: 160,
    sky: 'overcast',
    far: [
      { shape: 'block', x: 60, w: 160, h: 190 },
      { shape: 'tower', x: 250, w: 110, h: 360 }, // the new City Hall
      { shape: 'block', x: 390, w: 170, h: 220 },
      { shape: 'tank', x: 640, w: 90, h: 230 }, // grain elevators along the harbour
      { shape: 'tank', x: 720, w: 90, h: 250 },
      { shape: 'tank', x: 800, w: 90, h: 230 },
      { shape: 'tower', x: 1080, w: 80, h: 300 }, // the railroad's new terminal
      { shape: 'block', x: 1180, w: 200, h: 170 },
      { shape: 'stack', x: 1560, w: 22, h: 220 }, // steel, down the lake
      { shape: 'stack', x: 1600, w: 22, h: 200 },
      { shape: 'block', x: 1640, w: 240, h: 150 },
    ],
    buildings: [
      { x: 0, w: 230, h: 220, wall: '#7a4a3a' },
      { x: 240, w: 310, h: 260, wall: '#b8aa90', sign: 'Central Terminal', place: 'terminal' },
      { x: 560, w: 200, h: 200, wall: '#6e5444' },
      { x: 770, w: 260, h: 170, wall: '#8a7a64', sign: 'Grain Elevators', place: 'elevators', roof: 'gate' },
      { x: 1040, w: 220, h: 200, wall: '#8a4e3c', sign: 'Market', place: 'market', roof: 'false-front' },
      { x: 1270, w: 220, h: 190, wall: '#5e4a3e', sign: 'Lunchroom', place: 'lunchroom' },
      { x: 1500, w: 260, h: 230, wall: '#7a5a4a', sign: 'City Mission', place: 'mission', roof: 'gable' },
      { x: 1770, w: 530, h: 210, wall: '#6e5444' },
    ],
    places: {
      terminal: {
        name: 'Central Terminal',
        kind: 'landmark',
        blurb: 'Opened three years ago, out on the East Side: a tower seventeen stories high and a concourse like a cathedral. Too big for the trains that come now.',
      },
      elevators: {
        name: 'Grain Elevators',
        kind: 'landmark',
        blurb: 'Concrete silos the size of churches along the harbour, where the lake boats unload the prairie’s wheat. Half the boats are laid up this spring.',
      },
      market: {
        name: 'Market',
        kind: 'store',
        blurb: 'The East Side market: rye bread, eggs by the dozen, pickles from the barrel, and grandmothers bargaining in Polish.',
        stock: [
          ['Rye bread, a loaf', '8¢'],
          ['Pickle from the barrel', '1¢'],
          ['Kielbasa, a link', '10¢'],
        ],
      },
      lunchroom: {
        name: 'Lunchroom',
        kind: 'diner',
        blurb: 'Roast beef sliced thin on a salted roll, a dab of horseradish. The town’s own sandwich, and the cheapest hot thing on the street.',
        stock: [
          ['Beef on a salt roll', '15¢'],
          ['Coffee', '5¢'],
        ],
      },
      mission: {
        name: 'City Mission',
        kind: 'mission',
        blurb: 'Soup at noon, a sermon at six, a cot if you’re early. Lake wind rattles the windows all night.',
      },
    },
    npcs: [
      {
        id: 'scooper',
        name: 'Grain Scooper',
        x: 700,
        look: { coat: '#5a5048', pants: '#3a3a3a', hat: 'cap', skin: '#e2b896' },
        lines: [
          'Shoveled grain out of lake boats eighteen years. This spring the boats ain’t coming.',
          'Westbound freights run along the lake shore to Cleveland. Bitter cold riding, this time of year.',
        ],
      },
      {
        id: 'steelman',
        name: 'Steelworker',
        x: 1460,
        look: { coat: '#4a4038', pants: '#2e2a26', hat: 'fedora', skin: '#d0a07a' },
        lines: [
          'The steel plant down the lake laid off half of us at Christmas. The other half work two days a week.',
          'Can’t pay rent on two days. Can’t eat on none.',
        ],
      },
    ],
    lamps: [235, 765, 1265, 1765],
    yardSign: 2200,
  },

  yard: {
    player: 320,
    office: { x: 512, y: 300 }, // the yard office, its board in the window
    tracks: [
      { x: 190, cars: 'BB.GBB' },
      { x: 405, cars: 'B.BBTB' },
      { x: 620, moving: 'EBB', speed: 75, dir: -1, at: 450 },
      { x: 835, cars: 'GB.BB.' },
      { x: 1050, cars: 'BTB.BG' },
    ],
    trains: [{ to: 'cleveland', number: '1477', open: 3, departs: 50 }],
    bulls: [
      { x: 1106, y: 300, dir: 1 },
      { x: 727, y: 520, dir: -1 },
    ],
  },
};
