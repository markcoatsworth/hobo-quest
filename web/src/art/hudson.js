// Shared drawing for the Hudson Valley in 1932: the overcast sky, the river
// under the Palisades, mills, farms, bare trees, the road, the family's house,
// and people side-on. Used by the opening cutscene (src/cutscenes/opening/)
// and by the family home (src/locations/new_york/family_home/), so the last
// shot of one and the first sight of the other match exactly.

import { W, H } from '../core/screen.js';

export const KID = { cap: '#4b4239', capDark: '#3a322b', coat: '#5d5348', coatDark: '#4a4238', pants: '#3d3833', skin: '#c8956d', hair: '#3b2b20' };
export const SKY_TOP = '#8d98a2';
export const SKY_LOW = '#d9d7cb';
export const DUST = '178, 166, 142';

export const wrap = (x, span) => ((x % span) + span) % span;
/** A fixed pseudo-random number in [0, 1) for an integer: the same every frame. */
export const fixed = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// =================================================================== sky

export function drawSky(ctx, horizon, sun) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(1, SKY_LOW);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizon + 1);
  // A weak sun behind the cloud.
  const glow = ctx.createRadialGradient(sun[0], sun[1], 10, sun[0], sun[1], 170);
  glow.addColorStop(0, 'rgba(250, 248, 236, 0.6)');
  glow.addColorStop(1, 'rgba(250, 248, 236, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sun[0] - 170, sun[1] - 170, 340, 340);
  ctx.fillStyle = 'rgba(250, 248, 238, 0.75)';
  ctx.beginPath();
  ctx.arc(sun[0], sun[1], 34, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGround(ctx, horizon) {
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, '#87865f');
  g.addColorStop(1, '#5f5440');
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, W, H - horizon);
}

