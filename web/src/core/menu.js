// A vertical list of options driven by actions (up/down/confirm) and,
// as a convenience, the mouse. Disabled items are drawn greyed out and
// skipped by the cursor.

import { COLORS, FONTS } from './screen.js';

export class Menu {
  /**
   * items: [{ id, label, disabled? }]
   * layout: { x (centre), y (first row centre), rowH, width, fontSize }
   */
  constructor(items, layout) {
    this.items = items;
    this.layout = { rowH: 58, width: 360, fontSize: 34, ...layout };
    this.index = this.items.findIndex((it) => !it.disabled);
    this.flash = 0; // brief highlight pulse on activation
  }

  get selected() {
    return this.items[this.index];
  }

  select(id) {
    const i = this.items.findIndex((it) => it.id === id && !it.disabled);
    if (i >= 0) this.index = i;
  }

  move(step) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (((this.index + step * k) % n) + n) % n;
      if (!this.items[i].disabled) {
        const changed = i !== this.index;
        this.index = i;
        return changed;
      }
    }
    return false;
  }

  rowRect(i) {
    const { x, y, rowH, width } = this.layout;
    return { x: x - width / 2, y: y + i * rowH - rowH / 2, w: width, h: rowH };
  }

  hit(px, py) {
    return this.items.findIndex((it, i) => {
      const r = this.rowRect(i);
      return !it.disabled && px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    });
  }

  /** Returns the activated item's id, or null. */
  update(dt, input, pointer) {
    this.flash = Math.max(0, this.flash - dt);
    if (input.repeat('up')) this.move(-1);
    if (input.repeat('down')) this.move(1);

    if (pointer?.moved) {
      const i = this.hit(pointer.x, pointer.y);
      if (i >= 0) this.index = i;
    }
    const clicked = pointer?.clicked && this.hit(pointer.x, pointer.y) === this.index;

    if (input.pressed('confirm') || clicked) {
      this.flash = 0.25;
      input.rumble();
      return this.selected.id;
    }
    return null;
  }

  draw(ctx, t) {
    const { x, rowH, width, fontSize } = this.layout;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize}px ${FONTS.body}`;

    this.items.forEach((item, i) => {
      const r = this.rowRect(i);
      const cy = r.y + rowH / 2;
      const isSel = i === this.index;

      if (isSel) {
        ctx.fillStyle = this.flash > 0 ? 'rgba(242, 184, 102, 0.4)' : COLORS.highlight;
        ctx.fillRect(r.x, r.y + 6, width, rowH - 12);
        // Pointer arrows either side, nudging gently.
        const bob = Math.sin(t * 6) * 3;
        const half = ctx.measureText(item.label).width / 2;
        ctx.fillStyle = COLORS.accent;
        arrow(ctx, x - half - 26 + bob, cy, 1);
        arrow(ctx, x + half + 26 - bob, cy, -1);
      }

      ctx.fillStyle = item.disabled ? COLORS.dim : isSel ? COLORS.accent : COLORS.cream;
      ctx.fillText(item.label, x, cy + 2);
    });
    ctx.restore();
  }
}

function arrow(ctx, x, y, dir) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 12 * dir, y - 9);
  ctx.lineTo(x - 12 * dir, y + 9);
  ctx.closePath();
  ctx.fill();
}
