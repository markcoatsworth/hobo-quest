// Button prompts that follow the device the player last used:
// Xbox-style face buttons for a gamepad, keycaps for the keyboard.

import { COLORS, FONTS } from './screen.js';

const PAD = {
  confirm: { label: 'A', color: '#5fa04e' },
  back: { label: 'B', color: '#c8463d' },
  sprint: { label: 'X', color: '#3d72c8' },
  pause: { label: '\u2261', color: '#6b6b6b' },
  move: { label: 'L', color: '#6b6b6b' },
};
const KEYS = {
  confirm: 'Enter',
  back: 'Esc',
  sprint: 'Shift',
  pause: 'Esc',
  move: 'WASD',
};

/**
 * Draw a row of prompts right-aligned at (right, y).
 * items: [['confirm', 'Select'], ['back', 'Back']]
 */
export function drawPrompts(ctx, input, items, right, y) {
  ctx.save();
  ctx.font = `20px ${FONTS.body}`;
  ctx.textBaseline = 'middle';
  let x = right;
  for (const [action, text] of [...items].reverse()) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.cream;
    ctx.fillText(text, x, y + 1);
    x -= ctx.measureText(text).width + 10;

    if (input.lastDevice === 'gamepad') {
      const b = PAD[action];
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(x - 14, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = `bold 16px Arial, sans-serif`;
      ctx.fillText(b.label, x - 14, y + 1);
      x -= 28;
    } else {
      const label = KEYS[action];
      ctx.font = `15px Arial, sans-serif`;
      const w = Math.max(28, ctx.measureText(label).width + 14);
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x - w, y - 13, w, 26, 4);
      ctx.stroke();
      ctx.fillStyle = COLORS.cream;
      ctx.textAlign = 'center';
      ctx.fillText(label, x - w / 2, y + 1);
      x -= w;
    }
    ctx.font = `20px ${FONTS.body}`;
    x -= 32;
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
