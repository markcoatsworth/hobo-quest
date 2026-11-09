// El Paso: adobe and brick under the Franklin Mountains, the river and
// Mexico across the bridge.

export default {
  id: 'elp',
  name: 'El Paso',
  at: [340, 610],
  blurb: 'A border town at the edge of the desert. Water is worth more than money.',

  town: {
    width: 2100,
    start: 160,
    sky: 'desert',
    far: [
      { shape: 'mountain', x: -100, w: 900, h: 260 },
      { shape: 'mountain', x: 600, w: 700, h: 200 },
      { shape: 'block', x: 300, w: 140, h: 160 },
      { shape: 'tower', x: 480, w: 80, h: 220 },
      { shape: 'mountain', x: 1200, w: 900, h: 170 },
      { shape: 'tank', x: 1000, w: 90, h: 180 },
    ],
    buildings: [
      { x: 0, w: 220, h: 150, wall: '#d4b08a' },
      { x: 230, w: 260, h: 170, wall: '#c8a07a', sign: 'Mercado', place: 'mercado', roof: 'gate' },
      { x: 500, w: 200, h: 160, wall: '#b88a64' },
      { x: 710, w: 230, h: 170, wall: '#e0c8a0', sign: 'Cantina', place: 'cantina' },
      { x: 950, w: 200, h: 180, wall: '#a87a5a', roof: 'false-front' },
      { x: 1160, w: 320, h: 140, wall: '#8a7a6a', sign: 'Bridge to Juárez', place: 'bridge', roof: 'gate' },
      { x: 1490, w: 220, h: 200, wall: '#c8aa84', sign: 'Water Station', place: 'water', roof: 'false-front' },
      { x: 1720, w: 380, h: 160, wall: '#b8946e' },
    ],
    places: {
      mercado: {
        name: 'Mercado',
        kind: 'store',
        blurb: 'Chiles in strings, tortillas off the griddle, serapes and straw hats.',
        stock: [
          ['Tortillas, a dozen', '5¢'],
          ['Sombrero', '20¢'],
          ['Gourd canteen', '10¢'],
        ],
      },
      cantina: {
        name: 'Cantina',
        kind: 'game',
        blurb: 'Cool and dark inside. A card game called monte, and a dealer faster than your eyes.',
        game: 'Three-card monte',
      },
      bridge: {
        name: 'The International Bridge',
        kind: 'landmark',
        blurb: 'Folks cross for cheap whiskey; Prohibition stops at the river. Lately the trucks carry families south who’ve been told to go home.',
      },
      water: {
        name: 'Water Station',
        kind: 'store',
        blurb: 'The railroad’s water tank leaks into a trough. A man with a shotgun guards the tap.',
        stock: [['Fill your canteen', '2¢']],
      },
    },
    npcs: [
      {
        id: 'sectionhand',
        name: 'Section Hand',
        x: 640,
        look: { coat: '#8a7a5a', pants: '#4a4a5a', hat: 'straw', skin: '#a8724c' },
        lines: [
          'I lay track for the railroad, ten hours in the sun for a dollar.',
          'The westbound stops for water outside town. Be in the car before then. The bulls walk the train at the tank.',
        ],
      },
      {
        id: 'prospector',
        name: 'Old Prospector',
        x: 1600,
        look: { coat: '#7a6a5a', pants: '#5a4a3a', hat: 'fedora', skin: '#d0a07a' },
        lines: [
          'Forty years in these mountains. Found enough silver to stay poor.',
          'Phoenix is cooler than here, they say. That’s like saying the stove is cooler than the oven.',
        ],
      },
    ],
    lamps: [250, 750, 1220, 1750],
    yardSign: 2000,
  },

  yard: {
    departs: 45,
    player: 280,
    tracks: [
      { x: 190, cars: 'BB.B.B' },
      { x: 405, cars: 'GBB.BB' },
      { x: 620, moving: 'EBRB', speed: 85, dir: 1, at: 200 },
      { x: 835, cars: 'B.BBRB' },
      { x: 1050, cars: 'BB.BB.' },
    ],
    train: { open: 4 },
    bulls: [
      { x: 1106, y: 300, dir: -1 },
      { x: 512, y: 450, dir: 1 },
    ],
  },
};
