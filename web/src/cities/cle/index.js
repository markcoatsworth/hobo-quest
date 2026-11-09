// Cleveland: the Flats, under a haze from the mills that are still running.

export default {
  id: 'cle',
  name: 'Cleveland',
  at: [847, 326],
  blurb: 'Half the steel mills are banked and cold. The ones still running hire nobody.',

  town: {
    width: 2300,
    start: 160,
    sky: 'haze',
    far: [
      { shape: 'stack', x: 60, w: 26, h: 260 },
      { shape: 'stack', x: 110, w: 26, h: 230 },
      { shape: 'block', x: 150, w: 260, h: 140 },
      { shape: 'tank', x: 450, w: 120, h: 150 },
      { shape: 'tower', x: 640, w: 110, h: 330 }, // the big terminal tower downtown
      { shape: 'block', x: 770, w: 150, h: 190 },
      { shape: 'stack', x: 980, w: 30, h: 280 },
      { shape: 'stack', x: 1030, w: 30, h: 280 },
      { shape: 'stack', x: 1080, w: 30, h: 280 },
      { shape: 'block', x: 960, w: 220, h: 160 },
      { shape: 'tank', x: 1260, w: 140, h: 170 },
      { shape: 'block', x: 1440, w: 180, h: 150 },
      { shape: 'stack', x: 1660, w: 26, h: 240 },
    ],
    buildings: [
      { x: 0, w: 260, h: 230, wall: '#5a4a44' },
      { x: 270, w: 280, h: 200, wall: '#6a3a30', sign: 'Steel Works Gate', place: 'mill', roof: 'gate' },
      { x: 560, w: 200, h: 260, wall: '#7a6658' },
      { x: 770, w: 220, h: 190, wall: '#8a7a64', sign: 'Union Hall', place: 'union' },
      { x: 1000, w: 200, h: 240, wall: '#5e524a' },
      { x: 1210, w: 230, h: 180, wall: '#a49070', sign: 'Lunch · Eats', place: 'lunch', roof: 'false-front' },
      { x: 1450, w: 220, h: 280, wall: '#6a5a50', sign: 'Rooms 15¢', place: 'flop' },
      { x: 1680, w: 260, h: 220, wall: '#584840' },
      { x: 1950, w: 350, h: 200, wall: '#4e443e' },
    ],
    places: {
      mill: {
        name: 'Steel Works Gate',
        kind: 'landmark',
        blurb: 'A hundred men at the gate every morning. The foreman picks three, if he picks any.',
      },
      union: {
        name: 'Union Hall',
        kind: 'landmark',
        blurb: 'Coffee in the urn, a meeting every night, and talk of a strike if the mills ever open again.',
      },
      lunch: {
        name: 'Lunch Counter',
        kind: 'diner',
        blurb: 'Mill men nurse coffee for an hour. The cook lets you sweep up for a plate of hash.',
        stock: [
          ['Coffee and a sinker', '5¢'],
          ['Corned beef hash', '15¢'],
        ],
      },
      flop: {
        name: 'Flophouse',
        kind: 'lodging',
        blurb: 'A cot in a room of forty for fifteen cents. Sleep with your boots under your head.',
      },
    },
    npcs: [
      {
        id: 'steelman',
        name: 'Laid-off Steelworker',
        x: 520,
        look: { coat: '#3e3a36', pants: '#2a2a2e', hat: 'cap', skin: '#e2b896' },
        lines: [
          'Twelve years on the open hearth. Now I stand at that gate like everybody else.',
          'Chicago is where the jobs went, they say. Chicago says the same about here.',
        ],
      },
      {
        id: 'organizer',
        name: 'Union Organizer',
        x: 1160,
        look: { coat: '#5a3a30', pants: '#2e2a28', hat: 'fedora', skin: '#d8ae8a' },
        lines: [
          'A man alone gets nothing. A hall full of men gets heard.',
          'Riding west? The bulls on the Chicago line are the worst. Mind yourself.',
        ],
      },
    ],
    lamps: [200, 600, 1000, 1410, 1800, 2120],
    yardSign: 2200,
  },

  yard: {
    departs: 50,
    player: 420,
    tracks: [
      { x: 190, cars: 'GGG.GG' },
      { x: 362, moving: 'EGGG', speed: 85, dir: -1, at: 500 },
      { x: 534, cars: 'BB.BTB' },
      { x: 706, cars: 'T.TTB.' },
      { x: 878, moving: 'EBB', speed: 60, dir: 1, at: 150 },
      { x: 1050, cars: 'GB.BBG' },
    ],
    train: { open: 4 },
    bulls: [
      { x: 1106, y: 250, dir: 1 },
      { x: 620, y: 520, dir: -1 },
    ],
  },
};
