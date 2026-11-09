// Chicago: West Madison Street, "Hobohemia", where the men of the road
// gather between rides.

export default {
  id: 'chi',
  name: 'Chicago',
  at: [729, 331],
  blurb: 'Every railroad in the country meets here. More yards, more trains, and more bulls.',

  town: {
    width: 2800,
    start: 160,
    sky: 'dusk',
    far: [
      { shape: 'block', x: 30, w: 160, h: 220 },
      { shape: 'tower', x: 220, w: 100, h: 320 },
      { shape: 'block', x: 340, w: 140, h: 260 },
      { shape: 'tower', x: 520, w: 120, h: 300 },
      { shape: 'block', x: 660, w: 200, h: 240 },
      { shape: 'tank', x: 900, w: 110, h: 160 },
      { shape: 'block', x: 1040, w: 180, h: 210 },
      { shape: 'tower', x: 1260, w: 90, h: 340 },
      { shape: 'block', x: 1380, w: 160, h: 250 },
      { shape: 'stack', x: 1600, w: 28, h: 250 },
      { shape: 'block', x: 1660, w: 220, h: 200 },
      { shape: 'tower', x: 1920, w: 110, h: 290 },
      { shape: 'block', x: 2060, w: 160, h: 230 },
    ],
    buildings: [
      { x: 0, w: 230, h: 260, wall: '#6a4e40' },
      { x: 240, w: 260, h: 230, wall: '#8a6a50', sign: 'Hobo College', place: 'college' },
      { x: 510, w: 200, h: 300, wall: '#5a4a42' },
      { x: 720, w: 230, h: 200, wall: '#7e5a44', sign: 'Rooms · Beds 10¢', place: 'flop' },
      { x: 960, w: 200, h: 280, wall: '#625046' },
      { x: 1170, w: 320, h: 160, wall: '#7a6a52', sign: 'Maxwell Street', place: 'market', roof: 'gate' },
      { x: 1500, w: 210, h: 260, wall: '#584640' },
      { x: 1720, w: 220, h: 200, wall: '#3e5a3a', sign: 'Bughouse Square', place: 'square', roof: 'gate' },
      { x: 1950, w: 240, h: 230, wall: '#8a7458', sign: 'Day Labor', place: 'jobs', roof: 'false-front' },
      { x: 2200, w: 280, h: 280, wall: '#5a4840' },
      { x: 2490, w: 310, h: 220, wall: '#6a5444' },
    ],
    places: {
      college: {
        name: 'Hobo College',
        kind: 'landmark',
        blurb: 'Lectures on economics, poetry and the law, free to any man of the road. Tonight: "The Rights of the Migratory Worker."',
      },
      flop: {
        name: 'Workingman’s Hotel',
        kind: 'lodging',
        blurb: 'A cage of chicken wire, a cot, and a hook for your coat. Ten cents a night.',
      },
      market: {
        name: 'Maxwell Street Market',
        kind: 'store',
        blurb: 'Pushcarts end to end. You can buy anything here, and some of it was yours last week.',
        stock: [
          ['Secondhand boots', '50¢'],
          ['Hot dog, everything on it', '5¢'],
          ['Wool socks', '10¢'],
        ],
      },
      square: {
        name: 'Bughouse Square',
        kind: 'game',
        blurb: 'Soapbox speakers holding forth on anything at all. Win the crowd and they pass the hat.',
        game: 'Soapbox debate',
      },
      jobs: {
        name: 'Employment Agency',
        kind: 'landmark',
        blurb: 'Chalkboards of day labor at the curb: ice harvest, track gangs, harvest hands out west. Fee in advance.',
      },
    },
    npcs: [
      {
        id: 'orator',
        name: 'Soapboxer',
        x: 1960,
        look: { coat: '#2e2e3a', pants: '#26262e', hat: 'bowler', skin: '#e6c0a0' },
        lines: [
          'Friends! They call us bums, but who laid the rails these freights run on?',
          'Hobo, tramp, bum: the hobo travels to work, the tramp travels to dream, the bum stays put.',
        ],
      },
      {
        id: 'brakie',
        name: 'Old Brakeman',
        x: 760,
        look: { coat: '#2a3a52', pants: '#22283a', hat: 'cap', skin: '#d8a882' },
        lines: [
          'Thirty years riding the tops. Now they ride me out of the yard.',
          'Westbound for Kansas City makes up on the far track. The yard bull walks that aisle like he owns it.',
        ],
      },
    ],
    lamps: [150, 560, 960, 1420, 1730, 2160, 2560],
    yardSign: 2690,
  },

  yard: {
    departs: 55,
    player: 360,
    tracks: [
      { x: 190, cars: 'BB.BRB' },
      { x: 333, cars: 'RR.RRB' },
      { x: 476, moving: 'EBBRB', speed: 90, dir: 1, at: 100 },
      { x: 620, cars: 'B.TBB.' },
      { x: 763, cars: 'GBB.BB' },
      { x: 906, moving: 'ETTB', speed: 75, dir: -1, at: 600 },
      { x: 1050, cars: 'BRB.BB' },
    ],
    train: { open: 3 },
    bulls: [
      { x: 1106, y: 500, dir: -1 },
      { x: 548, y: 200, dir: 1 },
      { x: 834, y: 450, dir: -1 },
    ],
  },
};
