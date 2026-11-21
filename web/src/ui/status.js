// The status plate, top left on every screen with a journey on (town, yard,
// the ride, the map): on one framed backing, where you are with the date
// and money, then the party's faces; beside it, a button of its own for the
// journal.
//
//   [ where you are / the date and money   the party's faces ]  [journal]
//
// The words are pinned to the corner, so they never move; the faces follow,
// every member, nobody hidden. Click or tap the journal button, or anywhere
// on the plate, for the journal (a face opens it on that member).
//
// The top left is "you"; the top right is the system corner (mute,
// settings, the phone menu); the top centre is for the screen's own things
// (the yard clock, messages). Anything new to open goes in the journal as a
// tab, not on the plate.

import { COLORS, FONTS } from '../core/screen.js';
import { formatDateShort } from '../core/calendar.js';
import { money_format } from '../systems/money.js';
import { clock_format, clock_now, MINUTES_PER_DAY } from '../systems/clock.js';
import { drawPortrait } from './party.js';

const X = 14;
const Y = 8;
const H = 58;
const R = 18; // portrait radius
const FACE_STEP = R * 2 + 10;
const BOOK = H; // the journal button: square, as tall as the plate
const BOOK_GAP = 14; // between the plate and the button

// Where the plate, its faces and the journal button were drawn this frame,
// for main.js to test a click against before the scene sees it.
let hits = null;
let hovering = false;

/** Forget last frame's plate (main.js, before drawing). */
export function status_reset() {
  hits = null;
}

/** Whether the mouse is over the journal button (main.js, for its highlight). */
export function status_hover(px, py) {
  const b = hits?.book;
  hovering = !!b && px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

/**
 * What's at (px, py): { id } for a face, {} for the rest of the plate, or
 * null if the plate isn't there.
 */
export function status_hit(px, py) {
  if (!hits) return null;
  const { box, book, faces } = hits;
  const inside = (r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  if (inside(book)) return {};
  if (!inside(box)) return null;
  const face = faces.find((f) => Math.hypot(px - f.x, py - f.y) <= f.r + 4);
  return face ? { id: face.id } : {};
}

/**
 * Draw the plate. title: where you are ("Kansas City", "Kansas City Yard",
 * "Bound for Dallas"). alpha: for screens that fade their header in.
 * at: the moment to show (minutes, src/systems/clock.js), when the screen
 * keeps its own clock (the ride).
 */
export function drawStatusPlate(ctx, journey, { title, t = 0, alpha = 1, at = clock_now(journey) }) {
  const hot = hovering; // the mouse is over the journal button
  const party = journey.party ?? [];
  // The date and the time together, then the money.
  const day = Math.floor(at / MINUTES_PER_DAY) + 1;
  const line2 = `${formatDateShort(day)}, ${clock_format(at % MINUTES_PER_DAY)}  ·  ${money_format(journey.money)}`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `22px ${FONTS.title}`;
  const titleW = ctx.measureText(title).width;
  ctx.font = `16px ${FONTS.body}`;
  const textW = Math.max(titleW, ctx.measureText(line2).width);

  const tx = X + 16;
  const fx = tx + textW + 22; // the first face's left edge
  const facesW = party.length ? (party.length - 1) * FACE_STEP + R * 2 : 0;
  const w = fx + facesW + (party.length ? 14 : 0) - X;
  const bx = X + w + BOOK_GAP; // the journal button's left edge
  const cy = Y + H / 2;

  // The backing: dark, a thin cream rule, slightly rounded.
  ctx.fillStyle = 'rgba(16, 11, 10, 0.8)';
  ctx.beginPath();
  ctx.roundRect(X, Y, w, H, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 230, 200, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Where and when.
  ctx.fillStyle = COLORS.cream;
  ctx.font = `22px ${FONTS.title}`;
  ctx.fillText(title, tx, Y + 20);
  ctx.font = `16px ${FONTS.body}`;
  ctx.fillStyle = 'rgba(244, 230, 200, 0.75)';
  ctx.fillText(line2, tx, Y + 42);

  // Everyone in the party.
  const faces = party.map((member, i) => {
    const x = fx + R + i * FACE_STEP;
    drawPortrait(ctx, member, x, cy, R, t);
    return { id: member.id, x, y: cy, r: R };
  });

  // The journal: a button of its own, beside the plate.
  const by = cy - BOOK / 2;
  ctx.fillStyle = hot ? 'rgba(40, 28, 22, 0.9)' : 'rgba(16, 11, 10, 0.8)';
  ctx.beginPath();
  ctx.roundRect(bx, by, BOOK, BOOK, 8);
  ctx.fill();
  ctx.strokeStyle = hot ? 'rgba(242, 184, 102, 0.9)' : 'rgba(244, 230, 200, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawBook(ctx, bx + BOOK / 2, cy, 1, 2.3);
  ctx.restore();

  if (alpha > 0.5) hits = { box: { x: X, y: Y, w, h: H }, book: { x: bx, y: by, w: BOOK, h: BOOK }, faces };
  // Both together: what the plate takes up of the screen.
  return { x: X, y: Y, w: w + BOOK_GAP + BOOK, h: H };
}

/** A closed notebook with a strap, about 14 × 18, centred at (x, y). */
export function drawBook(ctx, x, y, alpha = 1, s = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Pages showing at the edge, then the cover over them.
  ctx.fillStyle = '#efe2c4';
  ctx.beginPath();
  ctx.roundRect(-6, -8, 13, 17, 2);
  ctx.fill();
  ctx.fillStyle = '#8a4a2e';
  ctx.beginPath();
  ctx.roundRect(-7, -9, 13, 17, 2);
  ctx.fill();
  ctx.fillStyle = '#5e2f1d';
  ctx.fillRect(-7, -9, 3, 17); // the spine
  ctx.fillStyle = '#d9b46a';
  ctx.fillRect(1, -9, 2, 17); // the strap
  ctx.restore();
}
