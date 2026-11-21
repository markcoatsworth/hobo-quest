// Scout's journal: one screen with tabs, for everything you look at rather
// than do. Opened from the status plate (click or tap it), I or Tab, Y on a
// controller, or Journal in the pause menu, wherever there's a journey on.
//
//   Party      who's with you, how hungry, what they carry (src/ui/party.js)
//   Map        the rail network, to look at only: no travelling from here
//   Notebook   what Scout has found out in each rail yard
//
// Q / E (LB / RB) or a click on a tab switches tabs; left / right moves
// within one; back, pause or the journal key closes it. New things to look
// at go here as another tab, not on the screen's corners.

import { cursor_point } from '../core/cursor.js';
import { drawPrompts } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { LOCATIONS } from '../locations/index.js';
import { rail_leg_days } from '../systems/rail.js';
import { panel } from '../scenes/title.js';
import { yard_clock, yard_known } from '../scenes/yard.js';
import { PartyTab } from './party.js';
import { drawRailMap, MAP_SRC_W, MAP_SRC_H } from './railmap.js';
import { drawBook } from './status.js';

const TABS = [
  { id: 'party', label: 'Party' },
  { id: 'map', label: 'Map' },
  { id: 'notebook', label: 'Notebook' },
];

const BOX = { x: 160, y: 54, w: 960, h: 600 };
const TAB_W = 150;
const TAB_H = 42;
// The page under the tabs.
const PAGE = { x: BOX.x + 24, y: BOX.y + 78, w: BOX.w - 48, h: BOX.h - 100 };

const CLOCK_START = 21 * 60; // the yard clock starts at 9 p.m. (src/scenes/yard.js)

export class Journal {
  constructor(game, journey, { tab = 'party', member = null } = {}) {
    this.game = game;
    this.journey = journey;
    this.tab = Math.max(0, TABS.findIndex((t) => t.id === tab));
    this.party = new PartyTab(journey, member);
    this.t = 0;
  }

  tabX(i) {
    return BOX.x + 40 + i * (TAB_W + 8);
  }

  /** Returns 'close' when done. */
  update(dt, input, pointer) {
    this.t += dt;
    if (input.pressed('back') || input.pressed('pause') || input.pressed('party')) return 'close';
    if (input.pressed('prevTab')) this.tab = (this.tab + TABS.length - 1) % TABS.length;
    if (input.pressed('nextTab')) this.tab = (this.tab + 1) % TABS.length;
    const ty = BOX.y + 18;
    const overTab = (i) => pointer && pointer.x >= this.tabX(i) && pointer.x <= this.tabX(i) + TAB_W && pointer.y >= ty && pointer.y <= ty + TAB_H;
    if (TABS.some((_, i) => i !== this.tab && overTab(i))) cursor_point();
    if (pointer?.clicked) {
      TABS.forEach((_, i) => {
        if (overTab(i)) {
          this.tab = i;
          pointer.clicked = false;
        }
      });
      // A click outside the journal closes it.
      if (pointer.clicked && (pointer.x < BOX.x || pointer.x > BOX.x + BOX.w || pointer.y < BOX.y || pointer.y > BOX.y + BOX.h)) return 'close';
    }
    if (TABS[this.tab].id === 'party') this.party.update(dt, input, pointer, PAGE);
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h, '#1c1212');

