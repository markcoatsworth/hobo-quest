// Music: a shuffled playlist for whichever region the player is in, and
// particular songs played on cue (see src/music/index.js). The title screen
// is silent; music starts when a region is set (arriving on the map) or a
// song is cued (New Game's opening cutscene).
//
// A cued song plays to its end, however the player moves between scenes,
// then the region's playlist carries on. Moving to a region with its own
// playlist fades out the old region's song and starts the new one. Changes
// of song fade rather than cut.
//
// Browsers won't start sound until the player has pressed a key or clicked
// (a gamepad button doesn't count), so a song may wait for that.

import { MUSIC_STEPS, settings_get, settings_on } from './settings.js';
import { PLAYLISTS, TRACKS } from '../music/index.js';

const VOLUME = 0.55; // full volume, with the music setting at its top step
const FADE = 1.5; // seconds to fade a song out when another takes over
const STEP = 50; // ms between fade steps

let region = null; // the playlist in use: a key of PLAYLISTS
let current = null; // { id, audio, cued }
let lastId = null;
let blocked = false; // waiting for the player's first key or click

/** The volume the music plays at, from the player's settings. */
function level() {
  const s = settings_get();
  return s.muted ? 0 : (VOLUME * s.music) / MUSIC_STEPS;
}

// Volume and mute apply straight away to whatever's playing.
settings_on(() => {
  if (current) current.audio.volume = level();
});

/**
 * Follow the journey: the region is the latest city on the trail (src/core/
 * save.js) with a playlist of its own, so a city without one keeps the
 * music of the last city that had one, after a Continue too.
 */
export function music_follow_trail(trail) {
  for (let i = trail.length - 1; i >= 0; i--) {
    if (PLAYLISTS[trail[i]]?.length) return music_set_region(trail[i]);
  }
}

/**
 * Use this city's playlist. Its music takes over (after any cued song
 * finishes); if it's already the region, just make sure something plays.
 */
export function music_set_region(cityId) {
  if (!PLAYLISTS[cityId]?.length) return;
  if (cityId === region) {
    if (!current) startTrack(pickNext());
    return;
  }
  region = cityId;
  if (!current) startTrack(pickNext());
  else if (!current.cued) {
    fadeOut(current.audio);
    current = null;
    startTrack(pickNext());
  }
  // A cued song carries on; the new region's playlist follows it.
}

/** Play this track now, fading out whatever's on. The region's playlist resumes when it ends. */
export function music_play(id) {
  if (!TRACKS[id]) return;
  if (current) fadeOut(current.audio);
  current = null;
  startTrack(id, true);
}

/** The track playing (or waiting to play), or null. */
export function music_current() {
  return current?.id ?? null;
}

/** The region whose playlist is in use, or null. */
export function music_region() {
  return region;
}

// ------------------------------------------------------------------ inside

function pickNext() {
  const ids = PLAYLISTS[region] ?? [];
  if (!ids.length) return null;
  const choices = ids.length > 1 ? ids.filter((id) => id !== lastId) : ids;
  return choices[Math.floor(Math.random() * choices.length)];
}

function startTrack(id, cued = false) {
  if (!id) return;
  const audio = new Audio(TRACKS[id].file);
  audio.volume = level();
  audio.preload = 'auto';
  const track = { id, audio, cued };
  current = track;
  lastId = id;

  audio.addEventListener('ended', () => {
    if (current === track) {
      current = null;
      startTrack(pickNext());
    }
  });
  // Missing or unplayable: skip it, without spinning if they all fail.
  audio.addEventListener('error', () => {
    if (current !== track) return;
    current = null;
    setTimeout(() => {
      if (!current) startTrack(pickNext());
    }, 3000);
  });
  tryPlay(track);
}

function tryPlay(track) {
  track.audio.play().catch((err) => {
    if (err?.name !== 'NotAllowedError') return;
    // Not allowed until the player interacts: try again then.
    if (!blocked) {
      blocked = true;
      for (const type of ['keydown', 'pointerdown', 'touchend']) window.addEventListener(type, unblock, { once: true });
    }
  });
}

function unblock() {
  if (!blocked) return;
  blocked = false;
  for (const type of ['keydown', 'pointerdown', 'touchend']) window.removeEventListener(type, unblock);
  // Give the game a frame to act on this key first, in case it changes the song.
  setTimeout(() => {
    if (current && current.audio.paused) tryPlay(current);
  }, 100);
}

function fadeOut(audio) {
  const drop = Math.max(0.001, (audio.volume * STEP) / (FADE * 1000));
  const timer = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - drop);
    if (audio.volume <= 0 || audio.paused) {
      clearInterval(timer);
      audio.pause();
      audio.src = '';
    }
  }, STEP);
}
