// The journey map: the rail network, where you are and the trail you've
// ridden. From here you explore the town or head for its yard; which way you
// go next is up to the freight you catch there. Reaching Los Angeles ends
// the game.

import { Menu } from '../core/menu.js';
import { drawPrompts } from '../core/prompts.js';
import { music_follow_trail } from '../core/music.js';
import { clearJourney, GOAL_CITY, saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { LOCATIONS } from '../locations/index.js';
import { rail_leg_days } from '../systems/rail.js';
import { panel, TitleScene } from './title.js';
import { PauseMenu } from '../ui/pause.js';
import { drawRailMap } from '../ui/railmap.js';
import { drawStatusPlate } from '../ui/status.js';
import { AreaScene } from './area.js';
import { YardScene } from './yard.js';

// Where the map sits on this screen (see src/ui/railmap.js).
const MAP_VIEW = { x: 24, y: 86, s: 0.82 };

const PANEL = { x: 930, y: 86, w: 326, h: 607 };

export class MapScene {
  constructor(game, journey) {
    this.game = game;
    this.journey = journey;
    this.t = 0;

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

    // Status top left (src/ui/status.js); it opens the journal.
    drawStatusPlate(ctx, this.journey, { title: LOCATIONS[this.here].name, t: this.t });

    this.drawPanel(ctx);

    drawPrompts(ctx, input, [['confirm', 'Select'], ['pause', 'Menu']], W - 28, H - 14);
    if (this.paused) this.paused.draw(ctx);
  }

  drawMap(ctx) {
    drawRailMap(ctx, this.journey, MAP_VIEW, this.t);
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
        // Where the freights go, not which is which: that's for the yard.
        ctx.fillText('Freights out of the yard', cx, y + 270);
        ctx.font = `18px ${FONTS.body}`;
        this.trains.forEach((t, k) => {
          const days = rail_leg_days(this.here, t.to);
          ctx.fillStyle = COLORS.cream;
          const label = `${LOCATIONS[t.to].name}, ${days} ${days === 1 ? 'day' : 'days'}`;
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