    // The tabs, along the top like the tabs on a notebook's pages.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    TABS.forEach((tab, i) => {
      const x = this.tabX(i);
      const y = BOX.y + 18;
      const on = i === this.tab;
      ctx.fillStyle = on ? 'rgba(230, 180, 90, 0.18)' : 'rgba(244, 230, 200, 0.05)';
      ctx.beginPath();
      ctx.roundRect(x, y, TAB_W, TAB_H, 6);
      ctx.fill();
      ctx.strokeStyle = on ? COLORS.accent : 'rgba(244, 230, 200, 0.25)';
      ctx.lineWidth = on ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = on ? COLORS.accent : 'rgba(244, 230, 200, 0.7)';
      ctx.font = `22px ${FONTS.title}`;
      ctx.fillText(tab.label, x + TAB_W / 2, y + TAB_H / 2 + 1);
    });
    drawBook(ctx, BOX.x + BOX.w - 40, BOX.y + 39, 0.9, 1.4);
    ctx.restore();

    const id = TABS[this.tab].id;
    if (id === 'party') this.party.draw(ctx, PAGE, this.t);
    else if (id === 'map') this.drawMap(ctx);
    else this.drawNotebook(ctx);

    // In the tab row, clear of the scene's own prompts along the bottom.
    drawPrompts(ctx, this.game.input, [['tabs', 'Pages'], ['back', 'Close']], BOX.x + BOX.w - 76, BOX.y + 39);
    // The page's own, at its foot (choosing a member, by their faces).
    if (id === 'party' && this.party.prompts().length) drawPrompts(ctx, this.game.input, this.party.prompts(), PAGE.x + PAGE.w - 10, PAGE.y + PAGE.h - 52);
  }

  // ------------------------------------------------------------- map tab

  drawMap(ctx) {
    const j = this.journey;
    // Room to the east of the map for the labels along the coast.
    const s = Math.min(640 / MAP_SRC_W, (PAGE.h - 20) / MAP_SRC_H);
    const mapW = MAP_SRC_W * s + 56;
    const view = { x: PAGE.x + 10, y: PAGE.y + 30, s };
    ctx.save();
    ctx.fillStyle = '#26343a';
    ctx.beginPath();
    ctx.roundRect(PAGE.x, PAGE.y, mapW, PAGE.h, 6);
    ctx.fill();
    ctx.clip();
    drawRailMap(ctx, j, view, this.t);
    ctx.restore();

    // Beside it: where you are, the way on, and the road so far.
    const x = PAGE.x + mapW + 24;
    const right = PAGE.x + PAGE.w;
    const here = LOCATIONS[j.at];
    let y = PAGE.y + 18;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(244, 230, 200, 0.55)';
    ctx.font = `15px ${FONTS.body}`;
    ctx.fillText('You are in', x, y);
    ctx.fillStyle = COLORS.accent;
    ctx.font = `28px ${FONTS.title}`;
    ctx.fillText(here.name, x, (y += 32), right - x);

    const out = here.yard?.trains ?? [];
    y += 46;
    ctx.fillStyle = COLORS.cream;
    ctx.font = `19px ${FONTS.title}`;
    ctx.fillText(out.length ? 'Freights out of here' : 'No freights out of here', x, y);
    ctx.font = `16px ${FONTS.body}`;
    for (const t of out) {
      const days = rail_leg_days(j.at, t.to);
      ctx.fillStyle = 'rgba(244, 230, 200, 0.85)';
      ctx.fillText(`${LOCATIONS[t.to].name}`, x, (y += 28));
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(244, 230, 200, 0.55)';
      ctx.fillText(`${days} ${days === 1 ? 'day' : 'days'}`, right, y);
      ctx.textAlign = 'left';
    }

    y += 52;
    ctx.fillStyle = COLORS.cream;
    ctx.font = `19px ${FONTS.title}`;
    ctx.fillText('The road so far', x, y);
    ctx.font = `16px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.85)';
    const rides = j.trail.length - 1;
    const lines = [
      `Day ${j.day}`,
      `${rides} ${rides === 1 ? 'freight' : 'freights'} ridden`,
      ...(j.arrests ? [`${j.arrests} ${j.arrests === 1 ? 'arrest' : 'arrests'}`] : []),
      ...(j.missed ? [`${j.missed} missed ${j.missed === 1 ? 'train' : 'trains'}`] : []),
    ];
    for (const l of lines) ctx.fillText(l, x, (y += 26));

    // The key, at the foot.
    const ky = PAGE.y + PAGE.h - 46;
    const key = (yy, dashed, alpha, text) => {
      ctx.save();
      ctx.strokeStyle = '#c0453a';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = dashed ? 3 : 4.5;
      ctx.lineCap = 'round';
      if (dashed) ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 34, yy);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(244, 230, 200, 0.6)';
      ctx.font = `14px ${FONTS.body}`;
      ctx.fillText(text, x + 46, yy);
    };
    key(ky, false, 1, 'ridden');
    key(ky + 26, true, 0.9, 'a line out of here');
    ctx.restore();
  }

  // -------------------------------------------------------- notebook tab

  /** What's written down, a page per yard: [{ city, lines: [[text, faint?]] }]. */
  notebook() {
    const notes = this.journey.yardNotes ?? {};
    // Where you are first, then the rest in the order you passed through.
    const order = [this.journey.at, ...[...this.journey.trail].reverse()];
    const cities = [...new Set(order)].filter((id) => notes[id]);
    for (const id of Object.keys(notes)) if (!cities.includes(id)) cities.push(id);
    const entries = [];
    for (const city of cities) {
      const n = notes[city];
      const yard = LOCATIONS[city]?.yard;
      if (!yard) continue;
      const mainLine = yard.tracks.length + 1;
      const trains = yard.trains.map((def) => ({ def, track: def.track ?? mainLine, number: def.number }));
      const lines = [];
      for (const t of [...trains].sort((a, b) => a.track - b.track)) {
        const known = yard_known(n, t);
        const plate = n.plates[t.track];
        if (known) lines.push([`Track ${t.track}: ${LOCATIONS[known.to].name}${plate ? `  (No. ${plate})` : ''}`]);
        else if (plate) lines.push([`Track ${t.track}: engine No. ${plate}, bound for ?`]);
      }
      if (n.board) {
        lines.push(['The board in the office window:', true]);
        for (const t of [...trains].sort((a, b) => a.def.departs - b.def.departs)) {
          lines.push([`  No. ${t.number}  ${LOCATIONS[t.def.to].name}  ${yard_clock(CLOCK_START + t.def.departs)}`, true]);
        }
      }
      if (lines.length) entries.push({ city, lines });
    }
    return entries;
  }

  drawNotebook(ctx) {
    const entries = this.notebook();
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (!entries.length) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(244, 230, 200, 0.6)';
      ctx.font = `20px ${FONTS.body}`;
      const cx = PAGE.x + PAGE.w / 2;
      ctx.fillText('Nothing written down yet.', cx, PAGE.y + PAGE.h / 2 - 30);
      ctx.font = `16px ${FONTS.body}`;
      ctx.fillText('In a rail yard, read what you can: the cards tacked to the cars,', cx, PAGE.y + PAGE.h / 2 + 10);
      ctx.fillText('the engines’ number plates, the board in the yard office window.', cx, PAGE.y + PAGE.h / 2 + 34);
      ctx.restore();
      return;
    }
    // A column per yard, three across; what doesn't fit waits for more
    // pages (not needed yet: a yard's notes are a handful of lines).
    const colW = (PAGE.w - 40) / 3;
    entries.slice(0, 6).forEach((e, i) => {
      const x = PAGE.x + 10 + (i % 3) * (colW + 10);
      let y = PAGE.y + 20 + Math.floor(i / 3) * (PAGE.h / 2);
      ctx.fillStyle = e.city === this.journey.at ? COLORS.accent : COLORS.cream;
      ctx.font = `22px ${FONTS.title}`;
      ctx.fillText(`${LOCATIONS[e.city].name} Yard`, x, y, colW - 10);
      ctx.strokeStyle = 'rgba(244, 230, 200, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x + colW - 20, y + 18);
      ctx.stroke();
      y += 22;
      for (const [text, faint] of e.lines.slice(0, 9)) {
        ctx.fillStyle = faint ? 'rgba(244, 230, 200, 0.6)' : 'rgba(244, 230, 200, 0.9)';
        ctx.font = `${faint ? 14 : 16}px ${FONTS.body}`;
        ctx.fillText(text, x, (y += 24), colW - 10);
      }
    });
    ctx.restore();
  }
}
