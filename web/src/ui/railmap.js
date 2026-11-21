// The rail map: the lower 48 from the source rail map, the network on it,
// the trail ridden so far, the lines out of where you are, and every city.
// Drawn full size on the map screen (src/scenes/map.js) and small, to look
// at only, in the journal (src/ui/journal.js).

import { FONTS } from '../core/screen.js';
import { LOCATIONS } from '../locations/index.js';
import { rail_leg_path, rail_lines } from '../systems/rail.js';

// The part of the source image shown: the lower 48.
const SRC_X = 20;
const SRC_Y = 60;
export const MAP_SRC_W = 1080;
export const MAP_SRC_H = 740;

const ROUTE_INK = '#9e2b25';

// Label placement per city: [dx, dy, align], at full size.
const LABELS = {
  new_york: [10, -6, 'left'],
  philadelphia: [10, 4, 'left'],
  washington_dc: [-10, 8, 'right'],
  cleveland: [6, 14, 'left'],
  chicago: [-8, 12, 'right'],
  kansas_city: [0, -12, 'center'],
  nashville: [10, 4, 'left'],
  clarksdale: [10, 10, 'left'],
  dallas: [0, 20, 'center'],
  el_paso: [0, -14, 'center'],
  phoenix: [0, 20, 'center'],
  los_angeles: [8, 18, 'left'],
  oklahoma_city: [-10, 4, 'right'],
  albuquerque: [0, -12, 'center'],
  flagstaff: [0, -12, 'center'],
  buffalo: [-8, -8, 'right'],
  toledo: [0, -12, 'center'],
};

const images = {};
function image(name) {
  if (!images[name]) {
    images[name] = new Image();
    images[name].src = `./map/${name}.png`;
  }
  return images[name];
}

/**
 * Draw the map with the source crop's top-left at (x, y), s screen pixels
 * to a source pixel (0.82 fills the map screen). t: seconds, for the pulse
 * on where you are.
 */
export function drawRailMap(ctx, journey, { x, y, s }, t = 0) {
  const here = journey.at;
  const toScreen = ([px, py]) => [x + (px - SRC_X) * s, y + (py - SRC_Y) * s];
  const size = s / 0.82; // labels and lines scale with the map, from full size

  const land = image('land');
  const rails = image('rails');
  if (land.complete && land.naturalWidth) {
    const dx = x - SRC_X * s;
    const dy = y - SRC_Y * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10, y - 10, MAP_SRC_W * s + 20, MAP_SRC_H * s + 10);
    ctx.clip();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18 * size;
    ctx.shadowOffsetY = 4 * size;
    ctx.drawImage(land, dx, dy, land.naturalWidth * s, land.naturalHeight * s);
    ctx.shadowColor = 'transparent';
    if (rails.complete) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(rails, dx, dy, rails.naturalWidth * s, rails.naturalHeight * s);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // The whole network faintly, the lines out of here stronger, the trail
  // ridden so far solid.
  const out = (LOCATIONS[here]?.yard?.trains ?? []).map((tr) => tr.to);
  const stroke = (pts, alpha, dashed) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ROUTE_INK;
    ctx.lineWidth = (dashed ? 3 : 4.5) * Math.max(0.6, size);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dashed) ctx.setLineDash([8 * size, 7 * size]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [sx, sy] = toScreen(p);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.stroke();
    ctx.restore();
  };
  for (const line of rail_lines()) {
    const fromHere = line.from === here && out.includes(line.to);
    stroke(rail_leg_path(line.from, line.to), fromHere ? 0.85 : 0.25, true);
  }
  const trail = journey.trail;
  for (let i = 0; i < trail.length - 1; i++) stroke(rail_leg_path(trail[i], trail[i + 1]), 1, false);

  // Every city; the ones reached, and the ones a freight from here goes to, in full ink.
  for (const id of Object.keys(LOCATIONS)) {
    const [cx, cy] = toScreen(LOCATIONS[id].at);
    const isHere = id === here;
    const inked = isHere || trail.includes(id) || out.includes(id);
    ctx.save();
    if (isHere) {
      const pulse = (t * 1.2) % 1;
      ctx.strokeStyle = `rgba(158, 43, 37, ${1 - pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, (7 + pulse * 16) * size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = inked ? '#1a1110' : 'rgba(26,17,16,0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, (isHere ? 6 : 4.5) * Math.max(0.7, size), 0, Math.PI * 2);
    ctx.fill();
    const [dx, dy, align] = LABELS[id] ?? [0, -12, 'center'];
    ctx.font = `${isHere ? 'bold ' : ''}${Math.max(11, Math.round(15 * size))}px ${FONTS.body}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(236, 219, 182, 0.85)';
    ctx.strokeText(LOCATIONS[id].name, cx + dx * size, cy + dy * size);
    ctx.fillStyle = inked ? '#1a1110' : 'rgba(26,17,16,0.45)';
    ctx.fillText(LOCATIONS[id].name, cx + dx * size, cy + dy * size);
    ctx.restore();
  }
}
