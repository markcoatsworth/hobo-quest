// Kansas City: the rail yard. Part of src/locations/kansas_city/; the format is
// documented in src/locations/index.js.
//
// Its own touches (the yard hooks): the stockyards' cattle pens come right
// up to the west fence, solid to walk and see through, and a stockman's
// tally board on the pen gate says where tonight's cattle are going.

// The pens, in the corner by the west fence (x, y, w, h).
const PENS = { x: 8, y: 482, w: 132, h: 186 };

export default {
  player: 250,
  office: { x: 548, y: 300 }, // the yard office, its board in the window
  tracks: [
    { x: 190, cars: 'RR.RRR' },
    { x: 333, moving: 'ERRR', speed: 70, dir: 1, at: 300 },
    { x: 476 }, // kept clear for a departing freight
    { x: 620, moving: 'EBBB', speed: 95, dir: -1, at: 450 },
    { x: 763, cars: 'TT.BBR' },
    { x: 906 }, // kept clear for a departing freight
    { x: 1050, moving: 'EBBGB', speed: 80, dir: 1, at: 0 },
  ],
  trains: [
    { to: 'los_angeles', number: '3702', open: 4, departs: 50, card: 2 },
    { to: 'dallas', track: 3, number: '1219', open: 5, departs: 75 },
    { to: 'oklahoma_city', track: 6, number: '2864', open: 3, departs: 100, card: 5 },
  ],
  bulls: [
    { x: 1106, y: 300, dir: 1 },
    { x: 404, y: 500, dir: -1 },
    { x: 691, y: 150, dir: 1 },
  ],

  // The pens block the way, and the bulls' view.
  setup(yard) {
    yard.obstacles.push({ ...PENS });
  },

  clues: [
    {
      x: PENS.x + PENS.w + 14,
      y: PENS.y + 40,
      verb: 'Read the tally board',
      title: 'Stockman’s tally board',
      lines: ['Twelve cars of cattle for the Dallas packers,', 'out on track 3 at 10:15.'],
      learn: { track: 3, to: 'dallas' },
    },
  ],

  draw: {
    // Under the cars: the pens, the cattle, the tally board on the gate.
    ground(ctx, yard) {
      const { x, y, w, h } = PENS;
      ctx.save();
      ctx.fillStyle = '#3e3428'; // trampled mud
      ctx.fillRect(x, y, w, h);
      // Cattle, shifting about.
      for (let k = 0; k < 9; k++) {
        const cx = x + 22 + ((k * 47) % (w - 40)) + Math.sin(yard.t * 0.7 + k) * 3;
        const cy = y + 24 + Math.floor(k / 3) * 56 + ((k * 13) % 20);
        ctx.fillStyle = k % 3 === 0 ? '#5a3a2a' : k % 3 === 1 ? '#7a5238' : '#2e2420';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15, 9, (k % 4) * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + Math.cos((k % 4) * 0.4) * 15, cy + Math.sin((k % 4) * 0.4) * 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Rail fence round them, a gate on the east side.
      ctx.strokeStyle = '#8a7256';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
      ctx.fillStyle = '#d8ccb0'; // the tally board
      ctx.fillRect(x + w - 3, y + 30, 8, 20);
      ctx.restore();
    },
  },
};
