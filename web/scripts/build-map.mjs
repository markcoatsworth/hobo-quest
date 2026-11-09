// Turns the reference rail map (source/usa-rail-network-2010.png) into the
// two layers the in-game map draws: the land silhouette of the lower 48 and
// the rail lines inside it. Run after changing the source image:
//
//   node scripts/build-map.mjs
//
// Outputs public/map/land.png and public/map/rails.png, both at the source
// image's size, so the city coordinates in src/data/routes.js (measured in
// source-image pixels) line up with them.

import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const SRC = new URL('../../source/usa-rail-network-2010.png', import.meta.url);
const OUT = new URL('../public/map/', import.meta.url);

const src = PNG.sync.read(readFileSync(SRC));
const { width: w, height: h, data } = src;

const PEACH = [248, 222, 198]; // US land fill in the source
const WATER = [187, 227, 250];
const near = (i, c, tol) =>
  Math.abs(data[i] - c[0]) + Math.abs(data[i + 1] - c[1]) + Math.abs(data[i + 2] - c[2]) < tol;
const isRail = (i) => data[i] - data[i + 1] > 35 && data[i + 2] - data[i + 1] > 25; // purple

// 1. Raw land: the peach fill. Rails, state lines, labels and city dots
// punch holes in it, which step 2 closes.
let land = new Uint8Array(w * h);
for (let p = 0; p < w * h; p++) land[p] = near(p * 4, PEACH, 40) ? 1 : 0;

// The legend box (bottom left) sits over the Pacific; keep it out.
for (let y = 676; y < h; y++) for (let x = 0; x < 248; x++) land[y * w + x] = 0;

// 2. Morphological closing (dilate, then erode) with a square kernel —
// separable max/min filters. Radius 5 seals the thickest rail lines.
function filter(mask, r, grow) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  const pick = grow ? (a, b) => a | b : (a, b) => a & b;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        v = pick(v, mask[y * w + xx]);
      }
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = grow ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        v = pick(v, tmp[yy * w + x]);
      }
      out[y * w + x] = v;
    }
  return out;
}
land = filter(filter(land, 5, true), 5, false);

// 3. Fill holes. Each enclosed patch of not-land stays water only if it
// touches the image edge (ocean, Canada, Mexico) or holds a lot of
// water-coloured pixels (a lake the closing in step 2 sealed off, e.g. Lake
// Michigan at the Straits of Mackinac). The rest, city labels and their
// halos, becomes land.
{
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || land[start]) continue;
    const patch = [];
    const stack = [start];
    let edge = false;
    let water = 0;
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      patch.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      if (near(p * 4, WATER, 30)) water++;
      for (const q of [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w]) {
        if (q !== false && !seen[q] && !land[q]) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    if (!edge && water < 1500) for (const p of patch) land[p] = 1;
  }
}

// 4. Write the layers. Colours are placeholders the game tints over.
const landPng = new PNG({ width: w, height: h });
const railPng = new PNG({ width: w, height: h });
for (let p = 0; p < w * h; p++) {
  const o = p * 4;
  landPng.data[o] = 236;
  landPng.data[o + 1] = 219;
  landPng.data[o + 2] = 182;
  landPng.data[o + 3] = land[p] ? 255 : 0;

  // Rail ink, strength from how purple the source pixel is (keeps the
  // antialiasing), only inside the US.
  railPng.data[o] = 74;
  railPng.data[o + 1] = 46;
  railPng.data[o + 2] = 36;
  let a = 0;
  if (land[p] && isRail(o)) a = Math.min(255, (data[o] - data[o + 1]) * 2.2);
  railPng.data[o + 3] = a;
}
writeFileSync(new URL('land.png', OUT), PNG.sync.write(landPng));
writeFileSync(new URL('rails.png', OUT), PNG.sync.write(railPng));
console.log(`wrote public/map/land.png and rails.png (${w}x${h})`);
