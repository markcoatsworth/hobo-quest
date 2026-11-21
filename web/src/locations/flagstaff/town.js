// Flagstaff: the main street. Part of src/locations/flagstaff/; the format is
// documented in src/locations/index.js.

const FAR_PARALLAX = 0.35; // the skyline's parallax, as in src/scenes/area.js
const PEAKS = { x: 160, w: 1000, h: 340 }; // the San Francisco Peaks (a far 'mountain')

export default {
  width: 2100,
  start: 160,
  sky: 'day',
  far: [
    { shape: 'mountain', ...PEAKS },
    { shape: 'mountain', x: 1050, w: 900, h: 200 },
    { shape: 'block', x: 1350, w: 220, h: 150 }, // the mill
    { shape: 'stack', x: 1450, w: 24, h: 230 },
  ],
  buildings: [
    { x: 0, w: 240, h: 200, wall: '#7a5a44' },
    { x: 250, w: 300, h: 210, wall: '#8a6248', sign: 'Hotel', place: 'hotel' },
    { x: 560, w: 200, h: 170, wall: '#a8865e', sign: 'Café', place: 'cafe', roof: 'false-front' },
    { x: 770, w: 230, h: 160, wall: '#9c7a52', sign: 'Trading Post', place: 'trading', roof: 'false-front' },
    { x: 1010, w: 330, h: 200, wall: '#6e5a46', sign: 'Sawmill', place: 'mill', roof: 'gable' },
    { x: 1350, w: 240, h: 120, wall: '#6a6a6a', sign: 'Observatory Road', place: 'observatory', roof: 'gate' },
    { x: 1600, w: 500, h: 180, wall: '#86644a' },
  ],
  places: {
    hotel: {
      name: 'Hotel',
      kind: 'lodging',
      blurb: 'Rooms upstairs, a pot-bellied stove in the lobby, and loggers asleep in the chairs around it.',
      stock: [
        ['Bed for the night', '50¢'],
        ['Chair by the stove', '10¢'],
      ],
    },
    cafe: {
      name: 'Café',
      kind: 'diner',
      blurb: 'Flapjacks, and a pot of coffee going since dawn. It snows up here in April.',
      stock: [
        ['Flapjacks', '10¢'],
        ['Coffee', '5¢'],
      ],
    },
    trading: {
      name: 'Trading Post',
      kind: 'store',
      blurb: 'Blankets and silverwork from the reservation to the north; flour and coffee going the other way.',
      stock: [
        ['Sack of flour', '15¢'],
        ['Wool blanket', '$1.50'],
      ],
    },
    mill: {
      name: 'Sawmill',
      kind: 'game',
      blurb: 'The band saw screams through ponderosa logs. They’re taking on a few men to stack lumber, a dollar a day.',
      game: 'Stacking lumber',
    },
    observatory: {
      name: 'Observatory Road',
      kind: 'landmark',
      blurb: 'A road up the hill to the observatory. Two years ago a farm boy from Kansas working up there found a new planet, out past Neptune. Pluto, they named it.',
    },
  },
  npcs: [
    {
      id: 'logger',
      name: 'Logger',
      x: 700,
      look: { coat: '#8a3a2e', pants: '#3a3a44', hat: 'cap', skin: '#e0b896' },
      lines: [
        'Ponderosa pine as far as you can walk. The mill’s running half shifts now.',
        'Westbound out of here drops two thousand feet to the desert. Hold on tight on the grades.',
      ],
    },
    {
      id: 'stargazer',
      name: 'Observatory Janitor',
      x: 1640,
      look: { coat: '#4a4a5a', pants: '#2e2e36', hat: 'fedora', skin: '#d8b08a' },
      lines: [
        'I sweep the floors up at the observatory. They let me look through the big telescope once.',
        'Saturn, rings and all, plain as a dinner plate. Made me forget I was hungry for a whole minute.',
      ],
    },
  ],
  lamps: [245, 765, 1345, 1595],
  yardSign: 2000,
  draw: {
    // Snow on the peaks, and pines along the foot of the skyline.
    far(ctx, { camX, base }) {
      ctx.save();
      ctx.translate(-camX * FAR_PARALLAX, 0);
      const { x, w, h } = PEAKS;
      // The peaks' outline (the 'mountain' shape), snow above a line.
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + w * 0.3, base - h * 0.8);
      ctx.lineTo(x + w * 0.45, base - h);
      ctx.lineTo(x + w * 0.6, base - h * 0.75);
      ctx.lineTo(x + w * 0.75, base - h * 0.85);
      ctx.lineTo(x + w, base);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#eef0f0';
      ctx.fillRect(x, base - h - 2, w, h * 0.32);
      ctx.restore();
      // Ponderosa pines, dark against everything.
      ctx.fillStyle = '#3e5a3a';
      for (let k = 0; k < 40; k++) {
        const px = -40 + k * 62 + ((k * 37) % 23);
        const ph = 70 + ((k * 53) % 50);
        ctx.beginPath();
        ctx.moveTo(px, base - ph);
        ctx.lineTo(px + ph * 0.22, base);
        ctx.lineTo(px - ph * 0.22, base);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
  },
};
