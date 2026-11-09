// New York: the Bowery at dusk, under the Third Avenue El.

export default {
  id: 'nyc',
  name: 'New York',
  at: [995, 322],
  blurb: 'Shantytowns in the parks and breadlines around the block. Time to head west.',

  town: {
    width: 2600,
    start: 160,
    sky: 'dusk',
    far: [
      { shape: 'block', x: 40, w: 120, h: 200 },
      { shape: 'tower', x: 180, w: 80, h: 300 },
      { shape: 'block', x: 280, w: 150, h: 230 },
      { shape: 'spire', x: 470, w: 70, h: 360 }, // a certain new skyscraper
      { shape: 'block', x: 560, w: 130, h: 250 },
      { shape: 'tower', x: 720, w: 90, h: 280 },
      { shape: 'spire', x: 860, w: 56, h: 320 },
      { shape: 'block', x: 950, w: 160, h: 210 },
      { shape: 'tower', x: 1150, w: 100, h: 290 },
      { shape: 'block', x: 1290, w: 140, h: 240 },
      { shape: 'tower', x: 1470, w: 80, h: 310 },
      { shape: 'block', x: 1580, w: 180, h: 220 },
      { shape: 'tower', x: 1800, w: 90, h: 270 },
      { shape: 'block', x: 1920, w: 150, h: 230 },
    ],
    buildings: [
      { x: 0, w: 220, h: 300, wall: '#6b4a3a' },
      { x: 230, w: 260, h: 250, wall: '#8a5a44', sign: 'Bowery Mission', place: 'mission' },
      { x: 500, w: 200, h: 330, wall: '#5c4a40' },
      { x: 710, w: 250, h: 210, wall: '#d8cfb8', sign: 'AUTOMAT', place: 'automat' },
      { x: 970, w: 180, h: 290, wall: '#704838' },
      { x: 1160, w: 200, h: 190, wall: '#4a5a52', sign: 'Loans & Pawn', place: 'pawn' },
      { x: 1370, w: 220, h: 340, wall: '#6a5446' },
      { x: 1600, w: 150, h: 260, wall: '#3e3632', sign: 'Alley', place: 'dice', roof: 'gate' },
      { x: 1760, w: 300, h: 250, wall: '#4f6a44', sign: 'Central Park', place: 'hooverville', roof: 'gate' },
      { x: 2070, w: 240, h: 270, wall: '#7a5040' },
      { x: 2320, w: 280, h: 230, wall: '#5e4a3c' },
    ],
    places: {
      mission: {
        name: 'Bowery Mission',
        kind: 'mission',
        blurb: 'Soup and a sermon. Sit through the one and you get the other.',
      },
      automat: {
        name: 'The Automat',
        kind: 'diner',
        blurb: 'Drop a nickel, open the little glass door, and dinner is yours. Free hot water and ketchup make tomato soup.',
        stock: [
          ['Cup of coffee', '5¢'],
          ['Slice of pie', '5¢'],
          ['Baked beans', '10¢'],
        ],
      },
      pawn: {
        name: 'Loans & Pawn',
        kind: 'store',
        blurb: 'Wedding rings, pocket watches and army medals behind the glass. The man counts every penny twice.',
        stock: [
          ['Wool blanket', '35¢'],
          ['Pocket knife', '25¢'],
          ['Tin cup', '5¢'],
        ],
      },
      dice: {
        name: 'The Alley',
        kind: 'game',
        blurb: 'A crowd crouched over a game of craps against the brick wall. Somebody is keeping lookout.',
        game: 'Street craps',
      },
      hooverville: {
        name: 'Hooverville',
        kind: 'landmark',
        blurb: 'Shacks of crates and tar paper on the dry reservoir bed. Folks here call it Hoover Valley.',
      },
    },
    npcs: [
      {
        id: 'apples',
        name: 'Apple Seller',
        x: 640,
        look: { coat: '#4a4a52', pants: '#2e2e34', hat: 'fedora', skin: '#e0b896' },
        lines: [
          'Apple, mister? Five cents. I was an accountant two years ago.',
          'Every man on this corner has a crate of apples and a story.',
        ],
      },
      {
        id: 'newsboy',
        name: 'Newsboy',
        x: 1290,
        look: { coat: '#6a5a44', pants: '#3a3a3a', hat: 'cap', skin: '#f0c8a0' },
        lines: [
          'Extra! Extra! More banks shut their doors!',
          'You hoppin’ freights? The bulls at the yard carry clubs. Stay low.',
        ],
      },
      {
        id: 'mae',
        name: 'Boxcar Mae',
        x: 2160,
        look: { coat: '#5a3a3a', pants: '#3a2e2a', hat: 'cloche', skin: '#d8a882' },
        lines: [
          'First time on the road? Keep your shoes on when you sleep.',
          'The yard is just past the end of the street. The westbound freight waits on the far track.',
          'Watch for the lanterns. A bull can’t see through a boxcar, and neither can you.',
        ],
      },
    ],
    lamps: [120, 480, 900, 1180, 1620, 2000, 2380],
    yardSign: 2480,
    draw: {
      // The Third Avenue El runs over the Bowery: steel trestle overhead,
      // a train rattling past every so often.
      street(ctx, { camX, W, t }) {
        const y = 250;
        ctx.fillStyle = '#2a2624';
        ctx.fillRect(0, y, W, 22);
        ctx.fillRect(0, y - 8, W, 4);
        for (let x = -((camX * 1) % 180); x < W + 180; x += 180) {
          ctx.fillRect(x, y + 22, 12, 260);
          ctx.fillRect(x - 10, y + 22, 32, 8);
        }
        const period = 14;
        const k = (t % period) / period;
        if (k < 0.35) {
          const tx = W + 200 - k * (W + 1400) * 2.8;
          ctx.fillStyle = '#3a4a3e';
          for (let c = 0; c < 4; c++) {
            const cx = tx + c * 190;
            ctx.fillRect(cx, y - 70, 180, 62);
            ctx.fillStyle = '#e8c878';
            for (let w = 14; w < 170; w += 26) ctx.fillRect(cx + w, y - 60, 16, 18);
            ctx.fillStyle = '#3a4a3e';
          }
        }
      },
    },
  },

  yard: {
    departs: 50,
    player: 300,
    tracks: [
      { x: 190, cars: 'BB.TBB' },
      { x: 405, moving: 'EBRB', speed: 70, dir: 1, at: 250 },
      { x: 620, cars: 'GB.BBT' },
      { x: 835, cars: 'B.RRB.' },
      { x: 1050, cars: 'TBB.BG' },
    ],
    train: { open: 3 },
    bulls: [{ x: 1106, y: 420, dir: -1 }],
  },
};
