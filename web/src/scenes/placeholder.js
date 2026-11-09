// Stand-in screen for menu options that aren't built yet.

import { drawPrompts } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { panel, TitleScene } from './title.js';

export class PlaceholderScene {
  constructor(game, { heading, body, returnTo }) {
    this.game = game;
    this.heading = heading;
    this.body = body;
    this.returnTo = returnTo;
  }

  update(dt, input, pointer) {
    if (input.pressed('back') || input.pressed('confirm') || pointer?.clicked) {
      this.game.setScene(new TitleScene(this.game, { select: this.returnTo }));
    }
  }

  draw(ctx) {
    this.game.backdrop.draw(ctx);
    panel(ctx, W / 2 - 400, 230, 800, 220);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `48px ${FONTS.title}`;
    ctx.fillText(this.heading, W / 2, 300);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `22px ${FONTS.body}`;
    ctx.fillText(this.body, W / 2, 370);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('(not built yet)', W / 2, 408);
    ctx.restore();
    drawPrompts(ctx, this.game.input, [['back', 'Back']], W - 40, H - 36);
  }
}
