// Conversations, the same everywhere: talking to someone on a street, a
// description of something you look at, someone who stops Scout in a rail
// yard. A scene only starts one (dialog_open); from there the dialog is the
// game's overlay (main.js), like the journal: the scene holds still under
// it (no clock, no trains, no bulls, nobody walking) until it's done.
//
// A conversation is a list of lines. A line is a string, said by whoever
// you're talking with, or { by: <character id>, text } for someone else in
// it (Scout answering). Confirm or act (Enter / Space, A) goes on to the
// next line; back (Esc / Backspace, B) ends it early.
//
// Faces: only whoever is speaking, in a round frame half over the box's
// edge: Scout on the left, with their words left-aligned; whoever Scout is
// talking with on the right (`who`: their character id, for their
// headshot; anyone without one yet gets a plain grey head), with their
// name and words right-aligned. Things described rather than said
// (`quoted: false`) have no face: nobody's speaking.
//
// How it ends is part of it too:
//   joins: a character id. They join the party (and the journey is saved),
//          however the conversation ended, with the same word on screen
//          wherever it happens.
//   onEnd(finished): anything else the scene wants; finished is true when
//          every line was read (an item is only taken if you looked all the
//          way through).

import { drawPrompts } from '../core/prompts.js';
import { saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { CHARACTERS, PLAYER } from '../characters/index.js';
import { party_join } from '../systems/party.js';
import { panel } from '../scenes/title.js';
import { drawHead } from './party.js';

const BOX = { x: 120, y: 76, w: W - 240, h: 164 };
const FACE_R = 56; // centred on the box's edge: half in, half out
const PAD = 30; // text in from the box's sides
const FACE_PAD = FACE_R + 26; // text in from the side with a face on it

/**
 * Start a conversation over whatever's on screen.
 *   name:    who's speaking (or what's being described)
 *   who:     their character id, for their headshot (null: a grey head)
 *   lines:   [...], as above
 *   quoted:  false for things described rather than said (a sign, a
 *            cupboard): no quotation marks
 *   joins, journey: someone joining the party at the end, and the journey
 *            they join
 *   onEnd(finished)
 */
export function dialog_open(game, opts) {
  game.overlay = new Dialog(game, opts);
}

export class Dialog {
  constructor(game, { name, who = null, lines, quoted = true, joins = null, journey = null, onEnd = null }) {
    this.game = game;
    this.name = name;
    this.who = who ?? joins;
    this.lines = lines;
    this.quoted = quoted;
    this.joins = joins;
    this.journey = journey;
    this.onEnd = onEnd;
    this.line = 0;
  }

  /** Returns 'close' when it's over. */
  update(dt, input) {
    if (input.pressed('back')) return this.end(false);
    if (input.pressed('confirm') || input.pressed('act')) {
      this.line++;
      if (this.line >= this.lines.length) return this.end(true);
    }
    return null;
  }

  end(finished) {
    if (this.joins && this.journey && party_join(this.journey, this.joins)) {
      saveJourney(this.journey);
      this.game.toast = { text: `${CHARACTERS[this.joins].name} joins the party.`, t: 3.5 };
    }
    this.onEnd?.(finished);
    return 'close';
  }

  /** The line showing now: { by (a name), id (their character id, or null), text }. */
  current() {
    const line = this.lines[this.line];
    if (typeof line === 'object') return { by: CHARACTERS[line.by]?.name ?? line.by, id: line.by, text: line.text };
    return { by: this.name, id: this.who, text: line };
  }

  draw(ctx) {
    const { by, id, text } = this.current();
    // Who's speaking, and so which side: Scout on the left, anyone else on
    // the right; nobody, for a description.
    const side = !this.quoted ? null : id === PLAYER ? 'left' : 'right';
    // Up top, clear of the ground, so you can see who's talking.
    panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h, '#1c1212');
    const cy = BOX.y + BOX.h / 2;
    if (side) drawFace(ctx, CHARACTERS[id]?.look ?? null, side === 'left' ? BOX.x : BOX.x + BOX.w, cy);

    const left = BOX.x + (side === 'left' ? FACE_PAD : PAD);
    const right = BOX.x + BOX.w - (side === 'right' ? FACE_PAD : PAD);
    const align = side === 'right' ? 'right' : 'left';
    const x = align === 'right' ? right : left;
    ctx.save();
    ctx.fillStyle = COLORS.accent;
    ctx.font = `22px ${FONTS.title}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(by, x, BOX.y + 34);
    wrap(ctx, this.quoted ? `“${text}”` : text, x, BOX.y + 74, right - left, 28, `20px ${FONTS.body}`, COLORS.cream, align);
    ctx.restore();
    drawPrompts(ctx, this.game.input, [['confirm', 'Next'], ['back', 'Done']], W - 24, H - 22);
  }
}

/** The speaker's headshot in its round frame, centred at (x, y). */
function drawFace(ctx, look, x, y) {
  ctx.save();
  // A dark disc first, so the frame sits cleanly over the box's edge.
  ctx.fillStyle = '#1c1212';
  ctx.beginPath();
  ctx.arc(x, y, FACE_R + 5, 0, Math.PI * 2);
  ctx.fill();
  drawHead(ctx, look, x, y, FACE_R);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.accent;
  ctx.beginPath();
  ctx.arc(x, y, FACE_R + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Text wrapped to maxW, each line aligned to x ('left' or 'right'). */
function wrap(ctx, text, x, y, maxW, lineH, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
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
