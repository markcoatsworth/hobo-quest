// The journey map: the rail network, where you are and the trail you've
// ridden. From here you explore the town or head for its yard; which way you
// go next is up to the freight you catch there. Reaching Los Angeles ends
// the game.

import { Menu } from '../core/menu.js';
import { drawPrompts } from '../core/prompts.js';
import { music_follow_trail } from '../core/music.js';
import { clearJourney, GOAL_CITY, saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { formatDate } from '../core/calendar.js';
import { LOCATIONS } from '../locations/index.js';
import { rail_leg_days, rail_leg_path, rail_lines } from '../systems/rail.js';
import { panel, TitleScene } from './title.js';
import { PauseMenu } from '../ui/pause.js';
import { drawPartyRow, statusLine } from '../ui/party.js';
import { AreaScene } from './area.js';
import { todaysTrain, YardScene } from './yard.js';

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
  new_york: [10, -6, 'left'],
  philadelphia: [10, 4, 'left'],
  washington_dc: [-10, 8, 'right'],
  cleveland: [6, 14, 'left'],
  chicago: [-8, 12, 'right'],
  kansas_city: [0, -12, 'center'],
  nashville: [10, 4, 'left'],
  clarksdale: [10, 10, 'left'],
  dallas: [0, 20, 'center'],
  el_paso: [0, -14, 'center'],
  phoenix: [0, 20, 'center'],
  los_angeles: [8, 18, 'left'],
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

    this.enter();
  }

  get here() {
    return this.journey.at;
  }

  /** The departing freights in this city's yard, in the yard's order. */
  get trains() {
    return LOCATIONS[this.here].yard?.trains ?? [];
  }

  enter() {
    music_follow_trail(this.journey.trail);
    if (this.here === GOAL_CITY) {
      this.mode = 'won';
      clearJourney();
      this.menu = new Menu(
        [
          { id: 'explore', label: `Explore ${LOCATIONS[this.here].name}` },
          { id: 'title', label: 'Back to Title' },
        ],
        { x: PANEL.x + PANEL.w / 2, y: 580, rowH: 50, width: 290, fontSize: 22 },
      );
      return;
    }
    this.mode = 'here';
    saveJourney(this.journey);
    const city = LOCATIONS[this.here];
    const items = [];
    // Areas that can be reached straight from the map, then the main street.
    for (const [id, area] of Object.entries(city.areas ?? {})) {
      if (area.mapLabel) items.push({ id: `area:${id}`, label: area.mapLabel });
    }
    items.push({ id: 'explore', label: city.town.mapLabel ?? `Explore ${city.name}` });
    // Some yards can only be reached through town.
    if (city.yard?.fromMap !== false) items.push({ id: 'hop', label: 'Sneak into the Yard', disabled: this.trains.length === 0 });
    items.push({ id: 'title', label: 'Quit to Title' });
    this.menu = new Menu(
      items,
      { x: PANEL.x + PANEL.w / 2, y: 520, rowH: 50, width: 290, fontSize: 21 },
    );
  }

  update(dt, input, pointer) {
    this.t += dt;

    if (this.paused) {
      const choice = this.paused.update(dt, input, pointer);
      if (choice === 'resume') this.paused = null;
      else if (choice === 'title') this.game.setScene(new TitleScene(this.game));
      return;
    }
    if (input.pressed('pause')) {
      this.paused = new PauseMenu(this.game, [{ id: 'title', label: 'Quit to Title' }]);
      return;
    }
    if (input.pressed('back')) this.menu.select('title');
    const choice = this.menu.update(dt, input, pointer);
    if (!choice) return;

    if (choice === 'title') {
      // Progress is already saved at every stop.
      this.game.setScene(new TitleScene(this.game));
    } else if (choice.startsWith('area:')) {
      this.game.setScene(new AreaScene(this.game, this.journey, this.here, choice.slice(5)));
    } else if (choice === 'explore') {
      this.game.setScene(new AreaScene(this.game, this.journey, this.here));
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
    // Status beside the title; the top right is for the corner buttons.
    const titleW = ctx.measureText('Hobo Quest').width;
    ctx.font = `20px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.8)';
    const stats = [statusLine(formatDate(this.journey.day), this.journey)];
    if (this.journey.arrests) stats.push(`${this.journey.arrests} ${this.journey.arrests === 1 ? 'arrest' : 'arrests'}`);
    ctx.fillText(stats.join('  ·  '), 28 + titleW + 30, 47);
    drawPartyRow(ctx, this.journey, 34, 118, { r: 20, t: this.t });
    ctx.restore();

    this.drawPanel(ctx);

    drawPrompts(ctx, input, [['confirm', 'Select'], ['pause', 'Menu']], W - 28, H - 14);
    if (this.paused) this.paused.draw(ctx);
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

    // The whole network faintly, the lines out of here stronger, the trail
    // ridden so far solid.
    const out = this.trains.map((t) => t.to);
    for (const line of rail_lines()) {
      const fromHere = line.from === this.here && out.includes(line.to);
      this.strokeRoute(ctx, rail_leg_path(line.from, line.to), fromHere ? 0.85 : 0.25, true);
    }
    const trail = this.journey.trail;
    for (let i = 0; i < trail.length - 1; i++) this.strokeRoute(ctx, rail_leg_path(trail[i], trail[i + 1]), 1, false);

    // Every city; the ones reached, and the ones a freight from here goes to, in full ink.
    for (const id of Object.keys(LOCATIONS)) this.drawCity(ctx, id, trail.includes(id) || out.includes(id));
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
    const [x, y] = toScreen(LOCATIONS[id].at);
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
    ctx.strokeText(LOCATIONS[id].name, x + dx, y + dy);
    ctx.fillStyle = onRoute || isHere ? '#1a1110' : 'rgba(26,17,16,0.45)';
    ctx.fillText(LOCATIONS[id].name, x + dx, y + dy);
    ctx.restore();
  }

  drawPanel(ctx) {
    const { x, y, w, h } = PANEL;
    panel(ctx, x, y, w, h);
    const cx = x + w / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.mode === 'here') {
      const city = LOCATIONS[this.here];
      heading(ctx, city.name, cx, y + 50);
      wrap(ctx, city.blurb, cx, y + 110, w - 50, 26, 19);
      ctx.fillStyle = COLORS.accent;
      ctx.font = `20px ${FONTS.body}`;
      if (this.trains.length === 0) {
        ctx.fillText('No freights leave from here.', cx, y + 300);
      } else {
        ctx.fillText('Freights out of the yard', cx, y + 270);
        const today = todaysTrain(city.yard, this.journey.day);
        ctx.font = `18px ${FONTS.body}`;
        this.trains.forEach((t, k) => {
          const days = rail_leg_days(this.here, t.to);
          const isToday = t === today;
          ctx.fillStyle = isToday ? COLORS.cream : 'rgba(244, 230, 200, 0.5)';
          const label = `${LOCATIONS[t.to].name}, ${days} ${days === 1 ? 'day' : 'days'}${isToday ? ' (today)' : ''}`;
          ctx.fillText(label, cx, y + 304 + k * 28);
        });
        if (city.yard.fromMap === false) {
          ctx.fillStyle = 'rgba(244, 230, 200, 0.5)';
          ctx.font = `16px ${FONTS.body}`;
          ctx.fillText('The yard is through the city.', cx, y + 314 + this.trains.length * 28);
        }
      }
      this.menu.draw(ctx, this.t);
    } else if (this.mode === 'won') {
      heading(ctx, 'Los Angeles', cx, y + 50);
      wrap(ctx, LOCATIONS.los_angeles.blurb, cx, y + 110, w - 50, 26, 19);
      ctx.fillStyle = COLORS.accent;
      ctx.font = `24px ${FONTS.body}`;
      ctx.fillText('You made it.', cx, y + 220);
      ctx.fillStyle = COLORS.cream;
      ctx.font = `19px ${FONTS.body}`;
      const j = this.journey;
      const lines = [
        `${j.day} days on the road`,
        `${j.trail.length - 1} ${j.trail.length === 2 ? 'freight' : 'freights'} ridden`,
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
