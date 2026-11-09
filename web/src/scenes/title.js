import { Menu } from '../core/menu.js';
import { drawPrompts, roundRect } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { hasSave, loadJourney, newJourney } from '../core/save.js';
import { MapScene } from './map.js';
import { TravelScene } from './travel.js';
import { PlaceholderScene } from './placeholder.js';

export class TitleScene {
  constructor(game, { select } = {}) {
    this.game = game;
    this.t = 0;
    this.menu = new Menu(
      [
        { id: 'new', label: 'New Game' },
        { id: 'continue', label: 'Continue', disabled: !hasSave() },
        { id: 'settings', label: 'Settings' },
        { id: 'exit', label: 'Exit' },
      ],
      { x: W / 2, y: 282 },
    );
    if (select) this.menu.select(select);
    this.confirmExit = null; // a Menu while the "leave?" dialog is open
    this.exited = false;
  }

  update(dt, input, pointer) {
    this.t += dt;
    if (this.exited) return;

    if (this.confirmExit) {
      const choice = this.confirmExit.update(dt, input, pointer);
      if (choice === 'yes') this.exit();
      else if (choice === 'no' || input.pressed('back')) this.confirmExit = null;
      return;
    }

    // Back on the title screen jumps the cursor to Exit, console-style.
    if (input.pressed('back')) {
      this.menu.select('exit');
      return;
    }

    switch (this.menu.update(dt, input, pointer)) {
      case 'new':
        this.game.setScene(new MapScene(this.game, newJourney()));
        break;
      case 'continue': {
        const journey = loadJourney();
        if (journey?.riding) this.game.setScene(new TravelScene(this.game, journey));
        else if (journey) this.game.setScene(new MapScene(this.game, journey));
        break;
      }
      case 'settings':
        this.game.setScene(
          new PlaceholderScene(this.game, {
            heading: 'Settings',
            body: 'Audio, display and control options will live here.',
            returnTo: 'settings',
          }),
        );
        break;
      case 'exit':
        this.confirmExit = new Menu(
          [
            { id: 'no', label: 'No' },
            { id: 'yes', label: 'Yes' },
          ],
          { x: W / 2, y: 372, rowH: 50, width: 200, fontSize: 30 },
        );
        break;
    }
  }

  exit() {
    // A browser only lets a script close windows that a script opened, so
    // this usually does nothing; the GameMaker build calls game_end().
    window.close();
    this.exited = true;
  }

  draw(ctx) {
    const { input } = this.game;
    this.game.backdrop.draw(ctx);

    // Title.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `112px ${FONTS.title}`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText('Hobo Quest', W / 2 + 5, 175);
    ctx.fillStyle = COLORS.cream;
    ctx.fillText('Hobo Quest', W / 2, 170);
    ctx.restore();

    if (this.exited) {
      panel(ctx, W / 2 - 300, 300, 600, 150);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLORS.cream;
      ctx.font = `32px ${FONTS.body}`;
      ctx.fillText('Thanks for playing.', W / 2, 352);
      ctx.font = `22px ${FONTS.body}`;
      ctx.fillStyle = 'rgba(244, 230, 200, 0.7)';
      ctx.fillText('You can close this tab now.', W / 2, 400);
      ctx.restore();
      return;
    }

    panel(ctx, W / 2 - 210, 236, 420, 4 * 58 + 34);
    this.menu.draw(ctx, this.t);

    if (this.confirmExit) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      panel(ctx, W / 2 - 230, 250, 460, 230, '#1c1212');
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.cream;
      ctx.font = `30px ${FONTS.body}`;
      ctx.fillText('Leave Hobo Quest?', W / 2, 315);
      ctx.restore();
      this.confirmExit.draw(ctx, this.t);
      drawPrompts(ctx, input, [['confirm', 'Select'], ['back', 'Cancel']], W - 40, H - 36);
    } else {
      drawPrompts(ctx, input, [['confirm', 'Select']], W - 40, H - 36);
    }

    ctx.save();
    ctx.font = `16px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.5)';
    ctx.textBaseline = 'middle';
    ctx.fillText(`web prototype v${__APP_VERSION__}`, 40, H - 36);
    ctx.restore();
  }
}

export function panel(ctx, x, y, w, h, fill = COLORS.panel) {
  ctx.save();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 230, 200, 0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.stroke();
  ctx.restore();
}
