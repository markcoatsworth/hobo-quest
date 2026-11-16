// Phones and tablets. Everything touch-specific lives in this folder and is
// only loaded when src/touch/detect.js says this is a touch device, so the
// game on a desktop or laptop looks and plays exactly as it always has.
//
// What it does:
//   - fits the page to the phone: no pinch-zoom, no scroll bounce, no text
//     selection or long-press menus, and room left for notches;
//   - plays in landscape, always: on the first tap it asks for full screen
//     and a landscape lock (Android); while the browser is upright anyway
//     (iPhone, or a rotation lock) the whole game is drawn a quarter-turn,
//     so turning the phone sideways shows it the right way up (screen.js);
//   - adds on-screen controls (controls.js) that feed the same actions a
//     controller would: a thumbstick, A, B and a menu button. Menus are
//     tapped directly.

import { TouchLayer } from './controls.js';

export function setupTouch(game, canvas) {
  fitPage(canvas);
  fitCanvas(canvas);
  game.touch = new TouchLayer(game, canvas);
  game.input.lastDevice = 'touch';
}

/**
 * Size the canvas to exactly the visible screen. The page's 100vh includes
 * the space behind a phone's toolbars, which stretched the picture (and
 * made circles ovals); innerWidth/innerHeight are what's really showing.
 */
function fitCanvas(canvas) {
  const fit = () => {
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  };
  fit();
  window.addEventListener('resize', fit);
}

/** Page settings for a touch screen, applied only here. */
function fitPage(canvas) {
  const meta = document.querySelector('meta[name="viewport"]');
  meta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  const style = document.createElement('style');
  style.textContent = `
    html, body { overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
    canvas { -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(style);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
