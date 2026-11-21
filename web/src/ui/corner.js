// Mute and Settings buttons in the top-right corner, for mouse players.
// They only show while the mouse is the device in use: with a keyboard or
// controller, the same things are in the pause menu (and M mutes).

import { cursor_point } from '../core/cursor.js';
import { settings_get, settings_set } from '../core/settings.js';
import { W } from '../core/screen.js';

const R = 19; // button radius
const Y = 32;
const BUTTONS = [
  { id: 'mute', x: W - 94 },
  { id: 'settings', x: W - 44 },
];

export class CornerButtons {
  constructor(game) {
    this.game = game;
    this.hover = null;
  }

  get visible() {
    return this.game.input.lastDevice === 'mouse';
  }

  /** Handles a click on a button; returns true if it took the click. */
  update(pointer) {
    this.hover = null;
    if (!this.visible || pointer.x < 0) return false;
    const hit = BUTTONS.find((b) => Math.hypot(pointer.x - b.x, pointer.y - Y) < R + 4);
    this.hover = hit?.id ?? null;
    if (hit) cursor_point();
    if (!hit || !pointer.clicked) return false;
    if (hit.id === 'mute') toggleMute(this.game);
    else this.game.openSettings();
    return true;
  }

  draw(ctx) {
    if (!this.visible) return;
    const muted = settings_get().muted;
    ctx.save();
    for (const b of BUTTONS) {
      const hot = this.hover === b.id;
      ctx.fillStyle = hot ? 'rgba(40, 28, 22, 0.85)' : 'rgba(16, 10, 10, 0.55)';
      ctx.beginPath();
      ctx.arc(b.x, Y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hot ? 'rgba(242, 184, 102, 0.9)' : 'rgba(244, 230, 200, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const ink = hot ? '#f2b866' : 'rgba(244, 230, 200, 0.85)';
      if (b.id === 'mute') drawSpeaker(ctx, b.x, Y, ink, muted);
      else drawGear(ctx, b.x, Y, ink);
    }
    ctx.restore();
  }
}

/** Mute or unmute the music, with a word on screen to say which. */
export function toggleMute(game) {
  const muted = !settings_get().muted;
  settings_set('muted', muted);
  game.toast = { text: muted ? 'Music muted' : 'Music on', t: 1.6 };
}

function drawSpeaker(ctx, x, y, ink, muted) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 4);
  ctx.lineTo(x - 5, y - 4);
  ctx.lineTo(x + 2, y - 10);
  ctx.lineTo(x + 2, y + 10);
  ctx.lineTo(x - 5, y + 4);
  ctx.lineTo(x - 10, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x + 3, y, 6, -0.8, 0.8);
  ctx.moveTo(x + 3 + 10 * Math.cos(-0.8), y + 10 * Math.sin(-0.8));
  ctx.arc(x + 3, y, 10, -0.8, 0.8);
  ctx.stroke();
  if (muted) {
    // A "no" slash straight across the button.
    const d = R * 0.72;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - d, y - d);
    ctx.lineTo(x + d, y + d);
    ctx.stroke();
  }
}

function drawGear(ctx, x, y, ink) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  const teeth = 8;
  for (let k = 0; k < teeth * 2; k++) {
    const a = (k * Math.PI) / teeth;
    const r = k % 2 ? 8 : 11;
    const a0 = a - Math.PI / teeth / 2;
    const a1 = a + Math.PI / teeth / 2;
    ctx.lineTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
    ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(16, 10, 10, 0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}
