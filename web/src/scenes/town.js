// Exploring a stop: walk its main street side-on, talk to people, step into
// places, and head for the rail yard at the far end. Everything here is drawn
// from the city's module in src/cities/<id>/; nothing is generated.

import { formatDate } from '../core/calendar.js';
import { drawPrompts } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { CITIES, ROUTES } from '../data/routes.js';
import { MapScene } from './map.js';
import { panel } from './title.js';
import { YardScene } from './yard.js';

const BASE = 540; // where building fronts meet the sidewalk
const FEET = 572; // where people stand
const FAR_PARALLAX = 0.35;
const WALK = 190;
const RUN = 300;
const REACH = 46; // how close you need to be to talk or go in

const SKIES = {
  day: { top: '#6f9bcf', bottom: '#dbe6e8', far: '#8a96a4', lit: false },
  dusk: { top: '#2e2a4e', bottom: '#e08a5a', far: '#3e3448', lit: true },
  night: { top: '#0e1228', bottom: '#2a2e4a', far: '#1e2034', lit: true },
  haze: { top: '#9a948a', bottom: '#d8c8a0', far: '#6e6660', lit: false },
  desert: { top: '#7aa8d8', bottom: '#f2dcb0', far: '#b88a64', lit: false },
};

const KIND_LABELS = {
  store: 'Store',
  diner: 'Something to eat',
  mission: 'Mission',
  lodging: 'A bed for the night',
  landmark: 'Landmark',
  game: 'Mini-game',
};

export class TownScene {
  constructor(game, journey, cityId) {
    this.game = game;
    this.journey = journey;
    this.city = CITIES[cityId];
    this.town = this.city.town;
    this.sky = SKIES[this.town.sky] ?? SKIES.day;
    this.player = { x: this.town.start, facing: 1, step: 0 };
    this.camX = 0;
    this.t = 0;
    this.dialog = null; // { npc, line }
    this.place = null; // place id being visited
    this.notice = null; // short message, e.g. no yard yet
    this.focus = null;
  }

  /** Can you head for the yard from here? Only at the stop you're at, with a route chosen. */
  get yardOpen() {
    const j = this.journey;
    if (!j.route) return false;
    const stops = ROUTES[j.route].stops;
    return stops[j.stop] === this.city.id && j.stop < stops.length - 1;
  }

  // ---------------------------------------------------------------- update

  update(dt, input) {
    this.t += dt;
    if (this.notice) this.notice.t -= dt;

    if (this.dialog) {
      if (input.pressed('back')) this.dialog = null;
      else if (input.pressed('confirm')) {
        this.dialog.line++;
        if (this.dialog.line >= this.dialog.npc.lines.length) this.dialog = null;
      }
      return;
    }
    if (this.place) {
      if (input.pressed('back') || input.pressed('confirm')) this.place = null;
      return;
    }
    if (input.pressed('back') || input.pressed('pause')) {
      this.game.setScene(new MapScene(this.game, this.journey));
      return;
    }

    // Walk the street.
    const p = this.player;
    const mx = input.move().x;
    if (Math.abs(mx) > 0.1) {
      const speed = input.down('sprint') ? RUN : WALK;
      p.x = Math.max(30, Math.min(this.town.width - 30, p.x + mx * speed * dt));
      p.facing = Math.sign(mx);
      p.step += dt * Math.abs(mx) * (input.down('sprint') ? 14 : 10);
    } else {
      p.step = 0;
    }
    this.camX = Math.max(0, Math.min(this.town.width - W, p.x - W / 2));

    this.focus = this.nearest();
    if (this.focus && input.pressed('confirm')) this.interact(this.focus);
  }

