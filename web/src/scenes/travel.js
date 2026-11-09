// Riding a freight between stops, seen side-on: the train heads west (left)
// while the country scrolls past, days and nights go by, and a status panel
// keeps the date, weather and miles. Hold confirm to hurry the trip along.

import { formatDate } from '../core/calendar.js';
import { Menu } from '../core/menu.js';
import { drawPrompts } from '../core/prompts.js';
import { hashString, seeded } from '../core/rng.js';
import { saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { CITIES, ROUTES, legDays, legMiles, milesTo, sceneryAt } from '../data/routes.js';
import { MapScene } from './map.js';
import { panel, TitleScene } from './title.js';

const VIEW_H = 450; // scenery above, status panel below
const HORIZON = 285;
const RAIL_Y = 392;

const SECONDS_PER_DAY = 3.2;
const HURRY = 5; // speed-up while confirm is held
const SCROLL = 300; // ground px per second of trip time (at normal speed)
const START_TOD = 0.9; // you board at night
const LOOK = 0.5; // parallax used to place region changes on the far hills and ground

const TRAIN_X = 170; // locomotive's front

// Region looks: far ridge style, colours, and what stands in the middle distance.
const REGIONS = {
  river: { far: '#7d9a86', farStyle: 'rolling', ground: '#6f8a4a', mid: ['tree', 'tree', 'pine', 'barn', 'steeple'], water: true },
  hills: { far: '#6f8f6a', farStyle: 'rolling', ground: '#6c8a45', mid: ['tree', 'tree', 'pine', 'barn', 'fence'] },
  mountains: { far: '#4f6a6c', farStyle: 'ridges', ground: '#5c7a40', mid: ['pine', 'pine', 'pine', 'tree', 'cabin'] },
  mill: { far: '#7b7570', farStyle: 'skyline', ground: '#5f5a4a', mid: ['factory', 'tank', 'factory', 'house', 'tree'] },
  prairie: { far: '#b9ab73', farStyle: 'flat', ground: '#bfa05a', mid: ['elevator', 'farm', 'windmill', 'hay', 'hay'] },
  cotton: { far: '#5f7a4e', farStyle: 'treeline', ground: '#8f8a50', mid: ['cotton', 'cotton', 'shack', 'oak', 'cotton'] },
  desert: { far: '#c58a5c', farStyle: 'mesas', ground: '#d4ad7c', mid: ['saguaro', 'rock', 'saguaro', 'scrub', 'scrub'] },
  groves: { far: '#8a8f9a', farStyle: 'ridges', ground: '#a7a067', mid: ['orange', 'orange', 'palm', 'orange', 'house'] },
};
const REGION_NAMES = Object.keys(REGIONS);

// Sky colours through the day (0 = dawn): [time, top, horizon].
const SKY = [
  [0.0, '#46426e', '#f0a46c'],
  [0.12, '#6f9bcf', '#d9e8ee'],
  [0.7, '#6a96cc', '#e1e7dc'],
  [0.82, '#4a3b63', '#ec8a52'],
  [0.9, '#121630', '#2c2e4c'],
  [1.0, '#46426e', '#f0a46c'],
];
// How dark the land is: [time, darkness 0–1].
const DARK = [
  [0.0, 0.3],
  [0.1, 0],
  [0.74, 0],
  [0.84, 0.35],
  [0.9, 0.62],
  [0.97, 0.55],
  [1.0, 0.3],
];

export class TravelScene {
  constructor(game, journey) {
    this.game = game;
    this.journey = journey;
    const stops = ROUTES[journey.route].stops;
    this.from = stops[journey.stop];
    this.to = stops[journey.stop + 1];
    this.days = legDays(this.from, this.to);
    this.miles = legMiles(this.from, this.to);
    this.milesBefore = milesTo(journey.route, journey.stop);
    this.routeMiles = milesTo(journey.route, stops.length - 1);
    this.startDay = journey.day;
    this.seed = hashString(`${this.from}-${this.to}`);

    this.duration = this.days * SECONDS_PER_DAY;
    this.length = this.duration * SCROLL; // ground px for the whole leg
    this.elapsed = 0; // trip seconds
    this.t = 0; // real seconds, for animation
    this.smoke = [];
    this.smokeTimer = 0;
    this.paused = null;
    this.arrived = false;

    // Aboard: a Continue from here picks the ride back up.
    journey.riding = true;
    saveJourney(journey);
  }

  get progress() {
    return Math.min(1, this.elapsed / this.duration);
  }

  /** Time of day, 0 = dawn. */
  get tod() {
    return (START_TOD + this.progress * this.days) % 1;
  }

  /** Journey day number right now. */
  get day() {
    return this.startDay + Math.floor(START_TOD + this.progress * this.days);
  }

  /** Ground scrolled so far, in px. */
  get s() {
    return this.progress * this.length;
  }

  update(dt, input, pointer) {
    this.t += dt;

    if (this.paused) {
      if (input.pressed('pause') || input.pressed('back')) this.paused = null;
      const choice = this.paused?.update(dt, input, pointer);
      if (choice === 'resume') this.paused = null;
      else if (choice === 'title') this.game.setScene(new TitleScene(this.game));
      return;
    }
    if (input.pressed('pause')) {
      this.paused = new Menu(
        [
          { id: 'resume', label: 'Keep Riding' },
          { id: 'title', label: 'Quit to Title' },
        ],
        { x: W / 2, y: 330, rowH: 54, width: 320, fontSize: 28 },
      );
      return;
    }

    this.hurrying = input.down('confirm');
    const rate = this.hurrying ? HURRY : 1;
    this.elapsed += dt * rate;

    // Smoke from the stack drifts back over the train.
    this.smokeTimer -= dt * rate;
    if (this.smokeTimer <= 0) {
      this.smokeTimer = 0.09;
      this.smoke.push({ x: TRAIN_X + 34, y: RAIL_Y - 96, r: 7, life: 0 });
    }
    for (const p of this.smoke) {
      p.life += dt;
      p.x += (110 * rate + 20) * dt;
      p.y -= 26 * dt;
      p.r += 10 * dt;
    }
    this.smoke = this.smoke.filter((p) => p.life < 3 && p.x < W + 60);

    if (this.progress >= 1 && !this.arrived) {
      this.arrived = true;
      const j = this.journey;
      j.day = this.startDay + this.days;
      j.stop += 1;
      j.riding = false;
      this.game.setScene(new MapScene(this.game, j));
    }
  }

  // ------------------------------------------------------------- region

  /** Region whose stretch of the leg is at the train when the ground has scrolled s px. */
  regionAtS(s) {
    return sceneryAt(this.from, this.to, Math.max(0, Math.min(1, s / this.length)));
  }

  /**
   * A thing at screen x on a layer with parallax p reaches the train when the
   * ground has scrolled this far. Lets each layer change region as the train
   * gets there, so the country changes ahead of you, not all at once.
   * Things on the mid layers keep their region as they scroll past; the far
   * hills and the ground pass LOOK (a fixed parallax) so they don't change
   * region miles before the train does.
   */
  sAtTrain(x, p) {
    return this.s + (TRAIN_X + 300 - x) / p;
  }

  /** Blend weights of each region around ground position s. */
  weightsAt(s) {
    const w = {};
    const spread = 260;
    for (let k = -2; k <= 2; k++) {
      const r = this.regionAtS(s + k * spread);
      w[r] = (w[r] || 0) + 0.2;
    }
    return w;
  }

  weather(day) {
    const r = seeded(hashString(`${this.journey.route}:${day}`))();
    const dry = this.regionAtS(this.s) === 'desert';
    if (dry) return r < 0.85 ? 'Hot and dry' : 'Cloudy';
    return r < 0.55 ? 'Clear' : r < 0.82 ? 'Cloudy' : 'Rain';
  }

  // --------------------------------------------------------------- draw

  draw(ctx) {
    const tod = this.tod;
    const dark = curve(DARK, tod);
    const weather = this.weather(this.day);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, VIEW_H);
    ctx.clip();

    this.drawSky(ctx, tod, weather);
    this.drawFar(ctx);
    this.drawGround(ctx);
    this.drawRiver(ctx);
    this.drawMid(ctx);
    this.drawPoles(ctx);
    this.drawRails(ctx);
    if (dark > 0) {
      // Darken the land, fading out above the tallest hills so the sky
      // (which has its own night colours) shows no edge.
      const g = ctx.createLinearGradient(0, HORIZON - 170, 0, HORIZON - 60);
      g.addColorStop(0, 'rgba(12, 14, 38, 0)');
      g.addColorStop(1, `rgba(12, 14, 38, ${dark})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, HORIZON - 170, W, VIEW_H);
    }
    this.drawSmoke(ctx, dark);
    this.drawTrain(ctx, dark);
    this.drawForeground(ctx, dark);
    if (weather === 'Rain') this.drawRain(ctx);
    ctx.restore();

    this.drawPanel(ctx, weather);
    if (this.paused) this.drawPause(ctx);
  }

  drawSky(ctx, tod, weather) {
    const [top, bottom] = skyAt(tod);
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, weather === 'Rain' ? mix(top, '#5a5f6a', 0.6) : weather === 'Cloudy' ? mix(top, '#8a9098', 0.35) : top);
    g.addColorStop(1, weather === 'Rain' ? mix(bottom, '#8a8f96', 0.6) : bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HORIZON + 40);

    // Stars and moon at night; the sun by day. West is left, so the sun
    // rises behind the train (right) and sets ahead of it.
    const night = curve(DARK, tod);
    if (night > 0.3 && weather !== 'Rain') {
      const r = seeded(7);
      ctx.fillStyle = '#f4ecd6';
      for (let i = 0; i < 70; i++) {
        ctx.globalAlpha = (night - 0.3) * 2 * (0.5 + 0.5 * Math.sin(this.t * 2 + i));
        ctx.fillRect(r() * W, r() * (HORIZON - 60), 2, 2);
      }
      ctx.globalAlpha = 1;
      const mx = W * 0.72;
      ctx.fillStyle = '#efe6c8';
      ctx.beginPath();
      ctx.arc(mx, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.arc(mx + 9, 74, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    if (tod < 0.86 && weather !== 'Rain') {
      const k = tod / 0.86;
      const sx = W - k * W;
      const sy = HORIZON - Math.sin(Math.PI * k) * 230;
      const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
      glow.addColorStop(0, 'rgba(255, 236, 180, 0.6)');
      glow.addColorStop(1, 'rgba(255, 236, 180, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 120, sy - 120, 240, 240);
      ctx.fillStyle = '#fff1c4';
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clouds, more of them in bad weather.
    const count = weather === 'Clear' || weather === 'Hot and dry' ? 4 : weather === 'Cloudy' ? 9 : 14;
    const r = seeded(this.seed + this.day);
    const shade = weather === 'Rain' ? '#7d828a' : '#f3efe6';
    for (let i = 0; i < count; i++) {
      const span = W + 400;
      const x = ((r() * span + this.s * 0.04 + this.t * 6) % span) - 200;
      const y = 40 + r() * 140;
      const sz = 30 + r() * 40;
      ctx.globalAlpha = weather === 'Rain' ? 0.9 : 0.75;
      ctx.fillStyle = shade;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(x + k * sz * 0.6, y + (k % 2) * 6, sz * 0.7, sz * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawFar(ctx) {
    const p = 0.08;
    const step = 8;
    // Colour: blend of the regions in view.
    const weights = this.weightsAt(this.sAtTrain(W / 2, LOOK));
    let color = '#000000';
    let first = true;
    let acc = 0;
    for (const [r, w] of Object.entries(weights)) {
      acc += w;
      color = first ? REGIONS[r].far : mix(color, REGIONS[r].far, w / acc);
      first = false;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, HORIZON + 10);
    for (let x = 0; x <= W + step; x += step) {
      const u = x - this.s * p; // world coordinate on this layer
      const w = this.weightsAt(this.sAtTrain(x, LOOK));
      let h = 0;
      for (const [r, k] of Object.entries(w)) h += k * ridgeHeight(REGIONS[r].farStyle, u);
      ctx.lineTo(x, HORIZON - h);
    }
    ctx.lineTo(W, HORIZON + 10);
    ctx.closePath();
    ctx.fill();
  }

  drawRiver(ctx) {
    // A river along the valley floor where there is one.
    const wr = this.weightsAt(this.sAtTrain(W / 2, LOOK)).river || 0;
    if (wr > 0) {
      ctx.globalAlpha = wr;
      ctx.fillStyle = '#7fa6b8';
      ctx.fillRect(0, HORIZON + 4, W, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = (this.s * 0.2) % 60; x < W; x += 60) ctx.fillRect(x, HORIZON + 9, 18, 2);
      ctx.globalAlpha = 1;
    }
  }

  drawGround(ctx) {
    // Column by column, so one region's earth gives way to the next.
    const col = 32;
    for (let x = 0; x < W; x += col) {
      const w = this.weightsAt(this.sAtTrain(x, LOOK));
      let c = null;
      let acc = 0;
      for (const [r, k] of Object.entries(w)) {
        acc += k;
        c = c ? mix(c, REGIONS[r].ground, k / acc) : REGIONS[r].ground;
      }
      ctx.fillStyle = c;
      ctx.fillRect(x, HORIZON, col + 1, VIEW_H);
    }
    // Haze where the land meets the sky.
    const g = ctx.createLinearGradient(0, HORIZON, 0, HORIZON + 50);
    g.addColorStop(0, 'rgba(230, 225, 210, 0.35)');
    g.addColorStop(1, 'rgba(230, 225, 210, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON, W, 50);
  }

  drawMid(ctx) {
    // Two rows of things standing in the fields, further and nearer.
    for (const [p, baseY, scale, slot] of [
      [0.32, HORIZON + 30, 0.7, 120],
      [0.55, HORIZON + 62, 1, 170],
    ]) {
      const offset = this.s * p;
      const k0 = Math.floor((-offset - 200) / slot);
      const k1 = Math.ceil((W - offset + 200) / slot);
      for (let k = k0; k <= k1; k++) {
        const r = seeded(this.seed + k * 7919 + Math.round(p * 100));
        if (r() < 0.35) continue; // open country
        const x = k * slot + offset + r() * slot * 0.6;
        const region = this.regionAtS(this.sAtTrain(x, p));
        const kinds = REGIONS[region].mid;
        const kind = kinds[Math.floor(r() * kinds.length)];
        drawThing(ctx, kind, x, baseY + r() * 8, scale, r, this.t);
      }
    }
  }

  drawPoles(ctx) {
    const p = 0.8;
    const spacing = 260;
    const offset = (this.s * p) % spacing;
    const tops = [];
    ctx.fillStyle = '#3b2c22';
    for (let x = offset - spacing; x < W + spacing; x += spacing) {
      ctx.fillRect(x, RAIL_Y - 150, 5, 130);
      ctx.fillRect(x - 14, RAIL_Y - 142, 33, 4);
      tops.push(x);
    }
    ctx.strokeStyle = 'rgba(40, 30, 24, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < tops.length - 1; i++) {
      for (const dx of [-10, 14]) {
        ctx.moveTo(tops[i] + dx, RAIL_Y - 144);
        ctx.quadraticCurveTo((tops[i] + tops[i + 1]) / 2 + dx, RAIL_Y - 124, tops[i + 1] + dx, RAIL_Y - 144);
      }
    }
    ctx.stroke();
  }

  drawRails(ctx) {
    ctx.fillStyle = '#6d6052'; // ballast
    ctx.fillRect(0, RAIL_Y - 2, W, 18);
    ctx.fillStyle = '#3a2a1f'; // ties
    const off = this.s % 22;
    for (let x = off - 22; x < W; x += 22) ctx.fillRect(x, RAIL_Y + 2, 12, 6);
    ctx.fillStyle = '#9a948c'; // rail
    ctx.fillRect(0, RAIL_Y, W, 3);
  }

  drawForeground(ctx, dark) {
    // Weeds whipping past in front of the track.
    const p = 1.4;
    const slot = 46;
    const offset = this.s * p;
    const k0 = Math.floor((-offset - 50) / slot);
    const k1 = Math.ceil((W - offset + 50) / slot);
    const region = this.regionAtS(this.s);
    const color = region === 'desert' ? '#a07a4e' : region === 'prairie' ? '#a8873e' : '#4f6a34';
    ctx.fillStyle = mix(color, '#0c0e26', dark);
    for (let k = k0; k <= k1; k++) {
      const r = seeded(k * 31 + 5);
      if (r() < 0.4) continue;
      const x = k * slot + offset;
      const h = 8 + r() * 18;
      ctx.beginPath();
      ctx.moveTo(x - 6, VIEW_H);
      ctx.lineTo(x - 2, VIEW_H - h);
      ctx.lineTo(x + 2, VIEW_H - h * 0.6);
      ctx.lineTo(x + 5, VIEW_H - h * 0.9);
      ctx.lineTo(x + 8, VIEW_H);
      ctx.fill();
    }
    ctx.fillStyle = mix('#3e3226', '#0c0e26', dark * 0.6);
    ctx.fillRect(0, VIEW_H - 22, W, 22);
  }

  drawSmoke(ctx, dark) {
    for (const p of this.smoke) {
      ctx.globalAlpha = Math.max(0, 0.55 * (1 - p.life / 3));
      ctx.fillStyle = mix('#5c5754', '#1a1a24', dark);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawTrain(ctx, dark) {
    const y = RAIL_Y;
    const wheelTurn = (this.s / 14) % (Math.PI * 2);
    const bob = (i) => Math.sin(this.t * 9 + i * 1.7) * 0.8;

    // Night: headlamp beam ahead (left).
    if (dark > 0.3) {
      const beam = ctx.createLinearGradient(TRAIN_X, 0, TRAIN_X - 380, 0);
      beam.addColorStop(0, `rgba(255, 230, 160, ${dark * 0.5})`);
      beam.addColorStop(1, 'rgba(255, 230, 160, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(TRAIN_X - 4, y - 62);
      ctx.lineTo(TRAIN_X - 380, y - 120);
      ctx.lineTo(TRAIN_X - 380, y);
      ctx.closePath();
      ctx.fill();
    }

    const shade = (c) => mix(c, '#0c0e26', dark * 0.75);

    // Locomotive.
    const lx = TRAIN_X;
    const b0 = bob(0) * 0.5;
    ctx.fillStyle = shade('#1e1d1f');
    ctx.fillRect(lx + 12, y - 76 + b0, 112, 46); // boiler
    ctx.beginPath();
    ctx.arc(lx + 14, y - 53 + b0, 23, Math.PI / 2, (Math.PI * 3) / 2); // smokebox front
    ctx.fill();
    ctx.fillRect(lx + 26, y - 102 + b0, 16, 28); // stack
    ctx.fillRect(lx + 22, y - 106 + b0, 24, 7);
    ctx.fillRect(lx + 72, y - 88 + b0, 22, 14); // dome
    ctx.fillStyle = shade('#8a2a22'); // red trim stripe and cab
    ctx.fillRect(lx + 12, y - 44 + b0, 112, 5);
    ctx.fillRect(lx + 120, y - 104 + b0, 54, 74);
    ctx.fillStyle = shade('#1e1d1f');
    ctx.fillRect(lx + 114, y - 110 + b0, 66, 8); // cab roof
    ctx.fillStyle = dark > 0.3 ? '#ffd890' : shade('#b8c4c8'); // cab window
    ctx.fillRect(lx + 132, y - 94 + b0, 22, 18);
    ctx.fillStyle = shade('#1e1d1f');
    ctx.beginPath(); // cowcatcher
    ctx.moveTo(lx - 18, y - 4);
    ctx.lineTo(lx + 8, y - 30);
    ctx.lineTo(lx + 8, y - 4);
    ctx.fill();
    ctx.fillStyle = '#ffe6a0'; // headlamp
    ctx.beginPath();
    ctx.arc(lx + 4, y - 64 + b0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade('#1e1d1f');
    for (const wx of [44, 82, 120]) spokedWheel(ctx, lx + wx, y - 17, 17, wheelTurn, shade('#1e1d1f'), shade('#8a2a22'));
    spokedWheel(ctx, lx + 160, y - 11, 11, wheelTurn * 1.5, shade('#1e1d1f'), shade('#8a2a22'));
    // Side rod linking the drivers, going round with them.
    const ry = y - 17 + Math.sin(wheelTurn) * 8;
    const rx = Math.cos(wheelTurn) * 8;
    ctx.fillStyle = shade('#9a948c');
    ctx.fillRect(lx + 44 + rx, ry - 2, 76, 4);

    // Tender.
    const tx = lx + 186;
    ctx.fillStyle = shade('#1e1d1f');
    ctx.fillRect(tx, y - 82 + bob(1), 86, 58);
    ctx.fillStyle = shade('#141414');
    ctx.fillRect(tx + 4, y - 90 + bob(1), 78, 10); // coal heap
    for (const wx of [20, 66]) spokedWheel(ctx, tx + wx, y - 11, 11, wheelTurn * 1.5, shade('#1e1d1f'), null);

    // Boxcars, one with its door open and a passenger.
    let cx = tx + 96;
    const colors = ['#7a3527', '#6b2e22', '#7e4a33', '#6b2e22', '#5e3424'];
    for (let i = 0; i < 5; i++) {
      const by = y - 96 + bob(i + 2);
      ctx.fillStyle = shade('#2a2420');
      ctx.fillRect(cx - 10, y - 30, 10, 4); // coupler
      ctx.fillStyle = shade(colors[i]);
      ctx.fillRect(cx, by, 150, 72);
      ctx.fillStyle = shade('#2a2420');
      ctx.fillRect(cx - 3, by - 5, 156, 6); // roof
      ctx.strokeStyle = shade('rgba(0,0,0,0.25)');
      ctx.lineWidth = 1;
      for (let k = 12; k < 150; k += 12) {
        ctx.beginPath();
        ctx.moveTo(cx + k, by + 2);
        ctx.lineTo(cx + k, by + 70);
        ctx.stroke();
      }
      if (i === 1) {
        ctx.fillStyle = shade('#1a120e'); // open door
        ctx.fillRect(cx + 50, by + 10, 50, 58);
        drawHobo(ctx, cx + 70, by + 68, this.t, shade);
      } else {
        ctx.fillStyle = shade('rgba(0,0,0,0.18)'); // closed door
        ctx.fillRect(cx + 50, by + 10, 50, 58);
      }
      // Lettering, as on a real road's cars, but our own railroad.
      ctx.fillStyle = shade('rgba(240, 225, 200, 0.55)');
      ctx.font = `10px ${FONTS.body}`;
      ctx.textAlign = 'left';
      ctx.fillText('A.W.&P.', cx + 10, by + 22);
      for (const wx of [20, 42, 108, 130]) spokedWheel(ctx, cx + wx, y - 10, 10, wheelTurn * 1.7, shade('#1e1d1f'), null);
      cx += 160;
    }
  }

  drawRain(ctx) {
    ctx.strokeStyle = 'rgba(200, 210, 225, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const r = seeded(Math.floor(this.t * 20));
    for (let i = 0; i < 140; i++) {
      const x = r() * (W + 100);
      const y = r() * VIEW_H;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y + 16);
    }
    ctx.stroke();
  }

  drawPanel(ctx, weather) {
    ctx.fillStyle = '#120d0b';
    ctx.fillRect(0, VIEW_H, W, H - VIEW_H);
    ctx.fillStyle = 'rgba(244, 230, 200, 0.35)';
    ctx.fillRect(0, VIEW_H, W, 2);

    // Route strip: every stop on the line, the train between two of them.
    const stops = ROUTES[this.journey.route].stops;
    const x0 = 90;
    const x1 = W - 90;
    const sy = VIEW_H + 50;
    const total = this.routeMiles;
    const at = (miles) => x0 + ((x1 - x0) * miles) / total;
    ctx.strokeStyle = 'rgba(244, 230, 200, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
    const travelled = this.milesBefore + this.progress * this.miles;
    ctx.strokeStyle = '#c0453a';
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(at(travelled), sy);
    ctx.stroke();
    ctx.font = `14px ${FONTS.body}`;
    ctx.textAlign = 'center';
    const stopX = stops.map((_, i) => at(milesTo(this.journey.route, i)));
    stops.forEach((id, i) => {
      ctx.fillStyle = i <= this.journey.stop ? '#c0453a' : 'rgba(244, 230, 200, 0.6)';
      ctx.beginPath();
      ctx.arc(stopX[i], sy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    // Label the next stop, the last one, and the ends, in that order of
    // importance, skipping any that would overlap (the eastern stops on the
    // southern line are close together). Alternate above and below.
    const placed = [];
    const n = stops.length;
    for (const i of [this.journey.stop + 1, this.journey.stop, 0, n - 1]) {
      if (placed.some((p) => p.i === i)) continue;
      const name = CITIES[stops[i]].name;
      const half = ctx.measureText(name).width / 2 + 8;
      const above = i % 2 === 0;
      const box = { i, above, l: stopX[i] - half, r: stopX[i] + half };
      if (placed.some((p) => p.above === above && p.l < box.r && box.l < p.r)) continue;
      placed.push(box);
      ctx.fillStyle = stops[i] === this.to ? COLORS.accent : 'rgba(244, 230, 200, 0.7)';
      ctx.fillText(name, stopX[i], sy + (above ? -16 : 24));
    }
    // Little locomotive on the strip.
    const tx = at(travelled);
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(tx - 7, sy - 6, 14, 8);
    ctx.fillRect(tx - 6, sy - 11, 4, 5);

    // Status, two columns.
    const rows = [
      ['Date', formatDate(this.day)],
      ['Weather', weather],
      ['Next stop', CITIES[this.to].name],
    ];
    const rows2 = [
      ['Miles to go', `${Math.max(0, Math.round(this.miles * (1 - this.progress)))}`],
      ['Miles traveled', `${Math.round(travelled)} of ${total}`],
      ['Arrests', `${this.journey.arrests}`],
    ];
    ctx.textAlign = 'left';
    ctx.font = `21px ${FONTS.body}`;
    const ry = VIEW_H + 122;
    const line = 36;
    for (const [col, list] of [
      [140, rows],
      [700, rows2],
    ]) {
      list.forEach(([k, v], i) => {
        ctx.fillStyle = 'rgba(244, 230, 200, 0.6)';
        ctx.fillText(`${k}:`, col, ry + i * line);
        ctx.fillStyle = COLORS.cream;
        ctx.fillText(v, col + 190, ry + i * line);
      });
    }

    drawPrompts(
      ctx,
      this.game.input,
      [
        ['confirm', this.hurrying ? 'Hurrying…' : 'Hold to hurry'],
        ['pause', 'Stop'],
      ],
      W - 24,
      H - 22,
    );
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, W / 2 - 220, 220, 440, 210, '#1c1212');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `30px ${FONTS.title}`;
    ctx.fillText('Resting', W / 2, 272);
    ctx.restore();
    this.paused.draw(ctx, this.t);
  }
}

// ------------------------------------------------------------- scenery bits

function ridgeHeight(style, u) {
  const n = (f, ph) => Math.sin(u * f + ph);
  switch (style) {
    case 'rolling':
      return 40 + 22 * n(0.006, 1) + 12 * n(0.017, 2) + 5 * n(0.05, 3);
    case 'ridges':
      return 85 + 40 * n(0.005, 4) + 22 * Math.abs(n(0.013, 5)) + 8 * n(0.04, 6);
    case 'mesas': {
      // Flat tops with steep sides.
      const v = n(0.004, 7) + 0.5 * n(0.011, 8);
      return v > 0.55 ? 95 + 4 * n(0.05, 9) : v > 0.35 ? 30 + (v - 0.35) * 325 : 18 + 8 * n(0.02, 10);
    }
    case 'skyline': {
      // Blocky city and mill buildings.
      const block = Math.floor(u / 26);
      const r = Math.abs(Math.sin(block * 12.9898) * 43758.5453) % 1;
      return 22 + r * 48 + (r > 0.9 ? 40 : 0);
    }
    case 'treeline':
      return 26 + 6 * n(0.03, 11) + 4 * Math.abs(n(0.11, 12));
    case 'flat':
    default:
      return 8 + 4 * n(0.01, 13);
  }
}

function drawThing(ctx, kind, x, y, s, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (kind) {
    case 'tree': {
      ctx.fillStyle = '#4a3828';
      ctx.fillRect(-3, -26, 6, 26);
      ctx.fillStyle = r() < 0.5 ? '#4f7a3a' : '#5d8640';
      blob(ctx, 0, -40, 22);
      blob(ctx, -12, -32, 15);
      blob(ctx, 12, -32, 15);
      break;
    }
    case 'oak': {
      ctx.fillStyle = '#4a3828';
      ctx.fillRect(-5, -34, 10, 34);
      ctx.fillStyle = '#48663a';
      blob(ctx, 0, -48, 30);
      blob(ctx, -24, -40, 20);
      blob(ctx, 24, -40, 20);
      ctx.fillStyle = 'rgba(140, 150, 120, 0.6)'; // hanging moss
      for (let k = -20; k <= 20; k += 10) ctx.fillRect(k, -34, 3, 12);
      break;
    }
    case 'pine': {
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(-2, -10, 4, 10);
      ctx.fillStyle = '#2f5234';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(-14 + k * 3, -8 - k * 14);
        ctx.lineTo(0, -30 - k * 14);
        ctx.lineTo(14 - k * 3, -8 - k * 14);
        ctx.fill();
      }
      break;
    }
    case 'barn': {
      ctx.fillStyle = '#8a2f24';
      ctx.fillRect(-26, -30, 52, 30);
      ctx.fillStyle = '#5a2018';
      ctx.beginPath();
      ctx.moveTo(-30, -30);
      ctx.lineTo(0, -50);
      ctx.lineTo(30, -30);
      ctx.fill();
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(-8, -22, 16, 22);
      break;
    }
    case 'farm':
    case 'house':
    case 'cabin': {
      const wall = kind === 'cabin' ? '#6a4a30' : '#e2d6b8';
      ctx.fillStyle = wall;
      ctx.fillRect(-18, -22, 36, 22);
      ctx.fillStyle = kind === 'cabin' ? '#3a2a1e' : '#5a4a42';
      ctx.beginPath();
      ctx.moveTo(-22, -22);
      ctx.lineTo(0, -38);
      ctx.lineTo(22, -22);
      ctx.fill();
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(-10, -16, 7, 7);
      ctx.fillRect(4, -16, 7, 7);
      if (kind === 'farm') {
        ctx.fillStyle = '#8a2f24';
        ctx.fillRect(26, -26, 30, 26);
      }
      break;
    }
    case 'steeple': {
      ctx.fillStyle = '#ece4d2';
      ctx.fillRect(-14, -30, 28, 30);
      ctx.fillRect(-6, -54, 12, 24);
      ctx.fillStyle = '#4a4a52';
      ctx.beginPath();
      ctx.moveTo(-8, -54);
      ctx.lineTo(0, -76);
      ctx.lineTo(8, -54);
      ctx.fill();
      break;
    }
    case 'fence': {
      ctx.fillStyle = '#7a6448';
      for (let k = -40; k <= 40; k += 16) ctx.fillRect(k, -14, 3, 14);
      ctx.fillRect(-40, -11, 83, 2);
      ctx.fillRect(-40, -5, 83, 2);
      break;
    }
    case 'factory': {
      ctx.fillStyle = '#5c524c';
      ctx.fillRect(-40, -34, 80, 34);
      ctx.fillStyle = '#4a423e'; // sawtooth roof
      for (let k = -40; k < 40; k += 20) {
        ctx.beginPath();
        ctx.moveTo(k, -34);
        ctx.lineTo(k + 20, -46);
        ctx.lineTo(k + 20, -34);
        ctx.fill();
      }
      ctx.fillStyle = '#3e3634';
      ctx.fillRect(22, -90, 9, 56); // smokestack
      ctx.fillStyle = 'rgba(120, 115, 110, 0.5)';
      const drift = (t * 12) % 30;
      blob(ctx, 30 + drift, -98 - drift * 0.4, 8 + drift * 0.3);
      blob(ctx, 46 + drift, -104 - drift * 0.4, 6 + drift * 0.3);
      ctx.fillStyle = '#d8b060'; // lit windows
      for (let k = -32; k < 20; k += 12) ctx.fillRect(k, -24, 6, 8);
      break;
    }
    case 'tank': {
      ctx.fillStyle = '#4a423e';
      ctx.fillRect(-2, -40, 4, 40);
      ctx.fillRect(-16, -40, 4, 40);
      ctx.fillRect(12, -40, 4, 40);
      ctx.fillStyle = '#6a605a';
      ctx.fillRect(-20, -70, 40, 32);
      ctx.beginPath();
      ctx.moveTo(-22, -70);
      ctx.lineTo(0, -84);
      ctx.lineTo(22, -70);
      ctx.fill();
      break;
    }
    case 'elevator': {
      // Grain elevator, the prairie's skyline.
      ctx.fillStyle = '#d8ccae';
      ctx.fillRect(-18, -86, 36, 86);
      ctx.fillStyle = '#b8ab8a';
      ctx.fillRect(-14, -104, 20, 18);
      ctx.beginPath();
      ctx.moveTo(-16, -104);
      ctx.lineTo(-4, -114);
      ctx.lineTo(8, -104);
      ctx.fill();
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(18, -40, 24, 40);
      break;
    }
    case 'windmill': {
      ctx.strokeStyle = '#5a4a3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(0, -60);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.translate(0, -62);
      ctx.rotate(t * 3);
      ctx.fillStyle = '#7a6a5a';
      for (let k = 0; k < 8; k++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(0, -2, 16, 4);
      }
      break;
    }
    case 'hay': {
      ctx.fillStyle = '#d4b45a';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(0, -36, 18, 0);
      ctx.fill();
      break;
    }
    case 'cotton': {
      // A stretch of cotton rows: dark bushes dotted white.
      for (let k = -50; k <= 50; k += 14) {
        ctx.fillStyle = '#4a5a32';
        blob(ctx, k, -6, 7);
        ctx.fillStyle = '#f2efe6';
        ctx.fillRect(k - 4, -10, 3, 3);
        ctx.fillRect(k + 2, -6, 3, 3);
        ctx.fillRect(k - 1, -13, 3, 3);
      }
      break;
    }
    case 'shack': {
      ctx.fillStyle = '#7a6a58';
      ctx.fillRect(-20, -22, 40, 22);
      ctx.fillStyle = '#5a4e44';
      ctx.fillRect(-24, -26, 48, 5);
      ctx.fillStyle = '#2a221c';
      ctx.fillRect(-6, -16, 10, 16);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(12, -36, 5, 12); // stovepipe
      break;
    }
    case 'saguaro': {
      ctx.fillStyle = '#4f7040';
      ctx.fillRect(-5, -64, 10, 64);
      ctx.fillRect(-20, -40, 6, 18);
      ctx.fillRect(-20, -26, 16, 6);
      ctx.fillRect(14, -50, 6, 22);
      ctx.fillRect(4, -32, 16, 6);
      blob(ctx, 0, -64, 5);
      break;
    }
    case 'rock': {
      ctx.fillStyle = '#9a6a48';
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-18, -22);
      ctx.lineTo(4, -28);
      ctx.lineTo(22, -12);
      ctx.lineTo(28, 0);
      ctx.fill();
      break;
    }
    case 'scrub': {
      ctx.fillStyle = '#8a8a5a';
      blob(ctx, -6, -6, 8);
      blob(ctx, 6, -5, 7);
      break;
    }
    case 'orange': {
      for (let k = -40; k <= 40; k += 26) {
        ctx.fillStyle = '#3d6a32';
        blob(ctx, k, -14, 13);
        ctx.fillStyle = '#e8902a';
        ctx.fillRect(k - 6, -18, 4, 4);
        ctx.fillRect(k + 3, -12, 4, 4);
        ctx.fillRect(k - 1, -24, 4, 4);
      }
      break;
    }
    case 'palm': {
      ctx.strokeStyle = '#6a5a44';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(6, -50, 2, -96);
      ctx.stroke();
      ctx.strokeStyle = '#3e6a34';
      ctx.lineWidth = 4;
      for (const a of [-2.6, -2.0, -1.2, -0.6, 0]) {
        ctx.beginPath();
        ctx.moveTo(2, -96);
        ctx.quadraticCurveTo(2 + Math.cos(a) * 18, -104 + Math.sin(a) * 10, 2 + Math.cos(a) * 30, -90 + Math.sin(a) * 4);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

function drawHobo(ctx, x, floor, t, shade) {
  // Sitting in the doorway, legs dangling over the edge, swinging.
  const swing = Math.sin(t * 2.2) * 3;
  ctx.fillStyle = shade('#5a4a3a');
  ctx.fillRect(x - 7, floor - 30, 14, 24); // coat
  ctx.fillStyle = shade('#3a3a44');
  ctx.fillRect(x - 6, floor - 8, 20, 8); // lap
  ctx.save();
  ctx.translate(x + 12, floor);
  ctx.rotate(swing * 0.04);
  ctx.fillRect(-2, -2, 6, 20); // legs over the edge
  ctx.fillStyle = shade('#2a2018');
  ctx.fillRect(-2, 16, 10, 5); // boots
  ctx.restore();
  ctx.fillStyle = shade('#d8b08a');
  ctx.beginPath();
  ctx.arc(x, floor - 36, 6, 0, Math.PI * 2); // face
  ctx.fill();
  ctx.fillStyle = shade('#2b221b');
  ctx.fillRect(x - 10, floor - 42, 20, 3); // hat brim
  ctx.fillRect(x - 6, floor - 49, 12, 8);
  ctx.fillStyle = shade('#b5482f');
  ctx.beginPath();
  ctx.arc(x - 16, floor - 6, 6, 0, Math.PI * 2); // bindle beside him
  ctx.fill();
}

function spokedWheel(ctx, x, y, r, turn, color, hub) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 150, 140, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = turn + (k * Math.PI) / 4;
    ctx.moveTo(x - Math.cos(a) * r * 0.85, y - Math.sin(a) * r * 0.85);
    ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85);
  }
  ctx.stroke();
  if (hub) {
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function blob(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ------------------------------------------------------------ colour helpers

function curve(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1];
      const [t1, b] = keys[i];
      return a + ((b - a) * (t - t0)) / (t1 - t0);
    }
  }
  return keys[keys.length - 1][1];
}

function skyAt(t) {
  for (let i = 1; i < SKY.length; i++) {
    if (t <= SKY[i][0]) {
      const [t0, a1, a2] = SKY[i - 1];
      const [t1, b1, b2] = SKY[i];
      const k = (t - t0) / (t1 - t0);
      return [mix(a1, b1, k), mix(a2, b2, k)];
    }
  }
  return [SKY[0][1], SKY[0][2]];
}

const hexes = new Map();
function rgb(c) {
  if (c.startsWith('#')) {
    if (!hexes.has(c)) hexes.set(c, [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).concat(1));
    return hexes.get(c);
  }
  const m = c.match(/[\d.]+/g).map(Number);
  return [m[0], m[1], m[2], m[3] ?? 1];
}

/** Mix two colours (hex or rgba()), k = 0 gives a, 1 gives b. */
function mix(a, b, k) {
  const A = rgb(a);
  const B = rgb(b);
  const v = A.map((x, i) => x + (B[i] - x) * k);
  return `rgba(${Math.round(v[0])}, ${Math.round(v[1])}, ${Math.round(v[2])}, ${v[3].toFixed(3)})`;
}
