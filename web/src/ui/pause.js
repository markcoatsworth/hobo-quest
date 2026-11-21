// The pause menu, the same everywhere you can pause: Resume, Journal (when
// there's a journey on), Settings, then whatever the scene adds (Quit to
// Title). Opened with
// Start on a controller, Esc or P on a keyboard; Start, Esc or B closes it.

import { Menu } from '../core/menu.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { panel } from '../scenes/title.js';
import { SettingsPanel } from './settings.js';
import { Journal } from './journal.js';

export class PauseMenu {
  /**
   * items: the scene's own choices after Resume and Settings, [{ id, label }].
   * resume: the label for carrying on (default 'Resume').
   */
  constructor(game, items, { resume = 'Resume' } = {}) {
    this.game = game;
    this.journey = game.scene?.journey?.party ? game.scene.journey : null;
    const all = [
      { id: 'resume', label: resume },
      ...(this.journey ? [{ id: 'journal', label: 'Journal' }] : []),
      { id: 'settings', label: 'Settings' },
      ...items,
    ];
    this.h = 120 + all.length * 54;
    this.y = (H - this.h) / 2;
    this.menu = new Menu(all, { x: W / 2, y: this.y + 110, rowH: 54, width: 340, fontSize: 28 });
    this.sub = null; // Settings or the journal, open over the menu
    this.t = 0;
  }

  /** Returns 'resume', one of the scene's item ids, or null. */
  update(dt, input, pointer) {
    this.t += dt;
    if (this.sub) {
      if (this.sub.update(dt, input, pointer) === 'close') this.sub = null;
      return null;
    }
    if (input.pressed('pause') || input.pressed('back')) return 'resume';
    const choice = this.menu.update(dt, input, pointer);
    if (choice === 'settings') {
      this.sub = new SettingsPanel(this.game);
      return null;
    }
    if (choice === 'journal') {
      this.sub = new Journal(this.game, this.journey);
      return null;
    }
    return choice;
  }

  draw(ctx) {
    if (this.sub) {
      this.sub.draw(ctx);
      return;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, W / 2 - 230, this.y, 460, this.h, '#1c1212');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `32px ${FONTS.title}`;
    ctx.fillText('Paused', W / 2, this.y + 52);
    ctx.restore();
    this.menu.draw(ctx, this.t);
  }
}
