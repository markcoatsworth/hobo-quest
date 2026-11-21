// Oklahoma City, 1932: oil derricks right in town (the field came in in
// 1928), two new bank towers on the skyline, a brand-new Union Station,
// wheat at a quarter a bushel, and Community Camp, the shack town in the
// river bottoms.

const FAR_PARALLAX = 0.35; // the skyline's parallax, as in src/scenes/area.js

export default {
  id: 'oklahoma_city',
  name: 'Oklahoma City',
  at: [540, 521],
  blurb: 'Oil derricks between the houses and families camped in the river bottoms. Boom and bust on the same street.',

  town: {
    width: 2300,
    start: 160,
    sky: 'haze',
    far: [
      { shape: 'block', x: 120, w: 150, h: 200 },
      { shape: 'tower', x: 300, w: 90, h: 330 }, // the new bank tower, 1931
      { shape: 'tower', x: 470, w: 80, h: 300 }, // and its rival, finished the same year
      { shape: 'block', x: 580, w: 180, h: 230 },
      { shape: 'tank', x: 950, w: 120, h: 170 }, // grain elevator
      { shape: 'block', x: 1120, w: 200, h: 170 },
      { shape: 'block', x: 1700, w: 220, h: 150 },
    ],
    buildings: [
      { x: 0, w: 230, h: 210, wall: '#8a5a44' },
      { x: 240, w: 300, h: 250, wall: '#c8b494', sign: 'Union Station', place: 'station', roof: 'gable' },
      { x: 550, w: 200, h: 190, wall: '#7a6a5a', sign: 'Lunch Counter', place: 'lunch' },
      { x: 760, w: 240, h: 200, wall: '#946c4c', sign: 'Free Employment', place: 'employment' },
      { x: 1010, w: 220, h: 180, wall: '#a88a64', sign: 'Feed & Seed', place: 'feed', roof: 'false-front' },
      { x: 1240, w: 340, h: 120, wall: '#6a6a5a', sign: 'Community Camp', place: 'camp', roof: 'gate' },
      { x: 1590, w: 260, h: 220, wall: '#7e5a46' },
      { x: 1860, w: 440, h: 180, wall: '#8e7056' },
    ],
    places: {
      station: {
        name: 'Union Station',
        kind: 'landmark',
        blurb: 'Brand new last year, Spanish-style, with a tower. Two railroads come in here, and their police walk the platforms looking for men without tickets.',
      },
      lunch: {
        name: 'Lunch Counter',
        kind: 'diner',
        blurb: 'Chili, coffee, and a radio reading out the farm prices. Nobody likes the farm prices.',
        stock: [
          ['Bowl of chili', '10¢'],
          ['Coffee', '5¢'],
          ['Day-old bread', '2¢'],
        ],
      },
      employment: {
        name: 'Free Employment Bureau',
        kind: 'landmark',
        blurb: 'The state’s employment office. A board of jobs, nearly all of them crossed out, and a line out the door anyway.',
      },
      feed: {
        name: 'Feed & Seed',
        kind: 'store',
        blurb: 'Wheat sells for a quarter a bushel and nobody’s buying seed. The owner keeps the lights on with tobacco and matches.',
        stock: [
          ['Tobacco pouch', '10¢'],
          ['Box of matches', '1¢'],
          ['Gunny sack', '3¢'],
        ],
      },
      camp: {
        name: 'Community Camp',
        kind: 'landmark',
        blurb: 'Down in the river bottoms: shacks of tin and packing crates, hundreds of families, a few cook fires. They call it Community Camp. Everybody here came from somewhere else.',
      },
    },
    npcs: [
      {
        id: 'oilman',
        name: 'Oil Field Worker',
        x: 700,
        look: { coat: '#5a4a3a', pants: '#3a3632', hat: 'cap', skin: '#d8a882' },
        lines: [
          'Two springs back a well called the Wild Mary Sudik blew wild for eleven days. Oil rained on houses miles off.',
          'Then the governor called out the Guard and shut the wells. Too much oil, they said, and the price fell to nothing.',
        ],
      },
      {
        id: 'farmer',
        name: 'Wheat Farmer',
        x: 1640,
        look: { coat: '#7a6a52', pants: '#4a4a5a', hat: 'straw', skin: '#c8946a' },
        lines: [
          'Wheat’s a quarter a bushel. Costs more to cut it than it fetches.',
          'My boy rode the freights west to Albuquerque, then on toward California. One card, then nothing.',
        ],
      },
    ],
    lamps: [235, 755, 1235, 1855],
    yardSign: 2200,
    draw: {
      // Oil derricks standing among the buildings, out past the skyline.
      far(ctx, { camX, base }) {
        ctx.save();
        ctx.translate(-camX * FAR_PARALLAX, 0);
        ctx.strokeStyle = '#5e5650';
        ctx.lineWidth = 2;
        for (const [x, h] of [
          [700, 170],
          [800, 150],
          [1360, 190],
          [1470, 160],
          [1580, 175],
          [2000, 150],
        ]) {
          const half = h * 0.16;
          ctx.beginPath();
          ctx.moveTo(x - half, base);
          ctx.lineTo(x, base - h);
          ctx.lineTo(x + half, base);
          for (let k = 1; k < 6; k++) {
            const y = base - (h * k) / 6;
            const w = half * (1 - k / 6);
            ctx.moveTo(x - w, y);
            ctx.lineTo(x + w, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      },
    },
  },

  yard: {
    player: 360,
    office: { x: 727, y: 450 }, // the yard office, its board in the window
    tracks: [
      { x: 190, cars: 'TTB.TT' },
      { x: 405, cars: 'B.BGBB' },
      { x: 620, moving: 'ETTB', speed: 80, dir: 1, at: 150 },
      { x: 835 }, // kept clear for a departing freight
      { x: 1050, cars: 'GB.BBT' },
    ],
    trains: [
      { to: 'dallas', number: '1588', open: 3, departs: 50, card: 5 },
      { to: 'albuquerque', track: 4, number: '3951', open: 4, departs: 80 },
    ],
    bulls: [
      { x: 1106, y: 380, dir: -1 },
      { x: 512, y: 220, dir: 1 },
    ],
  },
};
