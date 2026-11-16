// Plays a cutscene from src/cutscenes/: a video when it has one, otherwise
// its shots drawn in code. When it ends or is skipped, `next()` supplies the
// scene to go to.

import { drawPrompts } from '../core/prompts.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';

const FADE = 0.5; // seconds of fade at each end of a shot

export class CutsceneScene {
  constructor(game, cutscene, { next }) {
    this.game = game;
    this.cutscene = cutscene;
    this.next = next;
    this.shot = 0;
    this.t = 0;
    this.done = false;
    this.video = cutscene.video ? this.startVideo(cutscene.video) : null;
  }

  startVideo(src) {
    const video = document.createElement('video');
    video.src = src;
    video.playsInline = true;
    video.addEventListener('ended', () => this.finish());
    // Missing or unplayable file: fall back to the drawn shots.
    video.addEventListener('error', () => this.dropVideo());
    video.play().catch(() => this.dropVideo());
    return video;
  }

  dropVideo() {
    if (!this.video) return;
    this.video.pause();
    this.video = null;
    this.t = 0;
    if (!this.cutscene.shots?.length) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.video?.pause();
    this.game.setScene(this.next());
  }

  update(dt, input, pointer) {
    if (input.pressed('back') || input.pressed('pause')) return this.finish();

    if (this.video) {
      if (input.pressed('confirm') || pointer?.clicked) this.finish();
      return;
    }

    const shots = this.cutscene.shots;
    this.t += dt;
    const skip = input.pressed('confirm') || pointer?.clicked;
    if (skip || this.t >= shots[this.shot].duration) {
      this.shot++;
      this.t = 0;
      if (this.shot >= shots.length) this.finish();
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (this.video) {
      this.drawVideo(ctx);
    } else if (!this.done) {
      this.drawShot(ctx, this.cutscene.shots[this.shot]);
    }

    drawPrompts(ctx, this.game.input, this.video ? [['back', 'Skip']] : [['confirm', 'Next'], ['back', 'Skip']], W - 40, H - 36);
  }

  drawVideo(ctx) {
    const v = this.video;
    if (v.readyState < 2 || !v.videoWidth) return;
    // Fit inside the screen, keeping the video's shape.
    const s = Math.min(W / v.videoWidth, H / v.videoHeight);
    const w = v.videoWidth * s;
    const h = v.videoHeight * s;
    ctx.drawImage(v, (W - w) / 2, (H - h) / 2, w, h);
  }

  drawShot(ctx, shot) {
    const k = Math.min(1, this.t / shot.duration);
    ctx.save();
    shot.draw?.(ctx, this.t, k);
    ctx.restore();

    if (shot.caption) {
      ctx.save();
      ctx.fillStyle = COLORS.panel;
      ctx.fillRect(0, H - 150, W, 76);
      ctx.fillStyle = COLORS.cream;
      ctx.font = `28px ${FONTS.body}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shot.caption, W / 2, H - 112);
      ctx.restore();
    }

    // Fade from and to black.
    const fade = Math.max(0, 1 - this.t / FADE, 1 - (shot.duration - this.t) / FADE);
    if (fade > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, fade)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
