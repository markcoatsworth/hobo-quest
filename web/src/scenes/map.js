// The journey map: choose a line in New York, then between yards watch the
// freight carry you to the next stop. Reaching Los Angeles ends the game.

import { Menu } from '../core/menu.js';
import { drawPrompts } from '../core/prompts.js';
import { clearJourney, saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { formatDate } from '../core/calendar.js';
import { CITIES, ROUTES, legDays, legPath, routePath } from '../data/routes.js';
import { panel, TitleScene } from './title.js';
import { TownScene } from './town.js';
import { YardScene } from './yard.js';

// Source-image pixels -> screen. Crops the source to the lower 48.
const SRC_X = 20;
const SRC_Y = 60;
const S = 0.82;
const MAP_X = 24;
const MAP_Y = 86;
const toScreen = ([x, y]) => [MAP_X + (x - SRC_X) * S, MAP_Y + (y - SRC_Y) * S];

const PANEL = { x: 930, y: 86, w: 326, h: 607 };

const ROUTE_INK = '#9e2b25';

// Label placement per city: [dx, dy, align].
const LABELS = {
  nyc: [10, -6, 'left'],
  phl: [10, 4, 'left'],
  dc: [-10, 8, 'right'],
  cle: [6, 14, 'left'],
  chi: [-8, 12, 'right'],
  kc: [0, -12, 'center'],
  nas: [10, 4, 'left'],
  clk: [10, 10, 'left'],
  dal: [0, 20, 'center'],
  elp: [0, -14, 'center'],
  phx: [0, 20, 'center'],
  la: [8, 18, 'left'],
};

const images = {};
function image(name) {
  if (!images[name]) {
    images[name] = new Image();
    images[name].src = `./map/${name}.png`;
  }
  return images[name];
}

export class MapScene {
  constructor(game, journey) {
    this.game = game;
    this.journey = journey;
    this.t = 0;
    this.land = image('land');
    this.rails = image('rails');

    if (!journey.route) this.enterChoose();
    else this.enterStop();
  }

  get stops() {
    return ROUTES[this.journey.route].stops;
  }

  get here() {
    return this.journey.route ? this.stops[this.journey.stop] : 'nyc';
  }

  enterChoose() {
    this.mode = 'choose';
    this.menu = new Menu(
      [
        { id: 'north', label: ROUTES.north.name },
        { id: 'south', label: ROUTES.south.name },
        { id: 'explore', label: 'Explore New York' },
        { id: 'title', label: 'Quit to Title' },
      ],
      { x: PANEL.x + PANEL.w / 2, y: 452, rowH: 48, width: 280, fontSize: 24 },
    );
  }

  enterStop() {
    const atEnd = this.journey.stop === this.stops.length - 1;
    if (atEnd) {
      this.mode = 'won';
      clearJourney();
      this.menu = new Menu(
        [
          { id: 'explore', label: `Explore ${CITIES[this.here].name}` },
          { id: 'title', label: 'Back to Title' },
        ],
        { x: PANEL.x + PANEL.w / 2, y: 580, rowH: 50, width: 290, fontSize: 22 },
      );
      return;
    }
    this.mode = 'stop';
    saveJourney(this.journey);
    this.menu = new Menu(
      [
        { id: 'explore', label: `Explore ${CITIES[this.here].name}` },
        { id: 'hop', label: 'Sneak into the Yard' },
        { id: 'title', label: 'Quit to Title' },
      ],
      { x: PANEL.x + PANEL.w / 2, y: 520, rowH: 50, width: 290, fontSize: 21 },
    );
  }

  update(dt, input, pointer) {
    this.t += dt;

    if (input.pressed('back') || input.pressed('pause')) this.menu.select('title');
    const choice = this.menu.update(dt, input, pointer);
    if (!choice) return;

    if (choice === 'title') {
      // Progress is already saved at every stop.
      this.game.setScene(new TitleScene(this.game));
    } else if (choice === 'north' || choice === 'south') {
      this.journey.route = choice;
      this.enterStop();
    } else if (choice === 'explore') {
      this.game.setScene(new TownScene(this.game, this.journey, this.here));
    } else if (choice === 'hop') {
      this.game.setScene(new YardScene(this.game, this.journey));
    }
  }

  draw(ctx) {
    const { input } = this.game;

    // Sea and paper.
    ctx.fillStyle = '#26343a';
    ctx.fillRect(0, 0, W, H);
    this.drawMap(ctx);

    // Header.
    ctx.save();
    ctx.fillStyle = COLORS.cream;
    ctx.font = `40px ${FONTS.title}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('Hobo Quest', 28, 44);
    ctx.font = `20px ${FONTS.body}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(244, 230, 200, 0.8)';
    const stats = [formatDate(this.journey.day)];
    if (this.journey.arrests) stats.push(`Arrests ${this.journey.arrests}`);
    ctx.fillText(stats.join('   '), W - 28, 46);
    ctx.restore();

    this.drawPanel(ctx);

    drawPrompts(ctx, input, [['confirm', 'Select']], W - 28, H - 14);
  }

  drawMap(ctx) {
    const sw = 1080 * S;
    const sh = 740 * S;

    if (this.land.complete && this.land.naturalWidth) {
      const dx = MAP_X - SRC_X * S;
      const dy = MAP_Y - SRC_Y * S;
      const dw = this.land.naturalWidth * S;
      const dh = this.land.naturalHeight * S;
      ctx.save();
      ctx.beginPath();
      ctx.rect(MAP_X - 10, MAP_Y - 10, sw + 20, sh + 10);
      ctx.clip();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(this.land, dx, dy, dw, dh);
      ctx.shadowColor = 'transparent';
      if (this.rails.complete) {
        ctx.globalAlpha = 0.28;
        ctx.drawImage(this.rails, dx, dy, dw, dh);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // Routes: when choosing, preview the highlighted one; otherwise the chosen one.
    const showing =
      this.mode === 'choose'
        ? ['north', 'south'].includes(this.menu.selected.id)
          ? this.menu.selected.id
          : null
        : this.journey.route;
    if (this.mode === 'choose') {
      for (const id of ['north', 'south']) if (id !== showing) this.strokeRoute(ctx, routePath(id), 0.25, true);
    }
    if (showing) this.strokeRoute(ctx, routePath(showing), this.mode === 'choose' ? 0.9 : 0.55, true);

    // Ridden so far: solid.
    if (this.journey.route) {
      const stops = this.stops;
      for (let i = 0; i < this.journey.stop; i++) this.strokeRoute(ctx, legPath(stops[i], stops[i + 1]), 1, false);
    }

    // Cities on the route(s) being shown.
    const cities = new Set(showing ? ROUTES[showing].stops : [...ROUTES.north.stops, ...ROUTES.south.stops]);
    if (this.mode === 'choose') for (const id of [...ROUTES.north.stops, ...ROUTES.south.stops]) cities.add(id);
    for (const id of cities) this.drawCity(ctx, id, showing && ROUTES[showing].stops.includes(id));

  }

  strokeRoute(ctx, pts, alpha, dashed) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ROUTE_INK;
    ctx.lineWidth = dashed ? 3 : 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dashed) ctx.setLineDash([8, 7]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = toScreen(p);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  }

  drawCity(ctx, id, onRoute) {
    const [x, y] = toScreen(CITIES[id].at);
    const isHere = id === this.here;
    ctx.save();
    if (isHere) {
      const pulse = (this.t * 1.2) % 1;
      ctx.strokeStyle = `rgba(158, 43, 37, ${1 - pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7 + pulse * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = onRoute || isHere ? '#1a1110' : 'rgba(26,17,16,0.4)';
    ctx.beginPath();
    ctx.arc(x, y, isHere ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();

    const [dx, dy, align] = LABELS[id];
    ctx.font = `${isHere ? 'bold ' : ''}15px ${FONTS.body}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(236, 219, 182, 0.85)';
    ctx.strokeText(CITIES[id].name, x + dx, y + dy);
    ctx.fillStyle = onRoute || isHere ? '#1a1110' : 'rgba(26,17,16,0.45)';
    ctx.fillText(CITIES[id].name, x + dx, y + dy);
    ctx.restore();
  }

  drawPanel(ctx) {
    const { x, y, w, h } = PANEL;
    panel(ctx, x, y, w, h);
    const cx = x + w / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.mode === 'choose') {
      heading(ctx, 'New York', cx, y + 50);
      wrap(ctx, CITIES.nyc.blurb, cx, y + 110, w - 50, 26, 19);
      ctx.fillStyle = COLORS.accent;
      ctx.font = `22px ${FONTS.body}`;
      ctx.fillText('Which way west?', cx, y + 240);
      const sel = this.menu.selected.id;
      if (sel === 'north' || sel === 'south') {
        const r = ROUTES[sel];
        wrap(ctx, r.pitch, cx, y + 280, w - 50, 24, 17, 'rgba(244, 230, 200, 0.8)');
      }
      this.menu.draw(ctx, this.t);
    } else if (this.mode === 'stop') {
      const stops = this.stops;
      const i = this.journey.stop;
      heading(ctx, CITIES[stops[i]].name, cx, y + 50);
      wrap(ctx, CITIES[stops[i]].blurb, cx, y + 110, w - 50, 26, 19);
      const next = stops[i + 1];
      ctx.fillStyle = COLORS.accent;
      ctx.font = `20px ${FONTS.body}`;
      ctx.fillText(`Next stop: ${CITIES[next].name}`, cx, y + 300);
      ctx.fillStyle = 'rgba(244, 230, 200, 0.7)';
      ctx.font = `18px ${FONTS.body}`;
      const days = legDays(stops[i], next);
      ctx.fillText(`About ${days} ${days === 1 ? 'day' : 'days'} by freight`, cx, y + 330);
      ctx.fillText(`Stop ${i + 1} of ${stops.length - 1} on the ${ROUTES[this.journey.route].name}`, cx, y + 360);
      this.menu.draw(ctx, this.t);
    } else if (this.mode === 'won') {
      heading(ctx, 'Los Angeles', cx, y + 50);
      wrap(ctx, CITIES.la.blurb, cx, y + 110, w - 50, 26, 19);
      ctx.fillStyle = COLORS.accent;
      ctx.font = `24px ${FONTS.body}`;
      ctx.fillText('You made it.', cx, y + 220);
      ctx.fillStyle = COLORS.cream;
      ctx.font = `19px ${FONTS.body}`;
      const j = this.journey;
      const lines = [
        `${j.day} days on the road`,
        `via the ${ROUTES[j.route].name}`,
        `${j.arrests} ${j.arrests === 1 ? 'arrest' : 'arrests'}`,
        `${j.missed} missed ${j.missed === 1 ? 'train' : 'trains'}`,
      ];
      lines.forEach((l, k) => ctx.fillText(l, cx, y + 280 + k * 32));
      this.menu.draw(ctx, this.t);
    }
    ctx.restore();
  }
}

function heading(ctx, text, x, y) {
  ctx.fillStyle = COLORS.accent;
  ctx.font = `34px ${FONTS.title}`;
  let size = 34;
  while (ctx.measureText(text).width > PANEL.w - 40 && size > 20) ctx.font = `${(size -= 2)}px ${FONTS.title}`;
  ctx.fillText(text, x, y);
}

function wrap(ctx, text, x, y, maxW, lineH, size, color = COLORS.cream) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONTS.body}`;
  const words = text.split(' ');
  let line = '';
  let row = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + row++ * lineH);
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y + row * lineH);
}
