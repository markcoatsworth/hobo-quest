// Plays a cutscene from src/cutscenes/: a video when it has one, otherwise
// its shots drawn in code. When it ends or is skipped, `next()` supplies the
// scene to go to.
//
// A drawn shot runs in three phases: `lead` seconds of picture, then its
// dialogue lines one by one (typed out, each held long enough to read),
// then `tail` seconds of picture. Confirm finishes typing a line, then moves
// to the next; Back skips the whole cutscene.

import { drawPrompts } from '../core/prompts.js';
import { music_play } from '../core/music.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';

const FADE = 0.6; // seconds of fade at each end of a shot
const TYPE_RATE = 45; // characters per second
const READ_RATE = 15; // characters per second a line is held for, after a pause
const READ_PAUSE = 1.4;

/** Seconds a line stays up unless skipped. */
function lineTime(line) {
  return line.time ?? READ_PAUSE + line.text.length / READ_RATE;
}

export class CutsceneScene {
  constructor(game, cutscene, { next }) {
    this.game = game;
    this.cutscene = cutscene;
    this.next = next;
    this.done = false;
    // Its song plays on past the end of the cutscene, then the playlist resumes.
    if (cutscene.music) music_play(cutscene.music);
    this.startShot(0);
    this.video = cutscene.video ? this.startVideo(cutscene.video) : null;
  }

  // ----------------------------------------------------------------- video

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
    this.startShot(0);
    if (!this.cutscene.shots?.length) this.finish();
  }

  // ----------------------------------------------------------------- shots

  get shot() {
    return this.cutscene.shots[this.shotIndex];
  }

  startShot(i) {
    this.shotIndex = i;
    this.t = 0; // seconds since the shot began
    this.phase = 'lead'; // lead | lines | tail
    this.phaseT = 0;
    this.line = -1; // index of the line showing
  }

  /** Move to the next phase or line, or the next shot. */
  advance() {
    const shot = this.shot;
    const lines = shot.lines ?? [];
    this.phaseT = 0;
    if (this.phase === 'lead') {
      if (lines.length) {
        this.phase = 'lines';
        this.line = 0;
      } else this.phase = 'tail';
    } else if (this.phase === 'lines') {
      this.line++;
      if (this.line >= lines.length) this.phase = 'tail';
    } else {
      if (this.shotIndex + 1 < this.cutscene.shots.length) this.startShot(this.shotIndex + 1);
      else this.finish();
    }
  }

  /** Length of the current phase. A shot without lines uses `duration` as its tail. */
  phaseLength() {
    const shot = this.shot;
    if (this.phase === 'lead') return shot.lead ?? 0;
    if (this.phase === 'lines') return lineTime(shot.lines[this.line]);
    return shot.lines?.length ? (shot.tail ?? FADE) : (shot.tail ?? shot.duration ?? 0);
  }

  /** Characters of the current line typed so far. */
  typed() {
    return Math.floor(this.phaseT * TYPE_RATE);
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.video?.pause();
    this.game.setScene(this.next());
  }

  update(dt, input, pointer) {
    if (input.pressed('back') || input.pressed('pause')) return this.finish();

    const skip = input.pressed('confirm') || pointer?.clicked;
    if (this.video) {
      if (skip) this.finish();
      return;
    }

    this.t += dt;
    this.phaseT += dt;
    if (skip) {
      // Finish typing first, then move on.
      const line = this.phase === 'lines' && this.shot.lines[this.line];
      if (line && this.typed() < line.text.length) this.phaseT = line.text.length / TYPE_RATE;
      else this.advance();
    }
    // Zero-length phases pass straight through.
    let guard = 8;
    while (!this.done && this.phaseT >= this.phaseLength() && guard--) this.advance();
  }

  // ------------------------------------------------------------------ draw

  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (this.video) this.drawVideo(ctx);
    else if (!this.done) this.drawShot(ctx);

    drawPrompts(ctx, this.game.input, this.video ? [['back', 'Skip']] : [['confirm', 'Next'], ['back', 'Skip']], W - 40, H - 30);
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

  drawShot(ctx) {
    const shot = this.shot;
    const lines = shot.lines ?? [];
    const line = this.phase === 'lines' ? lines[this.line] : null;
    const cue = {
      phase: this.phase,
      phaseT: this.phaseT,
      line: this.phase === 'lead' ? -1 : this.phase === 'tail' ? lines.length : this.line,
      // Who's mid-sentence right now, for mouths to move.
      speaking: line && this.typed() < line.text.length ? line.who : null,
      // The most recent `beat` reached: story moments the picture shows.
      beat: lastBeat(lines, this.phase === 'tail' ? lines.length - 1 : this.line),
    };

    ctx.save();
    shot.draw?.(ctx, this.t, cue);
    ctx.restore();

    if (shot.caption) this.drawCaption(ctx, shot.caption);
    if (line) this.drawLine(ctx, line, shot.dialog === 'top' ? 40 : 566);

    // Fade from black at the start, to black at the end.
    let fade = 0;
    if (shot.fadeIn !== false) fade = Math.max(fade, 1 - this.t / FADE);
    if (shot.fadeOut !== false && this.phase === 'tail') {
      fade = Math.max(fade, 1 - (this.phaseLength() - this.phaseT) / FADE);
    }
    if (fade > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, fade)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawCaption(ctx, text) {
    ctx.save();
    ctx.fillStyle = COLORS.cream;
    ctx.font = `30px ${FONTS.title}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillText(text, W / 2, 80);
    ctx.restore();
  }

  /**
   * Speaker names as of a given line: the cutscene's cast, with any renames
   * made by lines up to and including this one (a line's `cast`).
   */
  castAt(shotIndex, lineIndex) {
    const cast = { ...this.cutscene.cast };
    this.cutscene.shots.forEach((shot, s) => {
      (shot.lines ?? []).forEach((line, l) => {
        if (line.cast && (s < shotIndex || (s === shotIndex && l <= lineIndex))) Object.assign(cast, line.cast);
      });
    });
    return cast;
  }

  drawLine(ctx, line, y) {
    const x = 150;
    const w = W - 300;
    const h = 108;
    ctx.save();
    ctx.fillStyle = 'rgba(14, 9, 8, 0.86)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 230, 200, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const name = this.castAt(this.shotIndex, this.line)[line.who] ?? line.who;
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `22px ${FONTS.title}`;
    ctx.fillText(name, x + 24, y + 14);

    ctx.fillStyle = COLORS.cream;
    ctx.font = `23px ${FONTS.body}`;
    const shown = line.text.slice(0, this.typed());
    wrapTyped(ctx, line.text, shown, x + 24, y + 46, w - 48, 28);
    ctx.restore();
  }
}

function lastBeat(lines, upTo) {
  let beat = null;
  for (let i = 0; i <= upTo && i < lines.length; i++) if (lines[i].beat) beat = lines[i].beat;
  return beat;
}

/** Wrap by the full text so words don't jump lines as they type out. */
function wrapTyped(ctx, full, shown, x, y, maxW, lineH) {
  const words = full.split(' ');
  let row = 0;
  let line = '';
  let start = 0; // index in `full` where this row starts
  const rows = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      rows.push([start, line.length]);
      start += line.length + 1;
      line = word;
    } else line = test;
  }
  rows.push([start, line.length]);
  for (const [s, len] of rows) {
    if (s >= shown.length) break;
    ctx.fillText(full.slice(s, Math.min(s + len, shown.length)), x, y + row++ * lineH);
  }
}
