// On-screen controls for phones and tablets, drawn over the game in screen
// space (they can sit in the black bars either side of the picture on a
// wide phone) and fed into the input as a virtual controller. Positions
// are on the landscape screen (screen.js), which is turned a quarter when
// the phone is held upright.
//
//   Thumbstick   touch anywhere on the left half and drag; push it all the
//                way to run. Walks in town, moves you round the yard.
//   Act (green)  confirm. Its icon shows what it'll do right now: talk
//                (speech bubble), look (eye), go in or along (door), carry
//                on a conversation (arrow), hop on (hand), hurry the ride
//                (fast forward). Dimmed when there's nothing in reach.
//   Close (red)  back, as ✕: only shown when there's something to close
//                (a conversation, a description, a menu)
//   ≡            the pause menu (settings, back to the map)
//   Skip         in cutscenes; a tap anywhere else moves the talk along
//
// Which controls show depends on what's on screen; everything else (menus,
// the map, the title) is tapped directly, as with a mouse.

import { AreaScene } from '../scenes/area.js';
import { CutsceneScene } from '../scenes/cutscene.js';
import { MapScene } from '../scenes/map.js';
import { TravelScene } from '../scenes/travel.js';
import { YardScene } from '../scenes/yard.js';
import { FONTS } from '../core/screen.js';
import { TouchScreen } from './screen.js';

const MARGIN = 18; // CSS px from the edge of the safe area
const STICK_R = 58; // how far the thumb travels for full speed
const STICK_PRESS = 0.5; // direction on, for menus (as for a real stick)
const STICK_RELEASE = 0.3;
const RUN_AT = 0.92; // stick pushed this far runs

const BUTTONS = {
  a: { action: 'confirm', color: '#5fa04e', r: 42 },
  b: { action: 'back', color: '#c8463d', r: 32 },
  menu: { action: 'pause', color: '#8a8478', r: 24 },
  skip: { action: 'pause', color: '#8a8478' },
};

// Controls shown in each situation.
const MODES = {
  move: ['stick', 'a', 'b', 'menu'], // walking a town, sneaking through a yard
  ride: ['a', 'menu'], // on the train: hold A to hurry
  map: ['menu'],
  back: ['b'], // a menu is open over the game
  cutscene: ['skip'],
  none: [], // title screen, yard results: just tap
};

export class TouchLayer {
  constructor(game, canvas) {
    this.game = game;
    this.canvas = canvas;
    this.touches = new Map(); // pointerId -> { control, x, y, ox, oy }
    this.stickDir = { up: false, down: false, left: false, right: false };
    this.stick = { x: 0, y: 0 };
    this.mode = 'none';
    this.context = { act: 'hand', ready: false, close: false };
    this.t = 0;
    this.askedFullscreen = false;
    this.screen = new TouchScreen();
    this.glassInsets = { t: 0, r: 0, b: 0, l: 0 };
    this.watchSafeArea();

    // Capture phase, so a touch on a control never reaches the game as a tap.
    const opts = { capture: true, passive: false };
    canvas.addEventListener('pointerdown', (e) => this.down(e), opts);
    canvas.addEventListener('pointermove', (e) => this.move(e), opts);
    canvas.addEventListener('pointerup', (e) => this.up(e), opts);
    canvas.addEventListener('pointercancel', (e) => this.up(e), opts);
  }

  // ------------------------------------------------------------- layout

  /** Where each control sits right now, in CSS px on the landscape screen. */
  layout() {
    const { w, h } = this.screen.size();
    const s = this.screen.insets(this.glassInsets);
    const a = { x: w - s.r - MARGIN - 46, y: h - s.b - MARGIN - 46 };
    return {
      a,
      b: { x: a.x - 96, y: a.y - 52 },
      menu: { x: w - s.r - MARGIN - 24, y: s.t + MARGIN + 24 },
      skip: { x: w - s.r - MARGIN - 110, y: s.t + MARGIN, w: 110, h: 44 },
      stickHome: { x: s.l + MARGIN + 92, y: h - s.b - MARGIN - 92 },
    };
  }

  /** Room for notches and home bars, from the browser's safe-area insets. */
  watchSafeArea() {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(probe);
    const read = () => {
      const cs = getComputedStyle(probe);
      this.glassInsets = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
    };
    read();
    window.addEventListener('resize', read);
  }

  /** The control under a point, among those showing, or null. */
  /** The controls showing right now. */
  showing() {
    return MODES[this.mode].filter((id) => id !== 'b' || this.context.close);
  }

  hit(x, y) {
    const L = this.layout();
    for (const id of this.showing()) {
      if (id === 'stick') continue;
      if (id === 'skip') {
        const r = L.skip;
        if (x >= r.x - 10 && x <= r.x + r.w + 10 && y >= r.y - 10 && y <= r.y + r.h + 10) return id;
      } else if (Math.hypot(x - L[id].x, y - L[id].y) < BUTTONS[id].r + 14) return id;
    }
    // The left half is the thumbstick's.
    if (MODES[this.mode].includes('stick') && x < this.screen.size().w / 2) return 'stick';
    return null;
  }