/** Dust in the air over everything. */
export function drawHaze(ctx, alpha = 0.16) {
  ctx.fillStyle = `rgba(${DUST}, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ========================================================== side-on scenery

export const CLIFF_TOP = 366; // the Palisades, across the river
export const RIVER_TOP = 418;
export const BANK = 462; // the near bank, where the fields begin
export const SIDE_ROAD = 640; // where the car's wheels touch

/**
 * The Hudson: cliffs on the far side, the river with a tug pushing a barge,
 * and a freight on the line along the near bank. shift: how far the
 * country has scrolled.
 */
export function drawRiverValley(ctx, shift, t) {
  // The Palisades: a long wall of rock with a fringe of bare woods on top.
  const cliffShift = wrap(shift * 0.05, 40);
  ctx.fillStyle = '#7b7e74';
  ctx.beginPath();
  ctx.moveTo(0, RIVER_TOP + 2);
  for (let k = -1; k <= W / 40 + 1; k++) {
    const i = k - Math.floor(shift * 0.05 / 40);
    ctx.lineTo(k * 40 + cliffShift, CLIFF_TOP + fixed(i) * 10);
  }
  ctx.lineTo(W, RIVER_TOP + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(150, 152, 140, 0.45)';
  for (let k = -1; k <= W / 22 + 1; k++) {
    const i = k - Math.floor(shift * 0.05 / 22);
    ctx.fillRect(k * 22 + wrap(shift * 0.05, 22), CLIFF_TOP + 14 + fixed(i + 7) * 6, 3 + fixed(i + 3) * 4, 30);
  }
  ctx.fillStyle = '#626a58';
  for (let k = -1; k <= W / 18 + 1; k++) {
    const i = k - Math.floor(shift * 0.05 / 18);
    ctx.beginPath();
    ctx.ellipse(k * 18 + wrap(shift * 0.05, 18), CLIFF_TOP + 2 + fixed(i + 11) * 8, 12, 6 + fixed(i + 5) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // The river.
  const g = ctx.createLinearGradient(0, RIVER_TOP, 0, BANK);
  g.addColorStop(0, '#8a9a9e');
  g.addColorStop(1, '#6d7f84');
  ctx.fillStyle = g;
  ctx.fillRect(0, RIVER_TOP, W, BANK - RIVER_TOP);
  ctx.fillStyle = 'rgba(225, 230, 228, 0.35)';
  for (let i = 0; i < 26; i++) {
    const x = wrap(fixed(i) * 1600 + shift * 0.1 + t * 6, W + 120) - 60;
    ctx.fillRect(x, RIVER_TOP + 6 + fixed(i + 40) * (BANK - RIVER_TOP - 14), 20 + fixed(i + 2) * 40, 2);
  }

  // A tug pushing a barge of gravel downriver.
  const bx = wrap(900 + shift * 0.08 - t * 22, W + 700) - 350;
  const by = RIVER_TOP + 20;
  ctx.fillStyle = '#4a4440';
  ctx.fillRect(bx, by, 150, 9);
  ctx.fillStyle = '#7a7266';
  ctx.beginPath();
  ctx.moveTo(bx + 12, by);
  ctx.lineTo(bx + 40, by - 10);
  ctx.lineTo(bx + 110, by - 10);
  ctx.lineTo(bx + 138, by);
  ctx.fill();
  ctx.fillStyle = '#3a3634';
  ctx.fillRect(bx + 156, by - 4, 34, 13);
  ctx.fillRect(bx + 164, by - 14, 16, 10);
  ctx.fillRect(bx + 172, by - 24, 5, 10);
  drawSmoke(ctx, bx + 174, by - 26, t, 0.5);

  // The railroad along the near bank, and a freight running up it.
  ctx.fillStyle = '#4a4642';
  ctx.fillRect(0, BANK - 3, W, 3);
  const tx = wrap(-600 + shift * 0.12 + t * 48, W + 1700) - 1000;
  drawFreight(ctx, tx, BANK - 3, t);
}

/** A string of small freight cars, engine first, heading right. */
export function drawFreight(ctx, x, rail, t) {
  const cars = ['E', 'T', 'B', 'B', 'G', 'B', 'R', 'B', 'B', 'T', 'B', 'G', 'B', 'B', 'C'];
  cars.forEach((c, i) => {
    const cx = x - i * 40;
    if (cx < -50 || cx > W + 50) return;
    ctx.fillStyle = { E: '#2a2624', T: '#3a3a3a', B: '#6a3a2e', G: '#4e4a44', R: '#b8ae90', C: '#8a3a2e' }[c];
    if (c === 'E') {
      ctx.fillRect(cx, rail - 15, 36, 12);
      ctx.fillRect(cx - 2, rail - 22, 14, 8);
      ctx.fillRect(cx + 26, rail - 21, 4, 7);
      drawSmoke(ctx, cx + 28, rail - 22, t, 0.7);
    } else if (c === 'T') {
      ctx.beginPath();
      ctx.roundRect(cx, rail - 14, 36, 10, 5);
      ctx.fill();
    } else if (c === 'G') {
      ctx.fillRect(cx, rail - 9, 36, 6);
    } else {
      ctx.fillRect(cx, rail - 16, 36, 13);
    }
  });
}

/** A column of smoke from a stack, drifting right and thinning. */
export function drawSmoke(ctx, x, y, t, scale = 1) {
  for (let i = 0; i < 9; i++) {
    const age = wrap(t * 0.35 + i / 9, 1);
    ctx.fillStyle = `rgba(110, 108, 104, ${0.45 * (1 - age)})`;
    ctx.beginPath();
    ctx.arc(x + age * 90 * scale, y - age * 60 * scale, (5 + age * 22) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A mill on the near bank: brick, a sawtooth roof, two stacks, one cold. */
export function drawMill(ctx, x, base, t, smoking = true) {
  ctx.fillStyle = '#7a5a4c';
  ctx.fillRect(x, base - 70, 230, 70);
  ctx.beginPath();
  for (let k = 0; k < 5; k++) {
    ctx.moveTo(x + k * 46, base - 70);
    ctx.lineTo(x + k * 46 + 30, base - 92);
    ctx.lineTo(x + k * 46 + 46, base - 70);
  }
  ctx.fill();
  ctx.fillStyle = '#6a4c40';
  ctx.fillRect(x + 40, base - 170, 16, 100);
  ctx.fillRect(x + 170, base - 150, 14, 80);
  ctx.fillStyle = '#4a3a34';
  for (let k = 0; k < 7; k++) ctx.fillRect(x + 14 + k * 30, base - 52, 14, 18);
  if (smoking) drawSmoke(ctx, x + 48, base - 172, t, 1);
}

export function drawSilo(ctx, x, base) {
  ctx.fillStyle = '#8a7a66';
  ctx.fillRect(x, base - 96, 34, 96);
  ctx.beginPath();
  ctx.arc(x + 17, base - 96, 17, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#7a4a3c';
  ctx.fillRect(x + 34, base - 54, 90, 54);
  ctx.beginPath();
  ctx.moveTo(x + 30, base - 54);
  ctx.lineTo(x + 79, base - 84);
  ctx.lineTo(x + 128, base - 54);
  ctx.fill();
}

/** Ploughed fields between the river and the road. */
export function drawFields(ctx) {
  ctx.strokeStyle = 'rgba(70, 62, 44, 0.22)';
  ctx.lineWidth = 2;
  for (let y = BANK + 14; y < SIDE_ROAD - 60; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export function drawFarm(ctx, x, base) {
  ctx.fillStyle = '#93785b';
  // Abandoned house.
  ctx.fillRect(x, base - 46, 64, 46);
  ctx.beginPath();
  ctx.moveTo(x - 6, base - 46);
  ctx.lineTo(x + 32, base - 72);
  ctx.lineTo(x + 70, base - 46);
  ctx.fill();
  // Barn with a sagging roof.
  ctx.fillRect(x + 100, base - 58, 90, 58);
  ctx.beginPath();
  ctx.moveTo(x + 94, base - 58);
  ctx.lineTo(x + 120, base - 86);
  ctx.lineTo(x + 170, base - 80);
  ctx.lineTo(x + 196, base - 58);
  ctx.fill();
  ctx.fillStyle = '#7d6449';
  ctx.fillRect(x + 22, base - 30, 12, 30);
  ctx.fillRect(x + 130, base - 40, 30, 40);
}

export function drawBareTree(ctx, x, base, size) {
  ctx.strokeStyle = '#5c4838';
  ctx.lineCap = 'round';
  const branch = (bx, by, angle, len, width, depth) => {
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    if (depth > 0) {
      branch(ex, ey, angle - 0.5, len * 0.66, width * 0.62, depth - 1);
      branch(ex, ey, angle + 0.42, len * 0.6, width * 0.6, depth - 1);
    }
  };
  branch(x, base, -Math.PI / 2, 40 * size, 7 * size, 3);
}

/** Fence along the back of the road, some posts leaning, some gone. */
export function drawFence(ctx, shift, y) {
  const span = 72;
  const first = Math.floor(-shift / span) - 1;
  ctx.fillStyle = '#6a5440';
  ctx.strokeStyle = 'rgba(70, 56, 44, 0.8)';
  ctx.lineWidth = 1.2;
  let prev = null;
  for (let i = first; i < first + W / span + 3; i++) {
    const x = i * span + shift;
    if (fixed(i) < 0.12) {
      prev = null;
      continue;
    }
    const lean = (fixed(i + 50) - 0.5) * 0.35;
    const top = [x + Math.sin(lean) * 40, y - 40];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.fillRect(-3, -40, 6, 42);
    ctx.restore();
    if (prev) {
      ctx.beginPath();
      ctx.moveTo(prev[0], prev[1] + 8);
      ctx.quadraticCurveTo((prev[0] + top[0]) / 2, (prev[1] + top[1]) / 2 + 14, top[0], top[1] + 8);
      ctx.moveTo(prev[0], prev[1] + 22);
      ctx.quadraticCurveTo((prev[0] + top[0]) / 2, (prev[1] + top[1]) / 2 + 28, top[0], top[1] + 22);
      ctx.stroke();
    }
    prev = top;
    // A tuft of last year's grass at the post.
    ctx.fillStyle = 'rgba(150, 140, 96, 0.8)';
    ctx.beginPath();
    ctx.ellipse(x + 10, y, 26, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#6a5440';
  }
}

export function drawPoles(ctx, shift, base) {
  const span = 460;
  const first = Math.floor(-shift / span) - 1;
  const tops = [];
  ctx.fillStyle = '#5a4636';
  for (let i = first; i < first + W / span + 3; i++) {
    const x = i * span + shift;
    ctx.fillRect(x - 4, base - 190, 8, 190);
    ctx.fillRect(x - 30, base - 176, 60, 6);
    tops.push(x);
  }
  ctx.strokeStyle = 'rgba(60, 46, 36, 0.7)';
  ctx.lineWidth = 1.2;
  for (let k = 1; k < tops.length; k++) {
    for (const dx of [-24, 24]) {
      ctx.beginPath();
      ctx.moveTo(tops[k - 1] + dx, base - 176);
      ctx.quadraticCurveTo((tops[k - 1] + tops[k]) / 2 + dx, base - 150, tops[k] + dx, base - 176);
      ctx.stroke();
    }
  }
}

export function drawRoad(ctx) {
  ctx.fillStyle = '#a99c80';
  ctx.fillRect(0, SIDE_ROAD - 38, W, 54);
  ctx.fillStyle = 'rgba(100, 88, 66, 0.5)';
  ctx.fillRect(0, SIDE_ROAD - 24, W, 3);
  ctx.fillRect(0, SIDE_ROAD + 4, W, 3);
}

/** A plume of dust kicked up behind a car moving left, at its rear wheel. */
export function drawDustTrail(ctx, x, y, t, strength = 1) {
  for (let i = 0; i < 26; i++) {
    const age = wrap(t * 0.8 + i / 26, 1);
    const px = x + age * 420 + (fixed(i) - 0.5) * 40;
    const py = y - 8 - age * 80 - fixed(i + 9) * 20;
    const r = 12 + age * 52;
    ctx.fillStyle = `rgba(${DUST}, ${0.38 * (1 - age) * strength})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const HOUSE_X = 150;
export const YARD = 600; // ground where the house and the kid stand
/** The family's house, weathered and boarded: its left wall at x, standing on base. */
export function drawHouse(ctx, x = HOUSE_X, base = YARD) {
  // Chimney, roof, walls of grey weathered boards.
  ctx.fillStyle = '#6e5a4a';
  ctx.fillRect(x + 250, base - 270, 26, 70);
  ctx.fillStyle = '#4a4038';
  ctx.beginPath();
  ctx.moveTo(x - 20, base - 170);
  ctx.lineTo(x + 170, base - 280);
  ctx.lineTo(x + 360, base - 170);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SKY_LOW; // sky through missing shingles
  ctx.fillRect(x + 190, base - 246, 18, 8);
  ctx.fillRect(x + 120, base - 226, 14, 7);
  ctx.fillStyle = '#8a8378';
  ctx.fillRect(x, base - 172, 340, 172);
  ctx.strokeStyle = 'rgba(60, 54, 48, 0.45)';
  ctx.lineWidth = 1.5;
  for (let bx = x + 14; bx < x + 340; bx += 14) {
    ctx.beginPath();
    ctx.moveTo(bx, base - 172);
    ctx.lineTo(bx, base);
    ctx.stroke();
  }
  // Boarded-up window, a dark one, the door with a notice nailed to it.
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(x + 36, base - 130, 60, 56);
  ctx.fillRect(x + 236, base - 130, 60, 56);
  ctx.fillStyle = '#7a6a56';
  ctx.save();
  ctx.translate(x + 66, base - 102);
  for (const a of [0.7, -0.7]) {
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-44, -6, 88, 12);
    ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle = '#4e4036';
  ctx.fillRect(x + 140, base - 120, 52, 120);
  ctx.fillStyle = '#e8e0cc';
  ctx.fillRect(x + 154, base - 96, 24, 30);
  // Sagging porch roof on posts, steps.
  ctx.fillStyle = '#5a4c40';
  ctx.beginPath();
  ctx.moveTo(x - 10, base - 150);
  ctx.lineTo(x + 350, base - 142);
  ctx.lineTo(x + 350, base - 134);
  ctx.lineTo(x - 10, base - 140);
  ctx.closePath();
  ctx.fill();
  for (const px of [x, x + 120, x + 330]) ctx.fillRect(px, base - 146, 7, 146);
  ctx.fillStyle = '#6a5a4a';
  ctx.fillRect(x - 10, base - 10, 360, 10);
}

export function drawMailbox(ctx, x) {
  ctx.fillStyle = '#5a4636';
  ctx.fillRect(x - 3, YARD - 64, 6, 64);
  ctx.fillStyle = '#7a7670';
  ctx.beginPath();
  ctx.roundRect(x - 20, YARD - 80, 40, 18, [9, 9, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#5c5852';
  ctx.save();
  ctx.translate(x - 20, YARD - 62);
  ctx.rotate(0.9); // door hanging open
  ctx.fillRect(0, -16, 3, 16);
  ctx.restore();
}

/** The teenager standing side-on, facing left. */
export function drawKidSide(ctx, x, feet, t, { facing = -1, step = 0 } = {}) {
  const walking = step !== 0;
  const swing = Math.sin(step) * 9;
  const breathe = walking ? -Math.abs(Math.sin(step)) * 2 : Math.sin(t * 2) * 0.8;
  ctx.save();
  ctx.translate(x, feet);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(facing < 0 ? 1 : -1, 1); // drawn facing left
  // Legs, worn boots.
  if (walking) {
    ctx.strokeStyle = KID.pants;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-4, -50);
    ctx.lineTo(-4 - swing, -4);
    ctx.moveTo(6, -50);
    ctx.lineTo(6 + swing, -4);
    ctx.stroke();
    ctx.fillStyle = '#241c16';
    ctx.fillRect(-13 - swing, -6, 16, 7);
    ctx.fillRect(-3 + swing, -6, 16, 7);
  } else {
    ctx.fillStyle = KID.pants;
    ctx.fillRect(-9, -50, 9, 48);
    ctx.fillRect(2, -50, 9, 48);
    ctx.fillStyle = '#241c16';
    ctx.fillRect(-15, -6, 16, 7);
    ctx.fillRect(-4, -6, 16, 7);
  }
  // Coat a size too big, hands in pockets.
  ctx.fillStyle = KID.coat;
  ctx.beginPath();
  ctx.roundRect(-17, -112 + breathe, 34, 68, 8);
  ctx.fill();
  ctx.fillStyle = KID.coatDark;
  ctx.fillRect(-14, -78 + breathe, 12, 22);
  ctx.fillRect(-15, -114 + breathe, 22, 10); // collar up
  // Head, hair at the nape, cap with its brim forward.
  ctx.fillStyle = KID.skin;
  ctx.beginPath();
  ctx.arc(-2, -126 + breathe, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KID.hair;
  ctx.beginPath();
  ctx.arc(6, -122 + breathe, 8, -0.4, Math.PI * 0.7);
  ctx.fill();
  ctx.fillStyle = KID.cap;
  ctx.beginPath();
  ctx.ellipse(0, -136 + breathe, 15, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-15, -137 + breathe, 30, 5);
  ctx.fillStyle = KID.capDark;
  ctx.fillRect(-24, -134 + breathe, 12, 3);
  ctx.restore();
}

/**
 * The car pulls up at the house (lead), the kid gets out (beat 'out'),
 * and the car drives off (tail), leaving the kid in the yard.
 */
/** Townspeople and drifters, by index: coat, hat, skin. */
export const PEOPLE = [
  { coat: '#4a4640', hat: 'fedora', hatColor: '#2e2a26', skin: '#d8b08a' },
  { coat: '#5a4a3a', hat: 'cap', hatColor: '#3a3430', skin: '#c8956d' },
  { coat: '#3e4248', hat: 'fedora', hatColor: '#24262a', skin: '#e0b896' },
  { coat: '#62584a', hat: 'cap', hatColor: '#463e36', skin: '#a8724c' },
  { coat: '#4e3e36', hat: 'fedora', hatColor: '#3a2e26', skin: '#d6a57c' },
  { coat: '#56524c', hat: 'cap', hatColor: '#2e2a28', skin: '#8a5a3c' },
];

/**
 * A person side-on, feet at (x, feet). facing 1 = right, -1 = left.
 * sit: sitting with legs over an edge (a boxcar roof or doorway).
 */
export function drawFigure(ctx, x, feet, look, t, { facing = -1, scale = 1, sit = false, phase = 0 } = {}) {
  const b = Math.sin(t * 1.8 + phase) * 0.8;
  ctx.save();
  ctx.translate(x, feet);
  ctx.scale(facing * scale, scale);
  let headY;
  if (sit) {
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(18, -4);
    ctx.lineTo(20 + Math.sin(t * 2 + phase) * 3, 22);
    ctx.stroke();
    ctx.fillStyle = look.coat;
    ctx.beginPath();
    ctx.roundRect(-12, -50 + b, 26, 48, 7);
    ctx.fill();
    headY = -62 + b;
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e2a26';
    ctx.fillRect(-8, -50, 8, 48);
    ctx.fillRect(1, -50, 8, 48);
    ctx.fillStyle = '#1e1a16';
    ctx.fillRect(-9, -5, 13, 6);
    ctx.fillRect(0, -5, 13, 6);
    ctx.fillStyle = look.coat;
    ctx.beginPath();
    ctx.roundRect(-15, -110 + b, 30, 64, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-4, -104 + b, 9, 40); // arm, hand in pocket
    headY = -122 + b;
  }
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(2, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hatColor;
  if (look.hat === 'fedora') {
    ctx.fillRect(-13, headY - 9, 30, 4);
    ctx.fillRect(-7, headY - 19, 18, 11);
  } else if (look.hat === 'cloche') {
    ctx.beginPath();
    ctx.arc(2, headY - 4, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-13, headY - 6, 30, 4);
  } else {
    ctx.beginPath();
    ctx.ellipse(1, headY - 9, 13, 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-12, headY - 10, 26, 4);
    ctx.fillRect(10, headY - 8, 9, 3);
  }
  ctx.restore();
}
