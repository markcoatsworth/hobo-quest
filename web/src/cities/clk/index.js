// Clarksdale: a Delta cotton town at dusk, where the highways cross.

export default {
  id: 'clk',
  name: 'Clarksdale',
  at: [688, 553],
  blurb: 'Cotton country. Blues drifting out of the juke joints along the tracks.',

  town: {
    width: 2000,
    start: 160,
    sky: 'dusk',
    far: [
      { shape: 'mountain', x: 0, w: 900, h: 40 },
      { shape: 'tank', x: 200, w: 90, h: 200 }, // water tower
      { shape: 'block', x: 420, w: 260, h: 110 }, // cotton gin
      { shape: 'stack', x: 640, w: 20, h: 170 },
      { shape: 'mountain', x: 800, w: 1000, h: 50 },
      { shape: 'block', x: 1000, w: 200, h: 90 },
    ],
    buildings: [
      { x: 0, w: 220, h: 160, wall: '#8a7a64', roof: 'false-front' },
      { x: 230, w: 260, h: 170, wall: '#9a8a70', sign: 'Cotton Gin', place: 'gin' },
      { x: 500, w: 180, h: 140, wall: '#6a5a4a', roof: 'gable' },
      { x: 690, w: 230, h: 160, wall: '#a49070', sign: 'Dry Goods', place: 'store', roof: 'false-front' },
      { x: 930, w: 200, h: 130, wall: '#5a4a3a', roof: 'gable' },
      { x: 1140, w: 240, h: 150, wall: '#4a3a4a', sign: 'Juke Joint', place: 'juke', roof: 'gable' },
      { x: 1390, w: 280, h: 120, wall: '#6a6040', sign: 'The Crossroads', place: 'crossroads', roof: 'gate' },
      { x: 1680, w: 320, h: 150, wall: '#7a6a54', roof: 'false-front' },
    ],
    places: {
      gin: {
        name: 'Cotton Gin',
        kind: 'landmark',
        blurb: 'Bales stacked to the rafters with nobody to buy them. Cotton at five cents a pound doesn’t pay the seed.',
      },
      store: {
        name: 'Dry Goods',
        kind: 'store',
        blurb: 'The plantation commissary sells on credit. Everyone owes, and the books are kept by the man who sells.',
        stock: [
          ['Sack of cornmeal', '10¢'],
          ['Molasses', '5¢'],
          ['Straw hat', '25¢'],
        ],
      },
      juke: {
        name: 'Juke Joint',
        kind: 'game',
        blurb: 'A guitar played with a bottleneck, a crowd stomping the plank floor. Somebody’s passing a guitar around.',
        game: 'Delta blues',
      },
      crossroads: {
        name: 'The Crossroads',
        kind: 'landmark',
        blurb: 'Two highways cross at the edge of town. They tell stories about what a man might meet here at midnight.',
      },
    },
    npcs: [
      {
        id: 'bluesman',
        name: 'Bluesman',
        x: 1100,
        look: { coat: '#3a3a4a', pants: '#2a2a32', hat: 'fedora', skin: '#5a3a28' },
        lines: [
          'I ride the freights too, town to town, Saturday to Saturday.',
          'Dallas is a long ride. Sleep in the car, not on the roof. The tunnels will take your head.',
        ],
      },
      {
        id: 'cropper',
        name: 'Sharecropper',
        x: 620,
        look: { coat: '#6a6a5a', pants: '#3a4a5a', hat: 'straw', skin: '#7a4e34' },
        lines: [
          'Picked all season. At settling time the man says I owe him.',
          'My boy went to Chicago on the Illinois Central. Says it’s no better up there, just colder.',
        ],
      },
    ],
    lamps: [290, 730, 1330, 1800],
    yardSign: 1900,
  },

  yard: {
    departs: 40,
    player: 400,
    tracks: [
      { x: 190, cars: 'B.BB.B' },
      { x: 477, cars: 'BBB.BB' },
      { x: 763, moving: 'EBB', speed: 60, dir: 1, at: 300 },
      { x: 1050, cars: 'BB.BB.' },
    ],
    train: { open: 4 },
    bulls: [{ x: 1106, y: 250, dir: 1 }],
  },
};
