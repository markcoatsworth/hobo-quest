// Drawing the moon, anywhere there's a sky: the ride now, and towns,
// cutscenes and the title later. Where it is and how much is lit come from
// src/systems/moon.js.
//
// Seen from the United States: a waxing moon is lit on the right, a waning
// one on the left.

import { moon_lit, moon_phase, moon_up } from '../systems/moon.js';

/**
 * The moon at `minutes`, on its arc across a sky: rising at the right
 * (east), setting at the left (west), as the ride faces.
 *   horizon: where the arc meets the land (y)
 *   width:   how wide the sky is
 *   height:  how high the arc climbs above the horizon
 *   r:       the moon's radius
 * Draws nothing while it's down. Returns true if it drew.
 */
export function drawMoonInSky(ctx, minutes, { horizon, width, height = 220, r = 22 }) {
  const k = moon_up(minutes);
  if (k === null) return false;
  const x = width + 40 - k * (width + 80);
  const y = horizon - Math.sin(Math.PI * k) * height;
  drawMoon(ctx, x, y, r, moon_phase(minutes));
  return true;
}

/**
 * The moon at (x, y), radius r, at `phase` (0 new .. 0.5 full .. 1 new):
 * a glow as bright as it's lit, the dark part faint, the lit part with the
 * man in the moon.
 */
export function drawMoon(ctx, x, y, r, phase) {
  const lit = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  ctx.save();

  // The glow, from almost nothing at a new moon to full at a full one.
  if (lit > 0.02) {
    const glow = ctx.createRadialGradient(x, y, r * 0.45, x, y, r * 4.1);
    glow.addColorStop(0, `rgba(230, 230, 210, ${0.35 * lit})`);
    glow.addColorStop(1, 'rgba(230, 230, 210, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 4.1, y - r * 4.1, r * 8.2, r * 8.2);
  }

  // The dark part, just showing against the sky.
  ctx.fillStyle = 'rgba(70, 74, 96, 0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // The lit part, clipped to its shape, with the man in the moon on it.
  if (lit > 0.005) {
    litShape(ctx, x, y, r, phase);
    ctx.clip();
    ctx.fillStyle = '#efe9d4';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(160, 155, 140, 0.45)';
    for (const [dx, dy, s] of [[-7, -5, 6], [6, -8, 4], [4, 6, 7], [-8, 9, 3]]) {
      ctx.beginPath();
      ctx.arc(x + (dx * r) / 22, y + (dy * r) / 22, (s * r) / 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * The lit part as a path: the half of the disc facing the sun (right while
 * waxing, left while waning), with the terminator, the line between light
 * and dark, as a half ellipse across it. Its width is r·|cos 2π·phase|: the
 * whole radius at new and full, nothing at the quarters. Before a quarter
 * it cuts into the lit half (a crescent); after, it bulges past the middle
 * (gibbous).
 */
function litShape(ctx, x, y, r, phase) {
  const side = phase < 0.5 ? 1 : -1; // which half faces the sun: 1 right, -1 left
  const c = Math.cos(2 * Math.PI * phase); // 1 new, 0 quarter, -1 full
  const tw = r * Math.abs(c);
  const crescent = c > 0;
  ctx.beginPath();
  // The bright limb: top to bottom round the sunward side.
  ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, side < 0);
  // The terminator, bottom back to top: bowing toward the sunward side for
  // a crescent, away from it for a gibbous moon.
  const bowsRight = crescent ? side > 0 : side < 0;
  ctx.ellipse(x, y, Math.max(0.01, tw), r, 0, Math.PI / 2, -Math.PI / 2, bowsRight);
  ctx.closePath();
}
