// The party on screen: a row of portraits in the top-left status block, and
// the party screen they open (click or tap a portrait, I or Tab, Y on a
// controller, or Party in the pause menu).
//
// Each portrait carries its member's hunger as a ring that drains as they
// get hungrier: cream when fed, amber when hungry, red when starving, and
// pulsing when they're about to collapse.

import { drawPrompts } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { CHARACTERS } from '../characters/index.js';
import { hunger_fullness, hunger_tier } from '../systems/hunger.js';
import { inventory_free } from '../systems/inventory.js';
import { money_format } from '../systems/money.js';
import { panel } from '../scenes/title.js';
import { ITEMS } from '../items/index.js';

const RING = {
  fed: '#e8dcb8',
  hungry: '#e8a24a',
  starving: '#c8463d',
  collapse: '#e0302a',
};

// ------------------------------------------------------------- portraits

/** A member's face in a circle of radius r, with their hunger as a ring round it. */
export function drawPortrait(ctx, member, x, y, r, t = 0, { selected = false } = {}) {
  const c = CHARACTERS[member.id];
  const look = c?.look ?? {};
  const tier = hunger_tier(member.hunger);
  ctx.save();

  // The face, clipped to the circle.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#3a302a';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = look.coat ?? '#5d5348';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.95, r * 0.8, r * 0.55, 0, 0, Math.PI * 2); // shoulders
  ctx.fill();
  ctx.fillStyle = look.skin ?? '#d8b08a';
  ctx.fillRect(x - r * 0.12, y + r * 0.1, r * 0.24, r * 0.3); // neck
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.02, r * 0.34, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (look.hair) {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(x - r * 0.33, y, r * 0.1, 0, Math.PI * 2);
    ctx.arc(x + r * 0.33, y, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2a2420'; // eyes
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y - r * 0.02, r * 0.04, 0, Math.PI * 2);
  ctx.arc(x + r * 0.12, y - r * 0.02, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  drawHat(ctx, look.hat, x, y, r);
  ctx.restore();

  // The hunger ring: a dark track, the colour of their tier for how full they are.
  const ringW = Math.max(3, r * 0.16);
  ctx.lineWidth = ringW;
  ctx.strokeStyle = 'rgba(16, 10, 10, 0.75)';
  ctx.beginPath();
  ctx.arc(x, y, r + ringW / 2, 0, Math.PI * 2);
  ctx.stroke();
  const pulse = tier.id === 'collapse' ? 0.55 + 0.45 * Math.abs(Math.sin(t * 4)) : tier.id === 'starving' ? 0.75 + 0.25 * Math.abs(Math.sin(t * 2.5)) : 1;
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = RING[tier.id];
  ctx.lineCap = 'round';
  const full = hunger_fullness(member.hunger);
  ctx.beginPath();
  ctx.arc(x, y, r + ringW / 2, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, full) * Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (selected) {
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + ringW + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHat(ctx, hat, x, y, r) {
  ctx.fillStyle = hat === 'straw' ? '#d8c088' : hat === 'cloche' ? '#6a3a4a' : '#3a322b';
  if (hat === 'cap') {
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.3, r * 0.4, r * 0.2, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - r * 0.42, y - r * 0.32, r * 0.84, r * 0.1);
  } else if (hat === 'cloche') {
    ctx.beginPath();
    ctx.arc(x, y - r * 0.18, r * 0.42, Math.PI, 0);
    ctx.fill();
  } else if (hat === 'fedora' || hat === 'straw' || hat === 'bowler') {
    ctx.fillRect(x - r * 0.55, y - r * 0.32, r * 1.1, r * 0.09); // brim
    ctx.beginPath();
    if (hat === 'bowler') ctx.arc(x, y - r * 0.32, r * 0.3, Math.PI, 0);
    else ctx.rect(x - r * 0.3, y - r * 0.62, r * 0.6, r * 0.32);
    ctx.fill();
  }
}

// ------------------------------------------------------- the row of faces

// Where the row was drawn this frame, so a click or tap on a face can open
// the party screen (main.js checks this before the scene's update).
let rowHits = [];

/** Forget last frame's row (main.js, before drawing). */
export function party_row_reset() {
  rowHits = [];
}

/** The id of the member whose portrait is at (px, py), or null. */
export function party_row_hit(px, py) {
  return rowHits.find((h) => Math.hypot(px - h.x, py - h.y) <= h.r + 6)?.id ?? null;
}

/** The party's portraits in a row, the first centred at (x + r, y). Returns the row's width. */
export function drawPartyRow(ctx, journey, x, y, { r = 22, t = 0 } = {}) {
  const gap = r * 0.75;
  journey.party.forEach((member, i) => {
    const cx = x + r + i * (r * 2 + gap);
    drawPortrait(ctx, member, cx, y, r, t);
    rowHits.push({ id: member.id, x: cx, y, r });
  });
  return journey.party.length * (r * 2 + gap) - gap;
}

/** The status line under a place name: date and money. */
export function statusLine(date, journey) {
  return `${date}  ·  ${money_format(journey.money)}`;
}

// --------------------------------------------------------- party screen

const SLOT = 84;
const SLOT_GAP = 14;

/**
 * Who's in the party and what they carry. One member at a time, chosen
 * with left/right (or by clicking their face along the bottom).
 */
export class PartyScreen {
  constructor(game, journey, startId = null) {
    this.game = game;
    this.journey = journey;
    this.index = Math.max(0, journey.party.findIndex((m) => m.id === startId));
    this.t = 0;
    this.box = { x: W / 2 - 400, y: H / 2 - 250, w: 800, h: 480 };
  }

  get member() {
    return this.journey.party[this.index];
  }

  tabX(i) {
    const n = this.journey.party.length;
    return W / 2 + (i - (n - 1) / 2) * 70;
  }

  /** Returns 'close' when done. */
  update(dt, input, pointer) {
    this.t += dt;
    if (input.pressed('back') || input.pressed('pause') || input.pressed('party')) return 'close';
    const n = this.journey.party.length;
    if (input.repeat('left')) this.index = (this.index + n - 1) % n;
    if (input.repeat('right')) this.index = (this.index + 1) % n;
    if (pointer?.clicked) {
      const tabY = this.box.y + this.box.h - 52;
      this.journey.party.forEach((_, i) => {
        if (Math.hypot(pointer.x - this.tabX(i), pointer.y - tabY) < 30) this.index = i;
      });
    }
    return null;
  }

  draw(ctx) {
    const { x, y, w, h } = this.box;
    const member = this.member;
    const c = CHARACTERS[member.id];
    const tier = hunger_tier(member.hunger);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, x, y, w, h, '#1c1212');
    ctx.textBaseline = 'middle';

    // Heading.
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `30px ${FONTS.title}`;
    ctx.fillText('The Party', x + 40, y + 46);

    // Left: who they are, and how hungry.
    const px = x + 150;
    drawPortrait(ctx, member, px, y + 160, 70, this.t);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `28px ${FONTS.title}`;
    ctx.fillText(c?.name ?? member.id, px, y + 268);
    ctx.font = `19px ${FONTS.body}`;
    ctx.fillStyle = RING[tier.id];
    ctx.fillText(tier.label, px, y + 302);
    // A gauge of how full they are.
    ctx.fillStyle = 'rgba(244, 230, 200, 0.15)';
    ctx.fillRect(px - 80, y + 322, 160, 10);
    ctx.fillStyle = RING[tier.id];
    ctx.fillRect(px - 80, y + 322, 160 * hunger_fullness(member.hunger), 10);
    if (c?.bio) wrapCentre(ctx, c.bio, px, y + 360, 240, 22, `15px ${FONTS.body}`, 'rgba(244, 230, 200, 0.6)');

    // Right: what they carry, one thing to a slot.
    const sx = x + 330;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `22px ${FONTS.title}`;
    ctx.fillText('Carrying', sx, y + 104);
    member.inventory.forEach((item, i) => {
      const bx = sx + i * (SLOT + SLOT_GAP);
      const by = y + 132;
      ctx.fillStyle = 'rgba(244, 230, 200, 0.05)';
      ctx.fillRect(bx, by, SLOT, SLOT);
      ctx.strokeStyle = 'rgba(244, 230, 200, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash(item ? [] : [5, 5]);
      ctx.strokeRect(bx + 0.5, by + 0.5, SLOT - 1, SLOT - 1);
      ctx.setLineDash([]);
      if (item) {
        drawItemIcon(ctx, item, bx + SLOT / 2, by + SLOT / 2 - 8, SLOT * 0.32);
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.cream;
        ctx.font = `12px ${FONTS.body}`;
        ctx.fillText(ITEMS[item]?.name ?? item, bx + SLOT / 2, by + SLOT - 12, SLOT - 8);
        ctx.textAlign = 'left';
      }
    });
    ctx.font = `17px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.55)';
    const free = inventory_free(member);
    ctx.fillText(
      free === member.inventory.length ? 'Pockets empty.' : `${free} of ${member.inventory.length} slots free.`,
      sx,
      y + 250,
    );

    // Bottom: everyone in the party, to choose between.
    const tabY = y + h - 52;
    this.journey.party.forEach((m, i) => drawPortrait(ctx, m, this.tabX(i), tabY, 22, this.t, { selected: i === this.index }));
    ctx.restore();

    const prompts = this.journey.party.length > 1 ? [['move', 'Choose'], ['back', 'Close']] : [['back', 'Close']];
    drawPrompts(ctx, this.game.input, prompts, x + w - 30, y + h + 30);
  }
}

function wrapCentre(ctx, text, x, y, maxW, lineH, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
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
}

/** An item's picture, centred on (x, y), about s across. */
export function drawItemIcon(ctx, id, x, y, s) {
  ctx.save();
  switch (ITEMS[id]?.icon) {
    case 'can': {
      // A tin can: grey body, a paper label, rims.
      const w = s * 0.9;
      const h = s * 1.2;
      ctx.fillStyle = '#9a9a96';
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = '#b8483a';
      ctx.fillRect(x - w / 2, y - h * 0.28, w, h * 0.56);
      ctx.fillStyle = '#e8dcb8';
      ctx.fillRect(x - w * 0.3, y - h * 0.12, w * 0.6, h * 0.24);
      ctx.fillStyle = '#7a7a76';
      ctx.fillRect(x - w / 2 - 1, y - h / 2, w + 2, 3);
      ctx.fillRect(x - w / 2 - 1, y + h / 2 - 3, w + 2, 3);
      break;
    }
    default: {
      ctx.fillStyle = 'rgba(244, 230, 200, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
