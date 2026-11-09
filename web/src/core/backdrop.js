// The title backdrop: a freight train crossing the plains at dusk.
// All silhouettes, drawn with paths — placeholder until there's real art.

import { seeded } from './rng.js';
import { W, H } from './screen.js';

const RAIL_Y = 640;
const TRAIN_SPEED = 55; // px/s, right to left
const CAR_W = 150;
const CAR_GAP = 8;
const CAR_COUNT = 9;
const LOCO_W = 190;
const TRAIN_LEN = LOCO_W + CAR_COUNT * (CAR_W + CAR_GAP);

function ridge(baseY, amp, seed, step = 16) {
  const rand = seeded(seed);
  const waves = [0, 1, 2].map(() => ({ f: 0.002 + rand() * 0.006, p: rand() * 10, a: 0.4 + rand() * 0.6 }));
  const pts = [];
  for (let x = -step; x <= W + step; x += step) {
    let y = 0;
    for (const w of waves) y += Math.sin(x * w.f + w.p) * w.a;
    pts.push([x, baseY - (y / 2) * amp]);
  }
  return pts;
}

export class Backdrop {
  constructor() {
    const rand = seeded(1931);
    this.stars = Array.from({ length: 90 }, () => ({
      x: rand() * W,
      y: rand() * 260,
      r: rand() * 1.3 + 0.3,
      tw: rand() * Math.PI * 2,
    }));
    this.farHills = ridge(520, 70, 7);
    this.nearHills = ridge(585, 40, 12);
    this.trainX = W * 0.35;
    this.smoke = [];
    this.smokeTimer = 0;
    this.t = 0;
    this.grain = makeGrain();
  }