  /** The closest thing within reach: a person, a doorway, or the way to the yard. */
  nearest() {
    const px = this.player.x;
    const options = [];
    for (const npc of this.town.npcs ?? []) options.push({ type: 'npc', x: npc.x, npc, verb: `Talk to ${npc.name}` });
    for (const b of this.town.buildings) {
      if (!b.place) continue;
      const place = this.town.places[b.place];
      const verb = b.roof === 'gate' ? `Go into ${place.name}` : `Enter ${place.name}`;
      options.push({ type: 'place', x: b.x + b.w / 2, id: b.place, verb });
    }
    if (this.town.yardSign != null) options.push({ type: 'yard', x: this.town.yardSign, verb: 'Head for the rail yard' });
    let best = null;
    for (const o of options) {
      const d = Math.abs(o.x - px);
      if (d < REACH && (!best || d < best.d)) best = { ...o, d };
    }
    return best;
  }

  interact(f) {
    if (f.type === 'npc') this.dialog = { npc: f.npc, line: 0 };
    else if (f.type === 'place') this.place = f.id;
    else if (f.type === 'yard') {
      if (this.yardOpen) this.game.setScene(new YardScene(this.game, this.journey));
      else this.notice = { text: 'Pick your line on the map before you go hopping freights.', t: 3 };
    }
  }

  // ------------------------------------------------------------------ draw

