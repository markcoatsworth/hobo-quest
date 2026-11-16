import '@fontsource/rye';
import '@fontsource/special-elite';
import { Backdrop } from './core/backdrop.js';
import { Input } from './core/input.js';
import { COLORS, FONTS, W, H } from './core/screen.js';
import { TitleScene } from './scenes/title.js';
import { CornerButtons, toggleMute } from './ui/corner.js';
import { SettingsPanel } from './ui/settings.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Scale the fixed W×H world to the window, letterboxed.
const view = { scale: 1, ox: 0, oy: 0 };
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  view.scale = Math.min(canvas.width / W, canvas.height / H);
  view.ox = (canvas.width - W * view.scale) / 2;
  view.oy = (canvas.height - H * view.scale) / 2;
}
window.addEventListener('resize', resize);
resize();

// Mouse, in world coordinates. Optional: everything works without it.
const pointer = { x: -1, y: -1, moved: false, clicked: false };
function toWorld(e) {
  const dpr = window.devicePixelRatio || 1;
  pointer.x = (e.clientX * dpr - view.ox) / view.scale;
  pointer.y = (e.clientY * dpr - view.oy) / view.scale;
}
canvas.addEventListener('pointermove', (e) => {
  toWorld(e);
  pointer.moved = true;
  game.input.lastDevice = 'mouse';
});
canvas.addEventListener('pointerdown', (e) => {
  toWorld(e);
  pointer.moved = true;
  pointer.clicked = true;
  game.input.lastDevice = 'mouse';
});

const game = {
  input: new Input(),
  backdrop: new Backdrop(),
  scene: null,
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
  ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  game.scene.draw(ctx);
  game.overlay?.draw(ctx);
  game.corner.draw(ctx);
  drawToast(dt);
  ctx.restore();

  requestAnimationFrame(frame);
}

// Canvas text won't use a web font until it has loaded; wait so the title
// doesn't flash in a fallback face. Don't hang forever if it fails.
Promise.race([
  Promise.all([document.fonts.load(`112px ${FONTS.title}`), document.fonts.load(`34px ${FONTS.body}`)]),
  new Promise((r) => setTimeout(r, 2000)),
]).finally(() => {
  game.setScene(new TitleScene(game));
  requestAnimationFrame(frame);
});