  update(dt) {
    this.t += dt;
    this.trainX -= TRAIN_SPEED * dt;
    if (this.trainX < -TRAIN_LEN - 200) this.trainX = W + 200;

    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0) {
      this.smokeTimer = 0.18;
      this.smoke.push({ x: this.trainX + 34, y: RAIL_Y - 104, r: 8, life: 0 });
    }
    for (const p of this.smoke) {
      p.life += dt;
      p.y -= 22 * dt;
      p.x += 14 * dt; // drifts back over the train as it moves forward
      p.r += 9 * dt;
    }
    this.smoke = this.smoke.filter((p) => p.life < 4.5);
  }

  draw(ctx) {
    // Dusk sky.
    const sky = ctx.createLinearGradient(0, 0, 0, RAIL_Y);
    sky.addColorStop(0, '#1b1626');
    sky.addColorStop(0.45, '#5a2f35');
    sky.addColorStop(0.75, '#b8622f');
    sky.addColorStop(1, '#e9a65a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (const s of this.stars) {
      ctx.globalAlpha = (0.35 + 0.35 * Math.sin(this.t * 1.5 + s.tw)) * (1 - s.y / 300);
      ctx.fillStyle = '#f4e6c8';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Low sun.
    const sunX = 960;
    const sunY = 505;
    const glow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 260);
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.55)');
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f7cf86';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 62, 0, Math.PI * 2);
    ctx.fill();

    fillRidge(ctx, this.farHills, '#6b3b3a');
    fillRidge(ctx, this.nearHills, '#3d2427');

    // Ground.
    ctx.fillStyle = '#1e1416';
    ctx.fillRect(0, RAIL_Y - 30, W, H);

    this.drawPoles(ctx);
    this.drawSmoke(ctx);
    this.drawTrain(ctx, this.trainX);

    // Rails and ties.
    ctx.fillStyle = '#0d0909';
    ctx.fillRect(0, RAIL_Y, W, 6);
    for (let x = 0; x < W; x += 24) ctx.fillRect(x, RAIL_Y + 6, 14, 5);

    // Old-film vignette and grain.
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.06;
    const gx = Math.floor(Math.random() * 64);
    const gy = Math.floor(Math.random() * 64);
    ctx.fillStyle = ctx.createPattern(this.grain, 'repeat');
    ctx.translate(-gx, -gy);
    ctx.fillRect(0, 0, W + 64, H + 64);
    ctx.translate(gx, gy);
    ctx.globalAlpha = 1;
  }

  drawPoles(ctx) {
    ctx.strokeStyle = '#140d0e';
    ctx.fillStyle = '#140d0e';
    ctx.lineWidth = 2;
    const spacing = 260;
    const tops = [];
    for (let x = 60; x < W + spacing; x += spacing) {
      ctx.fillRect(x, RAIL_Y - 170, 5, 145);
      ctx.fillRect(x - 18, RAIL_Y - 162, 41, 4);
      tops.push(x);
    }
    ctx.beginPath();
    for (let i = 0; i < tops.length - 1; i++) {
      for (const dx of [-14, 18]) {
        const a = tops[i] + dx;
        const b = tops[i + 1] + dx;
        ctx.moveTo(a, RAIL_Y - 164);
        ctx.quadraticCurveTo((a + b) / 2, RAIL_Y - 140, b, RAIL_Y - 164);
      }
    }
    ctx.stroke();
  }

  drawSmoke(ctx) {
    for (const p of this.smoke) {
      ctx.globalAlpha = Math.max(0, 0.5 * (1 - p.life / 4.5));
      ctx.fillStyle = '#2a1f22';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawTrain(ctx, x0) {
    const y = RAIL_Y;
    ctx.fillStyle = '#0d0909';

    // Locomotive, facing left.
    const lx = x0;
    ctx.fillRect(lx + 10, y - 70, 120, 50); // boiler
    ctx.beginPath();
    ctx.arc(lx + 12, y - 45, 25, Math.PI / 2, (Math.PI * 3) / 2); // smokebox front
    ctx.fill();
    ctx.fillRect(lx + 26, y - 100, 16, 32); // stack
    ctx.fillRect(lx + 22, y - 104, 24, 7);
    ctx.fillRect(lx + 70, y - 84, 22, 16); // dome
    ctx.fillRect(lx + 125, y - 105, 60, 85); // cab
    ctx.fillRect(lx + 118, y - 110, 74, 8); // cab roof
    ctx.beginPath(); // cowcatcher
    ctx.moveTo(lx - 22, y - 4);
    ctx.lineTo(lx + 8, y - 26);
    ctx.lineTo(lx + 8, y - 4);
    ctx.fill();
    ctx.fillStyle = '#f2b866'; // lit cab window
    ctx.fillRect(lx + 140, y - 95, 22, 20);
    ctx.fillStyle = '#0d0909';
    for (const wx of [40, 80, 120]) wheel(ctx, lx + wx, y - 14, 15);
    wheel(ctx, lx + 165, y - 10, 10);

    // Boxcars.
    let cx = lx + LOCO_W;
    for (let i = 0; i < CAR_COUNT; i++) {
      if (cx > W + 20 || cx + CAR_W < -20) {
        cx += CAR_W + CAR_GAP;
        continue;
      }
      ctx.fillStyle = '#0d0909';
      ctx.fillRect(cx - CAR_GAP, y - 30, CAR_GAP, 4); // coupler
      ctx.fillRect(cx, y - 92, CAR_W, 70);
      ctx.fillRect(cx - 3, y - 96, CAR_W + 6, 6);
      wheel(ctx, cx + 22, y - 10, 10);
      wheel(ctx, cx + 44, y - 10, 10);
      wheel(ctx, cx + CAR_W - 44, y - 10, 10);
      wheel(ctx, cx + CAR_W - 22, y - 10, 10);

      // Every third car rides with its door open, sunset showing through,
      // and the second one has a passenger.
      if (i % 3 === 1) {
        ctx.fillStyle = 'rgba(233, 150, 80, 0.55)';
        ctx.fillRect(cx + 52, y - 80, 46, 50);
        if (i === 4) drawRider(ctx, cx + 72, y - 30);
      }
      cx += CAR_W + CAR_GAP;
    }
  }
}

// Sits on the boxcar floor, knees up, arm resting on a knee, with the
// bindle set down behind him.
function drawRider(ctx, x, floor) {
  ctx.fillStyle = '#0d0909';
  ctx.strokeStyle = '#0d0909';
  ctx.lineCap = 'round';

  ctx.beginPath(); // bindle bundle and its stick, lying on the floor
  ctx.arc(x - 15, floor - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 19, floor - 1);
  ctx.lineTo(x - 6, floor - 1);
  ctx.stroke();

  ctx.fillRect(x - 5, floor - 26, 10, 26); // torso, hips on the floor
  ctx.beginPath();
  ctx.arc(x, floor - 32, 6, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.fillRect(x - 9, floor - 39, 18, 3); // hat brim
  ctx.fillRect(x - 5, floor - 45, 10, 6); // hat crown

  ctx.lineWidth = 6; // legs: thigh up to the knee, shin back down to the floor
  ctx.beginPath();
  ctx.moveTo(x + 2, floor - 4);
  ctx.lineTo(x + 15, floor - 17);
  ctx.lineTo(x + 21, floor - 3);
  ctx.stroke();
  ctx.lineWidth = 4; // arm draped over the knee
  ctx.beginPath();
  ctx.moveTo(x + 2, floor - 21);
  ctx.lineTo(x + 14, floor - 18);
  ctx.lineTo(x + 18, floor - 10);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function wheel(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fillRidge(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], H);
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineTo(pts[pts.length - 1][0], H);
  ctx.closePath();
  ctx.fill();
}

function makeGrain() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
