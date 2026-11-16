// The family home: a thin farm up the Hudson from the city, where the opening
// cutscene leaves you. The same format as a town (see src/cities/index.js),
// drawn as a dirt lane instead of a street. There's no rail yard out here;
// that's in the city.

export default {
  name: 'The Family Home',
  mapLabel: 'Explore the Family Home',
  width: 2000,
  start: 720,
  sky: 'overcast',
  ground: 'dirt',
  far: [
    // The Palisades across the river, and the mills along it.
    { shape: 'block', x: -60, w: 760, h: 150 },
    { shape: 'block', x: 700, w: 520, h: 140 },
    { shape: 'block', x: 1220, w: 700, h: 156 },
    { shape: 'stack', x: 980, w: 16, h: 230 },
    { shape: 'stack', x: 1010, w: 14, h: 200 },
    { shape: 'tank', x: 1180, w: 70, h: 190 },
  ],
  buildings: [
    { x: 40, w: 220, h: 170, wall: '#7a3a2e', roof: 'gable', place: 'barn', windows: false, shop: false },
    { x: 300, w: 100, h: 70, wall: '#6a5a48', windows: false }, // the empty chicken coop
    { x: 600, w: 240, h: 160, wall: '#8a8378', roof: 'gable', place: 'house', shop: false },
    { x: 1150, w: 200, h: 150, wall: '#9a8a70', roof: 'gable' }, // the neighbours'
    { x: 1560, w: 440, h: 230, wall: '#6e4c3e', sign: 'Riverside Mill', place: 'mill', shop: false },
  ],
  places: {
    house: {
      name: 'The House',
      kind: 'home',
      blurb:
        'Dad’s coat still on its hook. Empty bottles under the sink. Mom’s calendar on the wall, stopped at March of last year. A notice from the bank is nailed to the front door.',
    },
    barn: {
      name: 'The Barn',
      kind: 'home',
      blurb: 'Empty stalls. Dad sold the mule and the plough last fall to keep up with the mortgage. It didn’t keep up.',
    },
    mill: {
      name: 'Riverside Mill',
      kind: 'landmark',
      blurb: 'Where Dad worked eleven years, until they let him go. A chain on the gate and a sign: CLOSED UNTIL FURTHER NOTICE.',
    },
  },
  npcs: [
    {
      id: 'neighbour',
      name: 'Mrs. Vandermeer',
      x: 1080,
      look: { coat: '#5a4a5a', pants: '#3a3036', hat: 'cloche', skin: '#e6c0a0' },
      lines: [
        'Oh, child. I heard about your father. I’m so sorry.',
        'The man from the bank came Thursday and nailed that paper to your door. You can’t stay on here.',
        'If there’s work anywhere, it’s down in the city. Follow the river road south.',
      ],
    },
  ],
  lamps: [],

  draw: {
    // The Hudson in front of the cliffs, with a tug working downriver.
    far(ctx, { camX, W, base, t }) {
      const top = base - 64;
      ctx.fillStyle = '#7d8e93';
      ctx.fillRect(0, top, W, 64);
      ctx.fillStyle = 'rgba(225, 230, 228, 0.35)';
      for (let i = 0; i < 18; i++) {
        const x = ((((i * 337) % 1500) - camX * 0.4 + t * 5) % (W + 100) + W + 100) % (W + 100) - 50;
        ctx.fillRect(x, top + 8 + ((i * 23) % 48), 24 + ((i * 17) % 30), 2);
      }
      const bx = ((((900 - camX * 0.4 - t * 18) % (W + 600)) + W + 600) % (W + 600)) - 300;
      ctx.fillStyle = '#4a4440';
      ctx.fillRect(bx, top + 22, 130, 8);
      ctx.fillStyle = '#3a3634';
      ctx.fillRect(bx + 136, top + 18, 30, 12);
      ctx.fillRect(bx + 144, top + 8, 14, 10);
    },
  },
};
