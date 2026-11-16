// Builds the game's music from the originals in source/music/ into
// public/music/, for every track listed in src/music/index.js. Run after
// adding or changing a track:
//
//   npm run music
//
// A track whose `file` ends in .mp3 is converted with ffmpeg (192 kbps,
// tags kept): smaller than the FLAC originals, labelled as audio by every
// web server, and playable in every browser and in GameMaker. Any other
// file type is copied as it is. A file already newer than its original is
// left alone.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TRACKS } from '../src/music/index.js';

const SRC = new URL('../../source/music/', import.meta.url);
const PUBLIC = new URL('../public/', import.meta.url);
const BITRATE = '192k';

let failed = 0;
for (const [id, track] of Object.entries(TRACKS)) {
  const from = new URL(track.source, SRC);
  if (!existsSync(from)) {
    console.error(`  ✗ ${id}: no source/music/${track.source}`);
    failed++;
    continue;
  }
  const to = new URL(track.file, PUBLIC);
  mkdirSync(new URL('.', to), { recursive: true });

  const fresh = existsSync(to) && statSync(to).mtimeMs >= statSync(from).mtimeMs;
  if (!fresh) {
    if (track.file.endsWith('.mp3')) {
      try {
        execFileSync(
          'ffmpeg',
          ['-y', '-loglevel', 'error', '-i', fileURLToPath(from), '-vn', '-map_metadata', '0', '-codec:a', 'libmp3lame', '-b:a', BITRATE, '-id3v2_version', '3', fileURLToPath(to)],
          { stdio: 'inherit' },
        );
      } catch {
        console.error(`  ✗ ${id}: ffmpeg couldn't convert it (is ffmpeg installed?)`);
        failed++;
        continue;
      }
    } else {
      copyFileSync(from, to);
    }
  }
  console.log(`  ${track.file}  (${(statSync(to).size / 1e6).toFixed(1)} MB)  ${track.title}${fresh ? '  (up to date)' : ''}`);
}
if (failed) process.exit(1);