  draw(ctx) {
    const view = { camX: this.camX, W, H, base: BASE, t: this.t };
    const town = this.town;

    // Sky.
    const g = ctx.createLinearGradient(0, 0, 0, BASE);
    g.addColorStop(0, this.sky.top);
    g.addColorStop(1, this.sky.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Far silhouettes.
    ctx.save();
    ctx.translate(-this.camX * FAR_PARALLAX, 0);
    ctx.fillStyle = this.sky.far;
    for (const s of town.far ?? []) drawFarShape(ctx, s);
    ctx.restore();
    town.draw?.far?.(ctx, view);

    // Street and sidewalk.
    ctx.fillStyle = '#5a524a';
    ctx.fillRect(0, BASE, W, 52);
    ctx.fillStyle = '#7a7268';
    for (let x = -(this.camX % 60); x < W; x += 60) ctx.fillRect(x, BASE, 2, 52);
    ctx.fillStyle = '#8a8278';
    ctx.fillRect(0, BASE + 50, W, 6); // curb
    ctx.fillStyle = '#3a3532';
    ctx.fillRect(0, BASE + 56, W, H - BASE - 56);

    // Buildings.
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (const b of town.buildings) {
      if (b.x + b.w < this.camX - 20 || b.x > this.camX + W + 20) continue;
      drawBuilding(ctx, b, this.sky.lit, this.focus?.type === 'place' && this.focus.id === b.place);
    }
    for (const x of town.lamps ?? []) drawLamp(ctx, x, this.sky.lit);
    if (town.yardSign != null) drawYardSign(ctx, town.yardSign, this.yardOpen);
    ctx.restore();
    town.draw?.street?.(ctx, view);

    // People.
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (const npc of town.npcs ?? []) {
      const facing = this.player.x < npc.x ? -1 : 1;
      drawPerson(ctx, npc.x, FEET, npc.look, facing, 0, this.t);
    }
    drawPerson(ctx, this.player.x, FEET, HOBO, this.player.facing, this.player.step, this.t, true);
    if (this.focus && !this.dialog && !this.place) {
      bubble(ctx, this.focus.verb, this.player.x, FEET - 110);
    }
    ctx.restore();

    // Header.
    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 8, 0.55)';
    ctx.fillRect(0, 0, W, 64);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `30px ${FONTS.title}`;
    ctx.fillText(this.city.name, 24, 33);
    ctx.textAlign = 'right';
    ctx.font = `20px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.8)';
    ctx.fillText(formatDate(this.journey.day), W - 24, 34);
    ctx.restore();

    if (this.notice && this.notice.t > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.notice.t * 2);
      panel(ctx, W / 2 - 360, 90, 720, 60, '#1c1212');
      ctx.fillStyle = COLORS.cream;
      ctx.font = `19px ${FONTS.body}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.notice.text, W / 2, 121);
      ctx.restore();
    }

    if (this.dialog) this.drawDialog(ctx);
    else if (this.place) this.drawPlace(ctx);

    const prompts = this.dialog
      ? [['confirm', 'Next'], ['back', 'Done']]
      : this.place
        ? [['back', 'Leave']]
        : [['sprint', 'Hurry'], ['confirm', 'Act'], ['back', 'Back to the map']];
    drawPrompts(ctx, this.game.input, prompts, W - 24, H - 22);
  }

  drawDialog(ctx) {
    const { npc, line } = this.dialog;
    // Up top, clear of the street, so you can see who's talking.
    panel(ctx, 120, 80, W - 240, 150, '#1c1212');
    ctx.save();
    ctx.fillStyle = COLORS.accent;
    ctx.font = `22px ${FONTS.title}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.name, 150, 112);
    wrapLeft(ctx, `“${npc.lines[line]}”`, 150, 154, W - 300, 28, `20px ${FONTS.body}`, COLORS.cream);
    ctx.restore();
  }

  drawPlace(ctx) {
    const place = this.town.places[this.place];
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, W, H);
    const x = W / 2 - 340;
    panel(ctx, x, 110, 680, 450, '#1c1212');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `36px ${FONTS.title}`;
    ctx.fillText(place.name, W / 2, 168);
    ctx.fillStyle = 'rgba(244, 230, 200, 0.55)';
    ctx.font = `16px ${FONTS.body}`;
    ctx.fillText(KIND_LABELS[place.kind] ?? place.kind, W / 2, 204);
    ctx.textAlign = 'left';
    let y = wrapLeft(ctx, place.blurb, x + 50, 248, 580, 28, `20px ${FONTS.body}`, COLORS.cream);

    y += 24;
    ctx.font = `19px ${FONTS.body}`;
    if (place.stock?.length) {
      for (const [item, price] of place.stock) {
        ctx.fillStyle = 'rgba(244, 230, 200, 0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(item, x + 80, y);
        ctx.textAlign = 'right';
        ctx.fillText(price, x + 600, y);
        ctx.strokeStyle = 'rgba(244, 230, 200, 0.2)';
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(x + 80 + ctx.measureText(item).width + 10, y + 6);
        ctx.lineTo(x + 590 - ctx.measureText(price).width, y + 6);
        ctx.stroke();
        ctx.setLineDash([]);
        y += 32;
      }
      y += 6;
    }
    const soon = {
      store: 'Buying and selling comes later.',
      diner: 'Buying a meal comes later.',
      mission: 'Staying for the soup comes later.',
      lodging: 'Taking a bed comes later.',
      game: place.game ? `${place.game}: a mini-game for later.` : 'A mini-game for later.',
      landmark: '',
    }[place.kind];
    if (soon) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(244, 230, 200, 0.4)';
      ctx.fillText(`(${soon})`, W / 2, Math.min(y + 10, 528));
    }
    ctx.restore();
  }
}

// --------------------------------------------------------------- drawing

const HOBO = { coat: '#6a5642', pants: '#3a3a44', hat: 'fedora', skin: '#d8b08a', bindle: true };

function drawFarShape(ctx, { shape, x, w, h }) {
  const y = BASE;
  ctx.beginPath();
  switch (shape) {
    case 'tower':
      ctx.rect(x, y - h, w, h);
      ctx.rect(x + w * 0.2, y - h - 20, w * 0.6, 20);
      break;
    case 'spire':
      ctx.rect(x, y - h * 0.8, w, h * 0.8);
      ctx.moveTo(x + w * 0.1, y - h * 0.8);
      ctx.lineTo(x + w / 2, y - h);
      ctx.lineTo(x + w * 0.9, y - h * 0.8);
      break;
    case 'dome':
      ctx.rect(x, y - h * 0.5, w, h * 0.5);
      ctx.moveTo(x + w * 0.2, y - h * 0.5);
      ctx.arc(x + w / 2, y - h * 0.5, w * 0.3, Math.PI, 0);
      ctx.rect(x + w / 2 - 3, y - h, 6, h * 0.25);
      break;
    case 'stack':
      ctx.rect(x, y - h, w, h);
      break;
    case 'tank':
      ctx.rect(x + w * 0.15, y - h * 0.45, 6, h * 0.45);
      ctx.rect(x + w * 0.85 - 6, y - h * 0.45, 6, h * 0.45);
      ctx.rect(x, y - h, w, h * 0.55);
      break;
    case 'mountain':
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.3, y - h * 0.8);
      ctx.lineTo(x + w * 0.45, y - h);
      ctx.lineTo(x + w * 0.6, y - h * 0.75);
      ctx.lineTo(x + w * 0.75, y - h * 0.85);
      ctx.lineTo(x + w, y);
      break;
    case 'block':
    default:
      ctx.rect(x, y - h, w, h);
  }
  ctx.fill();
}

function drawBuilding(ctx, b, lit, focused) {
  const top = BASE - b.h;
  const door = b.x + b.w / 2;

  if (b.roof === 'gate') {
    // An open place (park, market, alley): two posts and an arch with the sign.
    ctx.fillStyle = shade(b.wall, -0.25);
    ctx.fillRect(b.x + 10, BASE - 150, 16, 150);
    ctx.fillRect(b.x + b.w - 26, BASE - 150, 16, 150);
    ctx.fillRect(b.x + 6, BASE - 160, b.w - 12, 14);
    if (b.sign) signBoard(ctx, b.sign, door, BASE - 182, focused);
    return;
  }

  ctx.fillStyle = b.wall;
  ctx.fillRect(b.x, top, b.w, b.h);
  // Roofline.
  ctx.fillStyle = shade(b.wall, -0.3);
  if (b.roof === 'gable') {
    ctx.beginPath();
    ctx.moveTo(b.x - 8, top);
    ctx.lineTo(door, top - b.w * 0.28);
    ctx.lineTo(b.x + b.w + 8, top);
    ctx.fill();
  } else if (b.roof === 'false-front') {
    ctx.fillRect(b.x + b.w * 0.15, top - 26, b.w * 0.7, 28);
    ctx.fillRect(b.x + b.w * 0.3, top - 40, b.w * 0.4, 16);
  } else {
    ctx.fillRect(b.x - 4, top - 6, b.w + 8, 10); // cornice
  }

  // Windows on a grid, the ground floor left for the door and shop front.
  const cols = Math.max(1, Math.floor((b.w - 30) / 48));
  const gap = (b.w - cols * 26) / (cols + 1);
  let row = 0;
  for (let y = top + 24; y < BASE - 110; y += 56, row++) {
    for (let c = 0; c < cols; c++) {
      const wx = b.x + gap + c * (26 + gap);
      const on = lit && (row + c * 2 + Math.round(b.x / 10)) % 3 !== 0;
      ctx.fillStyle = on ? '#e8c070' : shade(b.wall, -0.45);
      ctx.fillRect(wx, y, 26, 34);
      ctx.fillStyle = shade(b.wall, -0.2);
      ctx.fillRect(wx - 3, y + 34, 32, 4);
    }
  }

  // Ground floor: door, and a shop window if it's a place.
  ctx.fillStyle = shade(b.wall, -0.5);
  ctx.fillRect(door - 16, BASE - 64, 32, 64);
  if (b.place) {
    ctx.fillStyle = lit ? '#d8b070' : shade(b.wall, 0.25);
    ctx.fillRect(b.x + 14, BASE - 60, door - 30 - b.x - 14, 38);
    ctx.fillRect(door + 30, BASE - 60, b.x + b.w - 14 - door - 30, 38);
  }
  if (b.sign) signBoard(ctx, b.sign, door, BASE - 84, focused);
}

function signBoard(ctx, text, x, y, focused) {
  ctx.save();
  ctx.font = `bold 15px ${FONTS.body}`;
  const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = focused ? '#3a2416' : '#24180f';
  ctx.fillRect(x - w / 2, y - 14, w, 28);
  ctx.strokeStyle = focused ? COLORS.accent : 'rgba(244, 230, 200, 0.5)';
  ctx.lineWidth = focused ? 2 : 1;
  ctx.strokeRect(x - w / 2 + 2, y - 12, w - 4, 24);
  ctx.fillStyle = focused ? COLORS.accent : COLORS.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawLamp(ctx, x, lit) {
  ctx.fillStyle = '#2a2624';
  ctx.fillRect(x - 3, BASE - 150, 6, 170);
  ctx.fillRect(x - 10, BASE - 156, 20, 8);
  ctx.fillStyle = lit ? '#ffe2a0' : '#8a8478';
  ctx.fillRect(x - 7, BASE - 172, 14, 16);
  if (lit) {
    const g = ctx.createRadialGradient(x, BASE - 164, 4, x, BASE - 164, 90);
    g.addColorStop(0, 'rgba(255, 220, 150, 0.35)');
    g.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 90, BASE - 254, 180, 180);
  }
}

function drawYardSign(ctx, x, open) {
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 3, BASE - 100, 6, 130);
  ctx.save();
  ctx.translate(x, BASE - 92);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-50, -16);
  ctx.lineTo(40, -16);
  ctx.lineTo(56, 0);
  ctx.lineTo(40, 16);
  ctx.lineTo(-50, 16);
  ctx.fill();
  ctx.fillStyle = open ? '#2a1a12' : 'rgba(42, 26, 18, 0.5)';
  ctx.font = `bold 14px ${FONTS.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RAIL YARD', -2, 1);
  ctx.restore();
}

/** A person seen side-on, feet at (x, feet). facing 1 = right. */
function drawPerson(ctx, x, feet, look, facing, step, t, isPlayer = false) {
  ctx.save();
  ctx.translate(x, feet);
  ctx.scale(facing, 1);
  const swing = Math.sin(step) * 8;
  const breathe = Math.sin(t * 2 + x) * 0.6;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs.
  ctx.strokeStyle = look.pants;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(swing * 0.6, -2);
  ctx.moveTo(0, -34);
  ctx.lineTo(-swing * 0.6, -2);
  ctx.stroke();
  ctx.fillStyle = '#1e1814';
  ctx.fillRect(swing * 0.6 - 4, -4, 12, 5);
  ctx.fillRect(-swing * 0.6 - 4, -4, 12, 5);

  // Coat.
  ctx.fillStyle = look.coat;
  ctx.beginPath();
  ctx.roundRect(-11, -72 + breathe, 22, 42, 5);
  ctx.fill();
  // Arm.
  ctx.strokeStyle = shade(look.coat, -0.15);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(2, -66 + breathe);
  ctx.lineTo(4 - swing * 0.5, -40);
  ctx.stroke();

  // Head and hat.
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(2, -82 + breathe, 9, 0, Math.PI * 2);
  ctx.fill();
  const hat = look.hat;
  ctx.fillStyle = hat === 'straw' ? '#d8c088' : hat === 'cloche' ? '#6a3a4a' : '#2b221b';
  if (hat === 'fedora' || hat === 'straw') {
    ctx.fillRect(-12, -89 + breathe, 28, 4);
    ctx.fillRect(-6, -98 + breathe, 16, 10);
  } else if (hat === 'cap') {
    ctx.fillRect(-8, -95 + breathe, 18, 8);
    ctx.fillRect(8, -89 + breathe, 9, 3);
  } else if (hat === 'bowler') {
    ctx.fillRect(-10, -89 + breathe, 24, 3);
    ctx.beginPath();
    ctx.arc(2, -90 + breathe, 9, Math.PI, 0);
    ctx.fill();
  } else if (hat === 'cloche') {
    ctx.beginPath();
    ctx.arc(2, -86 + breathe, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-10, -87 + breathe, 24, 3);
  }

  if (isPlayer && look.bindle) {
    // Bindle on a stick over the back shoulder.
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -64 + breathe);
    ctx.lineTo(-22, -92 + breathe);
    ctx.stroke();
    ctx.fillStyle = '#b5482f';
    ctx.beginPath();
    ctx.arc(-24, -88 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function bubble(ctx, text, x, y) {
  ctx.save();
  ctx.font = `17px ${FONTS.body}`;
  const w = ctx.measureText(text).width + 24;
  ctx.fillStyle = 'rgba(20, 14, 12, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 18, w, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapLeft(ctx, text, x, y, maxW, lineH, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineH;
}

/** Lighten (k > 0) or darken (k < 0) a hex colour. */
function shade(hex, k) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = n.map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
  return `rgb(${out.join(',')})`;
}
