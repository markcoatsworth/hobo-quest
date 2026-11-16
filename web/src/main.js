import '@fontsource/rye';
import '@fontsource/special-elite';
import { Backdrop } from './core/backdrop.js';
import { Input } from './core/input.js';
import { COLORS, FONTS, W, H } from './core/screen.js';
import { TitleScene } from './scenes/title.js';
import { CornerButtons, toggleMute } from './ui/corner.js';
import { SettingsPanel } from './ui/settings.js';
import { isTouchDevice } from './touch/detect.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Scale the fixed W×H world to the window, letterboxed. On a phone held
// upright the touch layer turns the whole picture a quarter-turn (see
// src/touch/screen.js): then the game fits the screen sideways, `screen`
// gives the sideways size, and `turn` the rotation. Everywhere else the
// screen is just the window and nothing turns.
const view = { scale: 1, ox: 0, oy: 0 };
const screenSize = () => game.touch?.screen.size() ?? { w: window.innerWidth, h: window.innerHeight };
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  const { w, h } = screenSize();
  view.scale = Math.min((w * dpr) / W, (h * dpr) / H);
  view.ox = (w * dpr - W * view.scale) / 2;
  view.oy = (h * dpr - H * view.scale) / 2;
}
window.addEventListener('resize', resize);

// Mouse, in world coordinates. Optional: everything works without it.
const pointer = { x: -1, y: -1, moved: false, clicked: false };
function toWorld(e) {
  const dpr = window.devicePixelRatio || 1;
  const p = game.touch?.screen.fromClient(e.clientX, e.clientY) ?? { x: e.clientX, y: e.clientY };
  pointer.x = (p.x * dpr - view.ox) / view.scale;
  pointer.y = (p.y * dpr - view.oy) / view.scale;
}
// On a phone or tablet a finger counts as touch (src/touch/ handles that);
// everywhere else, touchscreen laptops included, it's the mouse as ever.
const pointerDevice = (e) => (e.pointerType === 'touch' && game.touch ? 'touch' : 'mouse');
canvas.addEventListener('pointermove', (e) => {
  toWorld(e);
  pointer.moved = true;
  game.input.lastDevice = pointerDevice(e);
});
canvas.addEventListener('pointerdown', (e) => {
  toWorld(e);
  pointer.moved = true;
  pointer.clicked = true;
  game.input.lastDevice = pointerDevice(e);
});

const game = {
  input: new Input(),
  backdrop: new Backdrop(),
  scene: null,
  // On phones and tablets only: the touch layer (src/touch/), with its
  // on-screen controls and the turn-sideways screen. Null on desktop.
  touch: null,
  // Shown over the scene, which waits while it's open (Settings from the
  // title or the corner gear). Has update() returning 'close', and draw().
  overlay: null,
  toast: null,
  setScene(scene) {
    this.scene = scene;
  },
  openSettings() {
    if (!(this.overlay instanceof SettingsPanel)) this.overlay = new SettingsPanel(this);
  },
};
game.corner = new CornerButtons(game);
resize();

// Dev builds only: a handle for poking at the game from the console/tests.
if (import.meta.env.DEV) window.__game = game;

game.input.on((type, pad) => {
  const name = pad.id.replace(/\s*\(.*\)\s*/g, ' ').trim() || 'Controller';
  game.toast = { text: `${type === 'connected' ? 'Connected' : 'Disconnected'}: ${name}`, t: 3 };
});

function drawToast(dt) {
  const toast = game.toast;
  if (!toast) return;
  toast.t -= dt;
  if (toast.t <= 0) {
    game.toast = null;
    return;
  }
  ctx.save();
  ctx.globalAlpha = Math.min(1, toast.t * 2);
  // Top centre, clear of the status (top left) and the corner buttons.
  ctx.font = `18px ${FONTS.body}`;
  const w = Math.min(ctx.measureText(toast.text).width + 40, W - 80);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(W / 2 - w / 2, 76, w, 40);
  ctx.fillStyle = COLORS.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(toast.text, W / 2, 97, w - 40);
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  // Clamp so a backgrounded tab doesn't come back with a giant step.
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Touch devices: the on-screen controls feed the input first.
  game.touch?.update(dt);
  game.input.update(dt);
  game.backdrop.update(dt);
  if (game.input.pressed('mute')) toggleMute(game);
  // The corner buttons get first look at a click.
  if (game.corner.update(pointer)) pointer.clicked = false;
  if (game.overlay) {
    if (game.overlay.update(dt, game.input, pointer) === 'close') game.overlay = null;
  } else {
    game.scene.update(dt, game.input, pointer);
  }
  pointer.moved = pointer.clicked = false;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0908';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A phone held upright draws the game turned sideways (src/touch/).
  if (game.touch) game.touch.screen.turn(ctx);
  ctx.transform(view.scale, 0, 0, view.scale, view.ox, view.oy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  game.scene.draw(ctx);
  game.overlay?.draw(ctx);
  game.corner.draw(ctx);
  drawToast(dt);
  ctx.restore();
  game.touch?.draw(ctx);

  requestAnimationFrame(frame);
}

// Canvas text won't use a web font until it has loaded; wait so the title
// doesn't flash in a fallback face. Don't hang forever if it fails.
Promise.race([
  Promise.all([document.fonts.load(`112px ${FONTS.title}`), document.fonts.load(`34px ${FONTS.body}`)]),
  new Promise((r) => setTimeout(r, 2000)),
]).finally(async () => {
  // Phones and tablets load the touch layer; desktops never fetch it.
  if (isTouchDevice()) {
    const { setupTouch } = await import('./touch/index.js');
    setupTouch(game, canvas);
    resize();
  }
  game.setScene(new TitleScene(game));
  requestAnimationFrame(frame);
});
