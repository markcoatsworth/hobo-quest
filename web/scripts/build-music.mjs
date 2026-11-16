// Copies the music listed in src/music/index.js from source/music/ into
// public/music/ for the web build. Run after adding or changing a track:
//
//   npm run music
//
// Tracks are copied as they are (FLAC plays in every current browser). To
// ship smaller files, convert the originals to MP3 or Ogg and point each
// track's `source` and `file` at the converted version.

import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { TRACKS } from '../src/music/index.js';

const SRC = new URL('../../source/music/', import.meta.url);
const PUBLIC = new URL('../public/', import.meta.url);

let missing = 0;
for (const [id, track] of Object.entries(TRACKS)) {
  const from = new URL(track.source, SRC);
  if (!existsSync(from)) {
    console.error(`  ✗ ${id}: no source/music/${track.source}`);
    missing++;
    continue;
  }
  const to = new URL(track.file, PUBLIC);
  mkdirSync(new URL('.', to), { recursive: true });
  copyFileSync(from, to);
  console.log(`  ${track.file}  (${(statSync(to).size / 1e6).toFixed(1)} MB)  ${track.title}`);
}
if (missing) process.exit(1);