  // ------------------------------------------------------------- events

  down(e) {
    if (e.pointerType !== 'touch') return;
    this.game.input.lastDevice = 'touch';
    if (!this.askedFullscreen) this.goLandscape();
    const p = this.screen.fromClient(e.clientX, e.clientY);
    const control = this.hit(p.x, p.y);
    if (!control) return; // a tap for the game: menus, the map
    e.stopImmediatePropagation();
    e.preventDefault();
    this.canvas.setPointerCapture?.(e.pointerId);
    this.touches.set(e.pointerId, { control, x: p.x, y: p.y, ox: p.x, oy: p.y });
  }

  move(e) {
    const touch = this.touches.get(e.pointerId);
    if (!touch) return;
    e.stopImmediatePropagation();
    const p = this.screen.fromClient(e.clientX, e.clientY);
    touch.x = p.x;
    touch.y = p.y;
  }

  up(e) {
    if (!this.touches.has(e.pointerId)) return;
    e.stopImmediatePropagation();
    this.touches.delete(e.pointerId);
  }

  /** Full screen and a landscape lock, where the browser allows (Android). */
  goLandscape() {
    this.askedFullscreen = true;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' })
        .then(() => screen.orientation?.lock?.('landscape'))
        .catch(() => {});
    } else {
      screen.orientation?.lock?.('landscape').catch(() => {});
    }
  }

  // ------------------------------------------------------------- update

  /** What's on screen decides which controls show. */
  currentMode() {
    const { game } = this;
    const s = game.scene;
    if (game.overlay || s?.paused) return 'back';
    if (s instanceof CutsceneScene) return 'cutscene';
    if (s instanceof AreaScene) return 'move';
    if (s instanceof YardScene) return s.outcome ? 'none' : 'move';
    if (s instanceof TravelScene) return 'ride';
    if (s instanceof MapScene) return 'map';
    return 'none';
  }

  /** What the Act button would do right now, and whether there's anything to close. */
  currentContext() {
    const s = this.game.scene;
    if (this.mode === 'back') return { act: 'hand', ready: false, close: true };
    if (this.mode === 'ride') return { act: 'hurry', ready: true, close: false };
    if (s instanceof AreaScene) {
      if (s.dialog) return { act: 'next', ready: true, close: true };
      if (s.place) return { act: 'next', ready: true, close: true };
      const verb = { npc: 'talk', prop: 'look', exit: 'door', place: 'door', yard: 'door' }[s.focus?.type];
      return { act: verb ?? 'hand', ready: !!verb, close: false };
    }
    if (s instanceof YardScene) return { act: 'hand', ready: !!s.canHop, close: false };
    return { act: 'hand', ready: false, close: false };
  }

  /** Called before the input each frame. */
  update(dt) {
    this.t += dt;
    const mode = this.currentMode();
    if (mode !== this.mode) {
      // Controls that just went away let go of whatever they held.
      for (const [id, touch] of this.touches) if (!MODES[mode].includes(touch.control)) this.touches.delete(id);
      this.mode = mode;
    }
    this.context = this.currentContext();

    const down = new Set();
    this.stick = { x: 0, y: 0 };
    for (const touch of this.touches.values()) {
      if (touch.control === 'stick') {
        const dx = touch.x - touch.ox;
        const dy = touch.y - touch.oy;
        const mag = Math.min(1, Math.hypot(dx, dy) / STICK_R);
        const len = Math.hypot(dx, dy) || 1;
        this.stick = { x: (dx / len) * mag, y: (dy / len) * mag };
        if (mag >= RUN_AT) down.add('sprint');
      } else {
        down.add(BUTTONS[touch.control].action);
      }
    }
    // The stick also steps through menus, like a controller's.
    const dirs = { left: -this.stick.x, right: this.stick.x, up: -this.stick.y, down: this.stick.y };
    for (const [dir, v] of Object.entries(dirs)) {
      this.stickDir[dir] = this.stickDir[dir] ? v > STICK_RELEASE : v > STICK_PRESS;
      if (this.stickDir[dir]) down.add(dir);
    }

    this.game.input.virtual = { down, stick: this.stick };
  }

  // --------------------------------------------------------------- draw

  /** Drawn last, over everything, on the landscape screen. */
  draw(ctx) {
    ctx.save();
    this.screen.turn(ctx, window.devicePixelRatio || 1);
    this.drawControls(ctx);
    ctx.restore();
  }

  drawControls(ctx) {
    const L = this.layout();
    const held = new Set([...this.touches.values()].map((t) => t.control));
    for (const id of this.showing()) {
      if (id === 'stick') this.drawStick(ctx, L.stickHome);
      else if (id === 'skip') this.drawSkip(ctx, L.skip, held.has('skip'));
      else {
        const icon = id === 'a' ? this.context.act : id === 'b' ? 'close' : 'menu';
        const dim = id === 'a' && !this.context.ready;
        this.drawButton(ctx, L[id], BUTTONS[id], held.has(id), icon, dim);
      }
    }
  }

  drawButton(ctx, p, b, pressed, icon, dim) {
    ctx.globalAlpha = pressed ? 0.95 : dim ? 0.4 : 0.75;
    ctx.fillStyle = pressed ? b.color : 'rgba(16, 10, 10, 0.5)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = b.color;
    ctx.stroke();
    drawIcon(ctx, icon, p.x, p.y, b.r * 0.5);
    ctx.globalAlpha = 1;
  }

  drawSkip(ctx, r, pressed) {
    ctx.globalAlpha = pressed ? 0.95 : 0.7;
    ctx.fillStyle = pressed ? 'rgba(138, 132, 120, 0.7)' : 'rgba(16, 10, 10, 0.5)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 230, 200, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f4e6c8';
    ctx.font = `20px ${FONTS.body}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Skip ▸▸', r.x + r.w / 2, r.y + r.h / 2 + 1);
    ctx.globalAlpha = 1;
  }

  drawStick(ctx, home) {
    const touch = [...this.touches.values()].find((t) => t.control === 'stick');
    const o = touch ? { x: touch.ox, y: touch.oy } : home;
    ctx.globalAlpha = touch ? 0.8 : 0.35;
    ctx.fillStyle = 'rgba(16, 10, 10, 0.35)';
    ctx.strokeStyle = 'rgba(244, 230, 200, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(o.x, o.y, STICK_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(244, 230, 200, 0.75)';
    ctx.beginPath();
    ctx.arc(o.x + this.stick.x * STICK_R, o.y + this.stick.y * STICK_R, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- icons

const INK = '#f4e6c8';

/** An icon for what a button does, centred on (x, y), about s from the centre to its edge. */
function drawIcon(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, s * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (kind) {
    case 'talk': {
      // A speech bubble with three dots.
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.75, s * 2, s * 1.3, s * 0.35);
      ctx.moveTo(-s * 0.45, s * 0.5);
      ctx.lineTo(-s * 0.7, s * 0.95);
      ctx.lineTo(-s * 0.05, s * 0.55);
      ctx.fill();
      ctx.fillStyle = 'rgba(16, 10, 10, 0.85)';
      for (const dx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.arc(dx * s, -s * 0.1, s * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'look': {
      // An eye.
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, -s * 1.05, s, 0);
      ctx.quadraticCurveTo(0, s * 1.05, -s, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'door': {
      // A door standing open.
      ctx.beginPath();
      ctx.rect(-s * 0.6, -s, s * 1.2, s * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s);
      ctx.lineTo(s * 0.25, -s * 0.75);
      ctx.lineTo(s * 0.25, s * 1.15);
      ctx.lineTo(-s * 0.6, s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'next': {
      // Carry on: a chevron.
      ctx.lineWidth = Math.max(3, s * 0.28);
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.7);
      ctx.lineTo(s * 0.4, 0);
      ctx.lineTo(-s * 0.35, s * 0.7);
      ctx.stroke();
      break;
    }
    case 'hurry': {
      // Fast forward.
      for (const dx of [-s * 0.9, 0]) {
        ctx.beginPath();
        ctx.moveTo(dx, -s * 0.7);
        ctx.lineTo(dx + s * 0.9, 0);
        ctx.lineTo(dx, s * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'close': {
      ctx.lineWidth = Math.max(3, s * 0.28);
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.6);
      ctx.lineTo(s * 0.6, s * 0.6);
      ctx.moveTo(s * 0.6, -s * 0.6);
      ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.stroke();
      break;
    }
    case 'menu': {
      ctx.lineWidth = Math.max(2.5, s * 0.22);
      ctx.beginPath();
      for (const dy of [-0.55, 0, 0.55]) {
        ctx.moveTo(-s * 0.75, dy * s);
        ctx.lineTo(s * 0.75, dy * s);
      }
      ctx.stroke();
      break;
    }
    case 'hand':
    default: {
      // A hand reaching out, finger first: do something.
      ctx.beginPath();
      ctx.roundRect(-s * 0.18, -s * 1.05, s * 0.36, s * 1.2, s * 0.18); // pointing finger
      ctx.roundRect(-s * 0.62, -s * 0.15, s * 1.3, s * 1.05, s * 0.3); // palm and folded fingers
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-s * 0.95, -s * 0.05, s * 0.45, s * 0.7, s * 0.2); // thumb
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
