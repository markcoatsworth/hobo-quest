// Los Angeles: the end of the line. Palms, sunshine, and a city that's not
// sure it wants you.

export default {
  id: 'la',
  name: 'Los Angeles',
  at: [109, 510],
  blurb: 'Palm trees and orange groves at the end of the line.',

  town: {
    width: 2400,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'mountain', x: -100, w: 1200, h: 170 },
      { shape: 'tower', x: 420, w: 100, h: 330 }, // City Hall, tallest in town
      { shape: 'block', x: 560, w: 160, h: 150 },
      { shape: 'mountain', x: 900, w: 1100, h: 200 },
      { shape: 'block', x: 1150, w: 200, h: 130 },
    ],
    buildings: [
      { x: 0, w: 240, h: 180, wall: '#e8d8b8' },
      { x: 250, w: 280, h: 160, wall: '#d8a878', sign: 'Olvera Street', place: 'olvera', roof: 'gate' },
      { x: 540, w: 220, h: 200, wall: '#e0ccaa' },
      { x: 770, w: 240, h: 230, wall: '#c8b090', sign: 'Rescue Mission', place: 'mission' },
      { x: 1020, w: 240, h: 200, wall: '#f0e0c0', sign: 'Studio Gate', place: 'studio', roof: 'gate' },
      { x: 1270, w: 220, h: 170, wall: '#e8a050', sign: 'Orange Juice', place: 'juice', roof: 'false-front' },
      { x: 1500, w: 300, h: 140, wall: '#8ab0c0', sign: 'To the Beach', place: 'pier', roof: 'gate' },
      { x: 1810, w: 590, h: 190, wall: '#e4d0ae' },
    ],
    places: {
      olvera: {
        name: 'Olvera Street',
        kind: 'store',
        blurb: 'The old plaza, made over into a Mexican marketplace two years ago. Candles, pottery and taquitos.',
        stock: [
          ['Taquitos', '5¢'],
          ['Clay jug', '15¢'],
        ],
      },
      mission: {
        name: 'Rescue Mission',
        kind: 'mission',
        blurb: 'Clean sheets, a hot shower, and a long line of men who all came west for the same reason you did.',
      },
      studio: {
        name: 'Studio Gate',
        kind: 'game',
        blurb: 'A casting man picks extras off the curb each morning. Today they want hoboes, of all things.',
        game: 'Movie extra',
      },
      juice: {
        name: 'Orange Juice Stand',
        kind: 'diner',
        blurb: 'Shaped like a giant orange. All you can drink for a dime.',
        stock: [['All you can drink', '10¢']],
      },
      pier: {
        name: 'The Pier',
        kind: 'landmark',
        blurb: 'The Pacific. You can’t ride any further west than this.',
      },
    },
    npcs: [
      {
        id: 'extra',
        name: 'Movie Extra',
        x: 960,
        look: { coat: '#c8b8a0', pants: '#5a5a6a', hat: 'straw', skin: '#ecc8a8' },
        lines: [
          'Three days on a crowd scene, two dollars a day. Practically a star.',
          'Everybody here came from somewhere else. You’ll fit right in.',
        ],
      },
      {
        id: 'picker',
        name: 'Orange Picker',
        x: 1440,
        look: { coat: '#7a8a5a', pants: '#4a4a5a', hat: 'straw', skin: '#b07a52' },
        lines: [
          'The groves hire at dawn and pay by the box. Bring your own ladder.',
          'The Chamber of Commerce says there\u2019s sunshine for everybody. The police chief says otherwise.',
        ],
      },
    ],
    lamps: [200, 700, 1220, 1730, 2200],
  },
};
