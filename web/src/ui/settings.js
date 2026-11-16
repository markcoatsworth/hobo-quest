// The Settings panel: music volume, mute, controller rumble, full screen.
// Opened from the title screen, any pause menu, or the gear in the corner.
// Up/down picks a row, left/right (or confirm) changes it, back closes.
// Changes apply and save immediately (src/core/settings.js).

import { drawPrompts } from '../core/prompts.js';
import { MUSIC_STEPS, settings_get, settings_set } from '../core/settings.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { panel } from '../scenes/title.js';

const ROW_H = 58;
const PANEL_W = 680;
const VALUE_X = W / 2 + 70; // left edge of the values column

function fullscreenOn() {
  return !!document.fullscreenElement;
}

function toggleFullscreen() {
  if (fullscreenOn()) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

export class SettingsPanel {
  constructor(game) {
    this.game = game;
    this.rows = [
      { id: 'music', label: 'Music volume' },
      { id: 'muted', label: 'Mute music' },
      { id: 'rumble', label: 'Controller rumble' },
    ];
    if (document.fullscreenEnabled) this.rows.push({ id: 'fullscreen', label: 'Full screen' });
    this.rows.push({ id: 'done', label: 'Done' });
    this.index = 0;
    this.t = 0;
    const h = 150 + this.rows.length * ROW_H;
    this.box = { x: W / 2 - PANEL_W / 2, y: (H - h) / 2 - 10, w: PANEL_W, h };
  }

  rowY(i) {
    return this.box.y + 120 + i * ROW_H;
  }

  /** Change a row's value: dir -1 / +1 for left / right, 0 for confirm. */
  change(id, dir) {
    const s = settings_get();
    if (id === 'music') {
      const step = dir === 0 ? (s.music >= MUSIC_STEPS ? -MUSIC_STEPS : 1) : dir;
      settings_set('music', Math.max(0, Math.min(MUSIC_STEPS, s.music + step)));
      if (s.muted) settings_set('muted', false); // turning it up means you want to hear it
    } else if (id === 'muted' || id === 'rumble') {
      settings_set(id, !s[id]);
      if (id === 'rumble' && !s.rumble) this.game.input.rumble(120, 0.4, 0.6);
    } else if (id === 'fullscreen') {
      toggleFullscreen();
    }
  }

  /** Returns 'close' when the panel should go away. */
  update(dt, input, pointer) {
    this.t += dt;
    if (input.pressed('back') || input.pressed('pause')) return 'close';
    const n = this.rows.length;
    if (input.repeat('up')) this.index = (this.index + n - 1) % n;
    if (input.repeat('down')) this.index = (this.index + 1) % n;

    // Mouse: hover picks the row; clicking the arrows steps, elsewhere toggles.
    if (pointer?.moved || pointer?.clicked) {
      const i = this.rows.findIndex((_, k) => Math.abs(pointer.y - this.rowY(k)) < ROW_H / 2 && Math.abs(pointer.x - W / 2) < PANEL_W / 2);
      if (i >= 0) this.index = i;
      if (pointer.clicked && i >= 0) {
        const id = this.rows[i].id;
        if (id === 'done') return 'close';
        if (id === 'music') this.change(id, pointer.x < VALUE_X + 30 ? -1 : pointer.x > VALUE_X + 220 ? 1 : 0);
        else this.change(id, 0);
        return null;
      }
    }

    const id = this.rows[this.index].id;
    if (input.pressed('confirm')) {
      if (id === 'done') return 'close';
      this.change(id, 0);
    } else if (id !== 'done') {
      if (input.repeat('left')) this.change(id, -1);
      else if (input.repeat('right')) this.change(id, 1);
    }
    return null;
  }

  draw(ctx) {
    const s = settings_get();
    const { x, y, w, h } = this.box;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, x, y, w, h, '#1c1212');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `36px ${FONTS.title}`;
    ctx.fillText('Settings', W / 2, y + 60);

    this.rows.forEach((row, i) => {
      const cy = this.rowY(i);
      const sel = i === this.index;
      if (sel) {
        ctx.fillStyle = COLORS.highlight;
        ctx.fillRect(x + 30, cy - ROW_H / 2 + 6, w - 60, ROW_H - 12);
      }
      ctx.font = `24px ${FONTS.body}`;
      ctx.fillStyle = sel ? COLORS.accent : COLORS.cream;
      if (row.id === 'done') {
        ctx.textAlign = 'center';
        ctx.fillText(row.label, W / 2, cy + 2);
        return;
      }
      ctx.textAlign = 'left';
      ctx.fillText(row.label, x + 60, cy + 2);

      if (row.id === 'music') {
        // Arrows either side of a row of bars.
        const dim = s.muted ? 0.35 : 1;
        drawArrow(ctx, VALUE_X + 12, cy, -1, sel ? COLORS.accent : COLORS.dim);
        for (let k = 0; k < MUSIC_STEPS; k++) {
          ctx.fillStyle = k < s.music ? `rgba(242, 184, 102, ${dim})` : 'rgba(244, 230, 200, 0.18)';
          ctx.fillRect(VALUE_X + 34 + k * 18, cy - 4 - k * 1.2, 12, 10 + k * 1.2);
        }
        drawArrow(ctx, VALUE_X + 228, cy, 1, sel ? COLORS.accent : COLORS.dim);
      } else {
        const on = row.id === 'fullscreen' ? fullscreenOn() : s[row.id];
        ctx.textAlign = 'center';
        ctx.fillStyle = on ? COLORS.accent : 'rgba(244, 230, 200, 0.6)';
        ctx.fillText(on ? 'On' : 'Off', VALUE_X + 120, cy + 2);
        if (sel) {
          drawArrow(ctx, VALUE_X + 70, cy, -1, COLORS.accent);
          drawArrow(ctx, VALUE_X + 170, cy, 1, COLORS.accent);
        }
      }
    });
    ctx.restore();

    drawPrompts(ctx, this.game.input, [['confirm', 'Change'], ['back', 'Done']], x + w - 30, y + h + 30);
  }
}

function drawArrow(ctx, x, y, dir, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 7 * dir, y);
  ctx.lineTo(x - 7 * dir, y - 9);
  ctx.lineTo(x - 7 * dir, y + 9);
  ctx.closePath();
  ctx.fill();
}
