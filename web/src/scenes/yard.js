// A rail yard, seen from above, by day or night (src/systems/clock.js).
// Start at the west fence, find out which of the waiting freights goes where, and reach the open boxcar on the one you
// want before it pulls out. Bulls (railroad police) patrol with lanterns;
// parked cars block their view, shunting cuts of cars will knock you flat.
// A standing freight is a wall from fence to fence, but you can climb
// across between two of its cars: slowly, in plain view, and if it starts
// to move while you're on the coupling, you're thrown clear.
//
// The tracks are numbered from the west, the main line at the east fence
// last. Several freights leave at different times, and nothing says which
// is which: a card tacked to a car gives its destination; the board in the
// yard office window lists each engine number with where it's bound and
// when; and an engine's number plate says which train is which. What Scout
// learns goes in a notebook (journey.yardNotes), kept for next time.
//
// Each yard is laid out in its own file, src/locations/<id>/yard.js, which
// can also bring its own behaviour through hooks: setup(yard) once on the
// way in (it can add `obstacles`), update(yard, dt) every frame, draw.ground
// and draw.over for its own pictures, and `clues` for extra things to read.
// The scene is passed in as `yard`; yard.top / yard.bottom are the fences.

import { drawPrompts } from '../core/prompts.js';
import { seeded } from '../core/rng.js';
import { saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { Menu } from '../core/menu.js';
import { LOCATIONS } from '../locations/index.js';
import { AreaScene } from './area.js';
import { MapScene } from './map.js';
import { TravelScene } from './travel.js';
import { panel, TitleScene } from './title.js';
import { PauseMenu } from '../ui/pause.js';
import { drawStatusPlate } from '../ui/status.js';
import {
  CLOCK_RATE,
  MINUTES_PER_DAY,
  RELEASED,
  clock_format,
  clock_hour,
  clock_next,
  clock_next_departure,
  clock_now,
  clock_set,
  clock_yard_every,
} from '../systems/clock.js';
import { DARKEST, mix, sky_dark } from '../art/sky.js';
import { dialog_open } from '../ui/dialog.js';
import { CHARACTERS } from '../characters/index.js';
import { party_has } from '../systems/party.js';

const TOP = 72; // fence lines
const BOTTOM = 676;
const START_X = 50;
const DEPART_X = 1185;

const CAR_W = 44;
const CAR_L = 100;
const CAR_GAP = 6;

const PLAYER_R = 11;
const WALK = 135;
const SPRINT = 215;
const STAMINA_DRAIN = 0.45; // per second sprinting; full bar = 1
const STAMINA_REGEN = 0.28;

const BULL_R = 12;
const BULL_PATROL = 62;
const BULL_CHASE = 178;
const VIEW_RANGE = 215; // at night, by lantern
const DAY_SIGHT = 0.3; // how much further a bull sees by daylight
const VIEW_HALF = 0.62; // radians either side of facing
const HEAR_RANGE = 46; // notices you this close, whatever way he faces
const CATCH_RANGE = 22;

const HOP_RANGE = 34;
const CLIMB_TIME = 1.4; // seconds to climb across a coupling between two cars
const CLIMB_REACH = 24; // how close (up and down the train) to a coupling to climb it
const MEET_RANGE = 56; // how close someone waiting in the yard lets Scout get before they speak
const TRAIN_ACCEL = 11; // px/s² once it departs
const TRAIN_MAX = 95;

// Car letters in a city's yard layout (see src/locations/index.js).
const CAR_TYPES = {
  B: { kind: 'box', color: '#6b2e22' },
  b: { kind: 'box', color: '#4e3a2c' },
  R: { kind: 'box', color: '#cbbf98' }, // refrigerator car
  T: { kind: 'tank' },
  G: { kind: 'gon' },
  E: { kind: 'engine' },
};
const DEFAULT_TRAIN = 'EBBTBRBGBBTBRBB';
const SLOT = CAR_L + CAR_GAP;
const FIRST_SLOT_Y = TOP - 20;
const CUT_PAUSE = 2.5; // seconds a shunting cut waits off-screen before coming back
const BULL_WAIT = 2; // seconds a bull stands at each end of his beat
// The yard works around the clock; its clock runs at CLOCK_RATE.yard and
// each freight leaves on a repeating schedule (src/systems/clock.js).
const READ_RANGE = 38; // how close to a card, plate or window to read it
const GATE_Y_SPAN = 46; // the town gate in the west fence, either side of where you come in
const OFFICE_W = 80;
const OFFICE_H = 56;

/** A minute of the day as "9:45 p.m." (clock_format, by its yard name). */
export const yard_clock = clock_format;

/**
 * What's in the notebook about a yard: { cards: { track: to }, plates: { track: number }, board }.
 * `cards` holds every destination learned for a track, from a card or any other clue.
 */
export function yard_notes(journey, cityId) {
  journey.yardNotes ??= {};
  journey.yardNotes[cityId] ??= { cards: {}, plates: {}, board: false };
  return journey.yardNotes[cityId];
}

/** Where a train is bound, as far as the notebook knows: { to, how } or null. */
export function yard_known(notes, train) {
  if (notes.cards[train.track]) return { to: notes.cards[train.track], how: 'card' };
  if (notes.board && notes.plates[train.track] === train.number) return { to: train.def.to, how: 'board' };
  return null;
}

export class YardScene {
  constructor(game, journey) {
    this.game = game;
    this.journey = journey;
    this.from = journey.at;
    this.layout = LOCATIONS[this.from].yard;
    this.notes = yard_notes(journey, this.from);
    this.to = null; // set by the train you board
    this.focus = null; // the thing within reach: a door, a card, a plate, the board
    this.notice = null; // what you just read: { title, lines, t }
    this.t = 0; // seconds in the yard, for animation
    this.outcome = null; // 'boarded' | 'caught' | 'missed'

    // The clock carries on from whenever Scout walks in (src/systems/clock.js);
    // every freight here is made up for its next run.
    this.start = clock_now(journey);
    this.minutes = 0; // since walking in
    this.every = clock_yard_every(this.layout);
    this.paused = null; // Menu while paused
    this.intro = 2.5; // seconds of title banner

    this.build();
  }

  // ---------------------------------------------------------------- layout

  /** Lay the yard out exactly as the city's module describes it. */
  build() {
    const { tracks, bulls, player, office } = this.layout;

    // Numbered from the west; the main line along the east fence comes last.
    this.trackXs = [...tracks.map((t) => t.x), DEPART_X];
    this.parked = []; // static car rects
    this.cuts = []; // moving cuts of cars
    for (const track of tracks) {
      if (track.moving) {
        const cars = [...track.moving].map((c) => makeCar(c, track.x, 0));
        this.cuts.push({
          x: track.x,
          dir: track.dir,
          speed: track.speed,
          cars,
          len: cars.length * SLOT,
          head: track.at,
          pause: 0,
        });
      } else if (track.cars) {
        [...track.cars].forEach((c, j) => {
          if (c !== '.') this.parked.push(makeCar(c, track.x, FIRST_SLOT_Y + j * SLOT));
        });
      }
    }

    // Each freight's next run.
    this.trains = this.layout.trains.map((def) => this.buildTrain(def));
    this.office = office ? { x: office.x - OFFICE_W / 2, y: office.y - OFFICE_H / 2, w: OFFICE_W, h: OFFICE_H } : null;
    // For the yard's own hooks: the fences, and anything solid they add.
    this.gateY = player; // the gate to town is where you came in
    // Someone waiting here to join the party, until they have.
    const m = this.layout.meet;
    this.meet = m && !party_has(this.journey, m.joins) ? { ...m, name: m.name ?? CHARACTERS[m.joins].name, look: m.look ?? CHARACTERS[m.joins].look } : null;
    this.top = TOP;
    this.bottom = BOTTOM;
    this.obstacles = [];

    this.bulls = bulls.map((b, i) => ({
      x: b.x,
      y: b.y,
      homeX: b.x,
      dir: b.dir, // walking south (+1) or north (-1)
      facing: b.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
      state: 'patrol', // patrol | wait | suspicious | chase | search | return
      timer: 0,
      alert: 0, // 0..1, chase at 1
      lastSeen: null,
      lostFor: 0,
      sweep: i * 2.3, // phase of his lantern sweep
    }));

    this.layout.setup?.(this);

    this.player = {
      x: START_X,
      y: player,
      facing: 0,
      stamina: 1,
      stun: 0,
      sprinting: false,
      step: 0,
    };
  }

  layoutCut(cut) {
    // The engine leads in the direction of travel.
    cut.cars.forEach((car, i) => {
      car.y = cut.dir > 0 ? cut.head - CAR_L - i * (CAR_L + CAR_GAP) : cut.head + i * (CAR_L + CAR_GAP);
    });
  }

  buildTrain(def) {
    // A long freight heading south (down the screen), engine at the bottom,
    // the rest stretching north past the fence.
    const { cars: letters = DEFAULT_TRAIN, open } = def;
    const track = def.track ?? this.trackXs.length;
    const x = this.trackXs[track - 1];
    const cars = [];
    let y = BOTTOM - 40;
    [...letters].forEach((c, i) => {
      if (i === 0) {
        cars.push({ ...makeCar(c, x, y), h: 120 });
        y -= CAR_GAP;
        return;
      }
      y -= SLOT;
      const car = makeCar(i === open ? 'B' : c, x, y);
      if (i === open) car.open = true;
      cars.push(car);
    });
    if (def.card != null) cars[def.card].card = true;
    return {
      def,
      track,
      x,
      number: def.number,
      cars,
      departAt: clock_next_departure(def.departs, this.every, this.start), // on the clock
      departIn: clock_next_departure(def.departs, this.every, this.start) - this.start, // minutes from now
      speed: 0,
      openCar: cars[open],
      cardCar: def.card != null ? cars[def.card] : null,
      gone: false,
    };
  }

  // -------------------------------------------------------------- geometry

  /** Every rect that blocks movement and sight, this frame. */
  blockers() {
    const list = this.parked.slice();
    for (const cut of this.cuts) list.push(...cut.cars);
    for (const train of this.trains) if (!train.gone) list.push(...train.cars);
    if (this.office) list.push(this.office);
    list.push(...this.obstacles);
    return list;
  }

  door(train) {
    const car = train.openCar;
    return { x: car.x - 6, y: car.y + car.h / 2 };
  }

  // ---------------------------------------------------------------- update

  update(dt, input, pointer) {
    if (this.outcome) return this.updateOutcome(dt, input, pointer);

    if (this.paused) {
      const choice = this.paused.update(dt, input, pointer);
      if (choice === 'resume') this.paused = null;
      else if (choice === 'title') this.game.setScene(new TitleScene(this.game));
      return;
    }
    if (input.pressed('pause')) {
      // No way out from here: back to town is through the gate, on foot.
      this.paused = new PauseMenu(this.game, [{ id: 'title', label: 'Quit to Title' }]);
      return;
    }

    this.t += dt;
    this.minutes += dt * CLOCK_RATE.yard;
    clock_set(this.journey, this.start + this.minutes);
    this.intro = Math.max(0, this.intro - dt);
    const blockers = this.blockers();

    this.updateTrains(dt);
    this.updateCuts(dt);
    this.layout.update?.(this, dt);
    if (this.climb) this.updateClimb(dt);
    else this.updatePlayer(dt, input, blockers);
    for (const bull of this.bulls) this.updateBull(bull, dt, blockers);
    if (this.notice) {
      // Something read stays up while you're there, and fades once you step away.
      const at = this.notice.at;
      if (at && Math.hypot(this.player.x - at.x, this.player.y - at.y) <= at.range) this.notice.t = Math.max(this.notice.t, 0.5);
      else if (at) this.notice.t = Math.min(this.notice.t, 0.5);
      this.notice.t -= dt;
    }
    if (this.outcome) return;

    // Every freight gone without you.
    if (this.trains.every((t) => t.gone)) return this.finish('missed');

    // Someone waiting in the yard (its `meet`) stops Scout on the way past,
    // and talks (src/ui/dialog.js: the yard holds still till they're done).
    const m = this.meet;
    if (m && !this.climb && Math.hypot(this.player.x - m.x, this.player.y - m.y) < MEET_RANGE) {
      this.focus = null;
      this.intro = 0; // the yard's name banner gives way
      this.meet = null; // they join at the end, however it ends
      dialog_open(this.game, { name: m.name, lines: m.lines, joins: m.joins, journey: this.journey });
      this.met = m; // still drawn, facing Scout, while they talk
      return;
    }

    // Whatever's in reach: hop aboard, or read something.
    this.focus = this.climb ? null : this.nearest();
    this.canHop = this.focus?.kind === 'hop';
    // Space on a keyboard (A on a controller): Enter is for menus.
    if (this.focus && input.pressed('act')) this.act(this.focus);
  }

  updateTrains(dt) {
    const p = this.player;
    for (const train of this.trains) {
      if (train.gone) continue;
      train.departIn -= dt * CLOCK_RATE.yard;
      if (train.departIn > 0) continue;
      train.speed = Math.min(TRAIN_MAX, train.speed + TRAIN_ACCEL * dt);
      for (const car of train.cars) car.y += train.speed * dt;
      // Out of the yard once its open door has gone past the south fence.
      if (train.openCar.y > BOTTOM + 30) train.gone = true;
      // A train pulling out shoves anyone standing on its track.
      for (const car of train.cars) {
        if (circleRect(p.x, p.y, PLAYER_R, car)) {
          p.x = p.x < train.x ? car.x - PLAYER_R - 2 : car.x + car.w + PLAYER_R + 2;
          if (p.stun <= 0) {
            p.stun = 0.9;
            this.game.input.rumble(200, 0.8, 0.6);
          }
        }
      }
    }
  }

  // ------------------------------------------------------------- climbing

  /**
   * The couplings of standing freights you could climb across from here:
   * between two cars, inside the fences, with clear ground on the far side.
   */
  couplings(blockers) {
    const p = this.player;
    const reach = CAR_W / 2 + PLAYER_R + 8;
    const out = [];
    for (const train of this.trains) {
      if (train.gone || train.departIn <= 0 || Math.abs(p.x - train.x) > reach) continue;
      const side = p.x < train.x ? -1 : 1;
      const landX = train.x - side * (CAR_W / 2 + PLAYER_R + 3);
      for (let i = 0; i < train.cars.length - 1; i++) {
        const below = train.cars[i];
        const above = train.cars[i + 1];
        const y = (below.y + above.y + above.h) / 2;
        if (y < TOP + PLAYER_R + 4 || y > BOTTOM - PLAYER_R - 4) continue;
        if (blockers.some((r) => circleRect(landX, y, PLAYER_R, r))) continue;
        out.push({ train, x: train.x + side * (CAR_W / 2 + PLAYER_R), y, landX });
      }
    }
    return out;
  }

  /** On the coupling: across in CLIMB_TIME, unless the train moves first. */
  updateClimb(dt) {
    const c = this.climb;
    const p = this.player;
    c.t += dt;
    if (c.train.departIn <= 0) {
      // She's moving: thrown back off the coupling where you came from.
      p.x = c.fromX;
      p.y = c.y;
      p.stun = 1.4;
      this.climb = null;
      this.game.input.rumble(300, 1, 0.8);
      this.notice = { title: 'Thrown clear', lines: ['The freight lurched as you climbed. Back where you started.'], t: 3 };
      return;
    }
    const k = Math.min(1, c.t / CLIMB_TIME);
    p.x = c.fromX + (c.landX - c.fromX) * k;
    p.y = c.y;
    p.step += dt * 6;
    if (k >= 1) this.climb = null;
  }

  // ------------------------------------------------------------- sleuthing

  /** The closest thing in reach: an open door to hop, a card, a plate, the office window. */
  nearest() {
    const p = this.player;
    if (p.stun > 0) return null;
    const options = [];
    for (const train of this.trains) {
      if (train.gone) continue;
      const d = this.door(train);
      options.push({ kind: 'hop', train, x: d.x, y: d.y, range: HOP_RANGE, verb: 'Hop on' });
      if (train.cardCar) {
        const c = train.cardCar;
        options.push({ kind: 'card', train, x: c.x - 10, y: c.y + 26, range: READ_RANGE, verb: 'Read the card' });
      }
      // The engine's number plate, on the bit of it inside the yard.
      const engine = train.cars[0];
      if (engine.y < BOTTOM - 10) options.push({ kind: 'plate', train, x: engine.x - 10, y: Math.min(engine.y + 24, BOTTOM - 20), range: READ_RANGE, verb: 'Read the engine number' });
    }
    // Couplings of standing freights, to climb across.
    for (const c of this.couplings(this.blockers())) {
      options.push({ kind: 'climb', coupling: c, x: c.x, y: c.y, range: CLIMB_REACH, verb: 'Climb between the cars' });
    }
    // The gate back to town, where you came in.
    options.push({ kind: 'leave', x: 14, y: this.gateY, range: 34, verb: 'Back to town' });
    // The yard's own things to read (its yard.js `clues`).
    for (const clue of this.layout.clues ?? []) {
      options.push({ kind: 'clue', clue, x: clue.x, y: clue.y, range: clue.range ?? READ_RANGE, verb: clue.verb ?? 'Take a look' });
    }
    if (this.office) {
      const o = this.office;
      options.push({ kind: 'board', x: o.x + o.w + 14, y: o.y + o.h / 2, range: READ_RANGE + 6, verb: 'Read the board' });
    }
    let best = null;
    for (const o of options) {
      const d = Math.hypot(p.x - o.x, p.y - o.y);
      if (d > o.range) continue;
      // Hopping on wins over reading, then whatever's closest.
      const score = d - (o.kind === 'hop' ? 1000 : 0);
      if (!best || score < best.score) best = { ...o, score };
    }
    return best;
  }

  /** Do the thing in reach: board, or read and note it down. */
  act(f) {
    const names = (id) => LOCATIONS[id].name;
    if (f.kind === 'hop') return this.finish('boarded', f.train);
    if (f.kind === 'leave') {
      // Not with a bull on your heels: he'd follow you straight out.
      if (this.bulls.some((b) => b.state === 'chase')) {
        this.notice = { title: 'Not now', lines: ['There’s a bull on your heels.'], t: 2.5 };
        return;
      }
      const town = LOCATIONS[this.from].town;
      return this.game.setScene(new AreaScene(this.game, this.journey, this.from, 'town', { at: town.yardSign, facing: -1 }));
    }
    if (f.kind === 'climb') {
      const c = f.coupling;
      this.climb = { train: c.train, fromX: this.player.x, landX: c.landX, y: c.y, t: 0 };
      this.focus = null;
      return;
    }
    if (f.kind === 'card') {
      this.notes.cards[f.train.track] = f.train.def.to;
      this.notice = { title: `Track ${f.train.track}`, lines: [`A card tacked to the car: ${names(f.train.def.to).toUpperCase()}`], t: 1 };
    } else if (f.kind === 'plate') {
      this.notes.plates[f.train.track] = f.train.number;
      this.notice = { title: `Track ${f.train.track}`, lines: [`Engine No. ${f.train.number}`], t: 1 };
    } else if (f.kind === 'clue') {
      const c = f.clue;
      // A clue can tell the notebook where the freight on a track is bound.
      if (c.learn) this.notes.cards[c.learn.track] = c.learn.to;
      this.notice = { title: c.title, lines: c.lines, t: 1 };
    } else if (f.kind === 'board') {
      this.notes.board = true;
      // Each freight's next run, gone or not.
      const lines = [...this.trains]
        .sort((a, b) => a.departAt - b.departAt)
        .map((t) => `No. ${t.number}   ${names(t.def.to)}   ${yard_clock(t.departAt % MINUTES_PER_DAY)}`);
      this.notice = { title: 'The yard office board', lines, t: 1 };
    }
    // Pinned to what was read: it goes when you walk away from it.
    this.notice.at = { x: f.x, y: f.y, range: f.range };
    saveJourney(this.journey);
  }

  /** Minutes on the yard clock now. */
  /** How dark it is: 0 by day, 1 at night (src/art/sky.js). */
  get night() {
    return sky_dark(clock_hour(this.start + this.minutes)) / DARKEST;
  }

  /** How far a bull sees: by lantern at night, further by day. */
  get viewRange() {
    return VIEW_RANGE * (1 + DAY_SIGHT * (1 - this.night));
  }

  /** The time of day, in minutes after midnight. */
  get clock() {
    return (this.start + this.minutes) % MINUTES_PER_DAY;
  }

  updateCuts(dt) {
    for (const cut of this.cuts) {
      if (cut.pause > 0) {
        cut.pause -= dt;
      } else {
        cut.head += cut.dir * cut.speed * dt;
        // Once fully off one end, wait a moment and come back the other way.
        const off = cut.dir > 0 ? cut.head - cut.len > BOTTOM + 20 : cut.head + cut.len < TOP - 20;
        if (off) {
          cut.dir = -cut.dir;
          cut.pause = CUT_PAUSE;
        }
      }
      this.layoutCut(cut);
    }
    // Shunting cars shove anyone standing on the track.
    for (const cut of this.cuts) {
      for (const car of cut.cars) {
        const p = this.player;
        if (circleRect(p.x, p.y, PLAYER_R, car)) {
          p.x = p.x < cut.x ? car.x - PLAYER_R - 2 : car.x + car.w + PLAYER_R + 2;
          if (p.stun <= 0) {
            p.stun = 0.9;
            this.game.input.rumble(200, 0.8, 0.6);
          }
        }
        for (const b of this.bulls) {
          if (circleRect(b.x, b.y, BULL_R, car)) b.x = b.x < cut.x ? car.x - BULL_R - 2 : car.x + car.w + BULL_R + 2;
        }
      }
    }
  }

  updatePlayer(dt, input, blockers) {
    const p = this.player;
    if (p.stun > 0) {
      p.stun -= dt;
      p.sprinting = false;
      return;
    }
    const move = input.move();
    const mag = Math.hypot(move.x, move.y);
    p.sprinting = input.down('sprint') && mag > 0.1 && p.stamina > 0;
    if (p.sprinting) p.stamina = Math.max(0, p.stamina - STAMINA_DRAIN * dt);
    else p.stamina = Math.min(1, p.stamina + STAMINA_REGEN * dt);
    const speed = p.sprinting ? SPRINT : WALK;

    if (mag > 0.05) {
      p.facing = Math.atan2(move.y, move.x);
      p.step += dt * mag * (p.sprinting ? 14 : 9);
    }
    moveCircle(p, move.x * speed * dt, move.y * speed * dt, PLAYER_R, blockers);
  }

  updateBull(b, dt, blockers) {
    const p = this.player;
    const seen = this.canSee(b, p, blockers);
    const dist = Math.hypot(p.x - b.x, p.y - b.y);

    // Suspicion builds faster up close and when you're running.
    if (seen && b.state !== 'chase') {
      const rate = 1.4 * (1.6 - dist / this.viewRange) * (p.sprinting ? 1.6 : 1);
      b.alert = Math.min(1, b.alert + rate * dt);
      b.lastSeen = { x: p.x, y: p.y };
      if (b.alert >= 1) {
        b.state = 'chase';
        b.lostFor = 0;
        this.game.input.rumble(120, 0.5, 0.3);
      } else if (b.state !== 'suspicious') {
        b.state = 'suspicious';
      }
    } else if (b.state !== 'chase') {
      b.alert = Math.max(0, b.alert - 0.35 * dt);
    }

    switch (b.state) {
      case 'patrol': {
        b.facing = lerpAngle(b.facing, b.dir > 0 ? Math.PI / 2 : -Math.PI / 2, dt * 4) + Math.sin(this.t * 1.3 + b.sweep) * 0.01;
        const before = b.y;
        moveCircle(b, (b.homeX - b.x) * Math.min(1, dt * 2), b.dir * BULL_PATROL * dt, BULL_R, blockers);
        const stuck = Math.abs(b.y - before) < BULL_PATROL * dt * 0.3;
        if (b.y > BOTTOM - 40 || b.y < TOP + 40 || stuck) {
          b.state = 'wait';
          b.timer = BULL_WAIT;
        }
        break;
      }
      case 'wait': {
        // Stand and swing the lantern across the yard.
        b.timer -= dt;
        const base = b.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        b.facing = base + Math.sin(this.t * 1.8 + b.sweep) * 1.4;
        if (b.timer <= 0) {
          b.dir = -b.dir;
          b.state = 'patrol';
        }
        break;
      }
      case 'suspicious': {
        // Stops and stares toward where he saw something.
        if (b.lastSeen) b.facing = lerpAngle(b.facing, Math.atan2(b.lastSeen.y - b.y, b.lastSeen.x - b.x), dt * 5);
        if (b.alert <= 0) b.state = 'patrol';
        break;
      }
      case 'chase': {
        if (seen) {
          b.lastSeen = { x: p.x, y: p.y };
          b.lostFor = 0;
        } else {
          b.lostFor += dt;
        }
        const target = seen ? p : (b.lastSeen ?? p);
        const dx = target.x - b.x;
        const dy = target.y - b.y;
        const d = Math.hypot(dx, dy) || 1;
        b.facing = Math.atan2(dy, dx);
        moveCircle(b, (dx / d) * BULL_CHASE * dt, (dy / d) * BULL_CHASE * dt, BULL_R, blockers);
        if (dist < CATCH_RANGE) {
          this.finish('caught');
          return;
        }
        if (!seen && (b.lostFor > 2.5 || d < 8)) {
          b.state = 'search';
          b.timer = 3;
          b.alert = 0.6;
        }
        break;
      }
      case 'search': {
        b.timer -= dt;
        b.facing += dt * 2.2;
        b.alert = Math.max(0.3, b.alert);
        if (b.timer <= 0) {
          b.state = 'return';
          b.alert = 0;
        }
        break;
      }
      case 'return': {
        // Head back to his aisle. If parked cars are in the way, walk along
        // them until there's a gap.
        const dx = b.homeX - b.x;
        b.facing = lerpAngle(b.facing, dx > 0 ? 0 : Math.PI, dt * 4);
        const beforeX = b.x;
        moveCircle(b, Math.sign(dx) * Math.min(Math.abs(dx), BULL_PATROL * 1.3 * dt), 0, BULL_R, blockers);
        if (Math.abs(b.homeX - b.x) < 2) {
          b.state = 'patrol';
        } else if (Math.abs(b.x - beforeX) < 0.01) {
          moveCircle(b, 0, b.dir * BULL_PATROL * 1.3 * dt, BULL_R, blockers);
          if (b.y > BOTTOM - 30 || b.y < TOP + 30) b.dir = -b.dir;
        }
        break;
      }
    }
  }

  canSee(b, p, blockers) {
    // Up on a coupling you're in plain view: only distance and the light matter.
    if (this.climb) blockers = [];
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const d = Math.hypot(dx, dy);
    if (d > this.viewRange) return false;
    const inLight = Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) <= VIEW_HALF;
    // Behind him, he only notices you close up, and sooner if you're running.
    const heard = d < (p.sprinting ? HEAR_RANGE : HEAR_RANGE * 0.6);
    if (!inLight && !heard) return false;
    return !blockers.some((r) => segmentHitsRect(b.x, b.y, p.x, p.y, r));
  }

  finish(outcome, train = null) {
    if (this.outcome) return;
    const j = this.journey;
    this.outcome = outcome;
    this.outcomeT = 0;
    if (outcome === 'boarded') {
      this.boarded = train;
      this.to = train.def.to;
      // The ride runs from when this freight pulls out (src/scenes/travel.js).
      j.riding = { from: this.from, to: this.to, departs: train.departAt };
      saveJourney(j);
    } else if (outcome === 'caught') {
      // A night in the lockup: out at 7 in the morning.
      clock_set(j, clock_next(clock_now(j), RELEASED));
      j.arrests += 1;
      this.game.input.rumble(400, 1, 1);
    } else if (outcome === 'missed') {
      // More are made up for their next runs, next time you come in.
      j.missed += 1;
    }
    if (outcome !== 'boarded') {
      saveJourney(j);
      this.outcomeMenu = new Menu(
        [
          { id: 'retry', label: 'Try Again' },
          { id: 'map', label: 'Back to the Map' },
        ],
        { x: W / 2, y: 420, rowH: 52, width: 360, fontSize: 26 },
      );
    }
  }

  updateOutcome(dt, input, pointer) {
    this.outcomeT += dt;
    if (this.outcome === 'boarded') {
      // Let the train roll a moment, then ride it on the map.
      const train = this.boarded;
      for (const car of train.cars) car.y += Math.max(40, train.speed) * dt;
      if (this.outcomeT > 1.6 || (this.outcomeT > 0.4 && input.pressed('confirm'))) {
        this.game.setScene(new TravelScene(this.game, this.journey));
      }
      return;
    }
    if (this.outcomeT < 0.6) return; // don't let a held button skip the news
    const choice = this.outcomeMenu.update(dt, input, pointer);
    if (choice === 'retry') this.game.setScene(new YardScene(this.game, this.journey));
    else if (choice === 'map') this.game.setScene(new MapScene(this.game, this.journey));
  }

  // ------------------------------------------------------------------ draw

  draw(ctx) {
    const blockers = this.blockers();
    this.drawGround(ctx);
    for (const x of this.trackXs) drawTrack(ctx, x);
    this.layout.draw?.ground?.(ctx, this);
    this.drawFences(ctx);
    drawTownGate(ctx, this.gateY);

    for (const car of this.parked) drawCar(ctx, car);
    for (const cut of this.cuts) for (const car of cut.cars) drawCar(ctx, car, cut.dir);
    for (const train of this.trains) {
      if (train.gone && train !== this.boarded) continue;
      for (const car of train.cars) drawCar(ctx, car, 1);
      if (train.cardCar) drawCard(ctx, train.cardCar);
    }
    this.drawDoorMarkers(ctx);
    if (this.office) drawOffice(ctx, this.office);

    // Dark by the clock, over everything but the lanterns and lit windows.
    const night = this.night;
    ctx.fillStyle = `rgba(8, 10, 24, ${0.42 * night})`;
    ctx.fillRect(0, 0, W, H);
    for (const b of this.bulls) this.drawCone(ctx, b, blockers, night);
    if (this.office && night > 0.05) drawOfficeGlow(ctx, this.office, night);
    this.drawDoorGlows(ctx);
    this.drawSmoke(ctx);

    this.drawMeet(ctx);
    this.drawPlayer(ctx);
    for (const b of this.bulls) this.drawBull(ctx, b);
    this.layout.draw?.over?.(ctx, this);
    // Over Scout's head, kept on screen by the fences.
    const lx = Math.max(80, Math.min(W - 80, this.player.x));
    if (this.climb) label(ctx, 'Climbing…', lx, this.player.y - 30, COLORS.cream, 15);
    else if (this.focus && !this.outcome) label(ctx, this.focus.verb, lx, this.player.y - 30, COLORS.accent, 15);

    this.drawTrackBoards(ctx);
    this.drawHud(ctx);
    if (this.notice?.t > 0 && !this.outcome) this.drawNotice(ctx);
    if (this.intro > 0 && !this.outcome) this.drawIntro(ctx);
    if (this.paused) this.paused.draw(ctx);
    if (this.outcome) this.drawOutcome(ctx);
  }

  drawGround(ctx) {
    // Cinders: darker by night (before the dark comes over them), lighter by day.
    ctx.fillStyle = mix('#4e453c', '#2d2622', this.night);
    ctx.fillRect(0, 0, W, H);
    // Cinder speckle: a fixed texture, the same in every yard.
    const r = seeded(1932);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 900; i++) ctx.fillRect(r() * W, TOP + r() * (BOTTOM - TOP), 2, 2);
    ctx.fillStyle = 'rgba(255,240,220,0.05)';
    for (let i = 0; i < 500; i++) ctx.fillRect(r() * W, TOP + r() * (BOTTOM - TOP), 2, 2);
  }

  drawFences(ctx) {
    ctx.fillStyle = mix('#3a302a', '#16110f', this.night);
    ctx.fillRect(0, 0, W, TOP);
    ctx.fillRect(0, BOTTOM, W, H - BOTTOM);
    ctx.strokeStyle = '#5a4c40';
    ctx.lineWidth = 2;
    for (const y of [TOP, BOTTOM]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      for (let x = 10; x < W; x += 40) ctx.fillRect(x, y - 4, 4, 8);
    }
  }

  /** The open doors: a dark gap in each car's west side, lamplight inside. */
  drawDoorMarkers(ctx) {
    for (const train of this.trains) {
      if (train.gone || this.outcome === 'boarded') continue;
      const car = train.openCar;
      ctx.fillStyle = '#e09a4a';
      ctx.fillRect(car.x + 4, car.y + car.h / 2 - 20, car.w - 8, 40);
      ctx.fillStyle = '#1a0f0a';
      ctx.fillRect(car.x - 2, car.y + car.h / 2 - 20, 6, 40);
    }
  }

  /** A pulse over each open door, so they read through the dark. */
  drawDoorGlows(ctx) {
    if (this.outcome === 'boarded') return;
    const pulse = (Math.sin(this.t * 4) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const train of this.trains) {
      if (train.gone) continue;
      const car = train.openCar;
      const cy = car.y + car.h / 2;
      if (cy > BOTTOM) continue;
      const g = ctx.createRadialGradient(car.x + car.w / 2, cy, 4, car.x + car.w / 2, cy, 46 + pulse * 10);
      g.addColorStop(0, `rgba(240, 170, 80, ${0.3 + pulse * 0.15})`);
      g.addColorStop(1, 'rgba(240, 170, 80, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(car.x - 60, cy - 70, car.w + 120, 140);
    }
    ctx.restore();
  }

  /** Steam from engines about to leave: a clue in itself. Cold engines don't smoke. */
  drawSmoke(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TOP, W, BOTTOM - TOP);
    ctx.clip();
    for (const train of this.trains) {
      if (train.gone || train.departIn > 15) continue;
      const strength = Math.min(1, (15 - train.departIn) / 8);
      const engine = train.cars[0];
      for (let i = 0; i < 8; i++) {
        const age = (this.t * 0.6 + i / 8) % 1;
        ctx.fillStyle = `rgba(200, 200, 205, ${0.35 * (1 - age) * strength})`;
        ctx.beginPath();
        ctx.arc(engine.x + engine.w / 2 + Math.sin(i * 2.1 + this.t) * 8, Math.min(BOTTOM, engine.y + 60) - age * 70, 6 + age * 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Track number boards along the north fence, and under each one, what the
   * notebook knows about the freight on it: where it's bound, or its engine
   * number, or a question mark.
   */
  drawTrackBoards(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.trackXs.forEach((x, i) => {
      const n = i + 1;
      ctx.fillStyle = '#d8ccb0';
      ctx.fillRect(x - 11, TOP - 9, 22, 18);
      ctx.fillStyle = '#1e1612';
      ctx.font = `bold 13px ${FONTS.body}`;
      ctx.fillText(String(n), x, TOP + 1);
      const train = this.trains.find((t) => t.track === n && !t.gone);
      if (!train) return;
      const known = yard_known(this.notes, train);
      const text = known ? LOCATIONS[known.to].name : this.notes.plates[n] ? `No. ${this.notes.plates[n]}` : '?';
      ctx.font = `13px ${FONTS.body}`;
      const w = ctx.measureText(text).width + 12;
      ctx.fillStyle = 'rgba(16, 10, 10, 0.8)';
      ctx.fillRect(x - w / 2, TOP + 12, w, 18);
      ctx.fillStyle = known ? COLORS.accent : 'rgba(244, 230, 200, 0.75)';
      ctx.fillText(text, x, TOP + 21);
    });
    ctx.restore();
  }

  /** What was just read: a card, a plate, the board. */
  drawNotice(ctx) {
    const n = this.notice;
    const w = 520;
    const h = 56 + n.lines.length * 26;
    const x = W / 2 - w / 2;
    const y = 96;
    ctx.save();
    ctx.globalAlpha = Math.min(1, n.t * 2);
    panel(ctx, x, y, w, h, '#1c1212');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `20px ${FONTS.title}`;
    ctx.fillText(n.title, W / 2, y + 28);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `17px ${FONTS.body}`;
    n.lines.forEach((line, k) => ctx.fillText(line, W / 2, y + 56 + k * 26));
    ctx.restore();
  }

  /** What a bull can see, cut short where cars block it: lantern light at night, a pale wedge by day. */
  drawCone(ctx, b, blockers, night) {
    const rays = 28;
    const range = this.viewRange;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TOP, W, BOTTOM - TOP);
    ctx.clip();
    const grad = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, range);
    if (night > 0.5) {
      ctx.globalCompositeOperation = 'lighter';
      const color = b.state === 'chase' ? '255, 90, 60' : b.alert > 0 ? '255, 190, 80' : '255, 215, 140';
      grad.addColorStop(0, `rgba(${color}, ${0.32 * night})`);
      grad.addColorStop(1, `rgba(${color}, 0.02)`);
    } else {
      const color = b.state === 'chase' ? '255, 120, 90' : b.alert > 0 ? '255, 215, 130' : '255, 250, 235';
      grad.addColorStop(0, `rgba(${color}, ${0.24 * (1 - night) + 0.1})`);
      grad.addColorStop(1, `rgba(${color}, 0.04)`);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (let i = 0; i <= rays; i++) {
      const a = b.facing - VIEW_HALF + (i / rays) * VIEW_HALF * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      let len = range;
      for (const r of blockers) {
        const hit = rayRect(b.x, b.y, dx, dy, r);
        if (hit !== null && hit < len) len = hit;
      }
      ctx.lineTo(b.x + dx * len, b.y + dy * len);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /** Whoever's waiting in the yard (its `meet`), seen from above like Scout, turned to face them. */
  drawMeet(ctx) {
    // Waiting, or talking (until they've joined and gone with Scout).
    const m = this.meet ?? (this.met && !party_has(this.journey, this.met.joins) ? this.met : null);
    if (!m) return;
    const look = m.look;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(Math.atan2(this.player.y - m.y, this.player.x - m.x));
    ctx.fillStyle = look.skin; // hands
    ctx.fillRect(-3, -10, 6, 4);
    ctx.fillRect(-3, 6, 6, 4);
    ctx.fillStyle = look.coat;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = look.skin; // head
    ctx.beginPath();
    ctx.arc(1, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2622'; // cap, peak forward
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, Math.PI / 2, -Math.PI / 2);
    ctx.fill();
    ctx.fillRect(0, -3, 6, 6);
    ctx.restore();
    if (this.meet) label(ctx, m.name, m.x, m.y - 22, COLORS.cream, 14);
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.stun > 0) {
      ctx.rotate(Math.sin(this.t * 30) * 0.2);
    }
    // Shadow, coat, bindle, hat.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(p.facing);
    const swing = Math.sin(p.step) * 3;
    ctx.fillStyle = '#4d4033';
    ctx.fillRect(-4 + swing, -9, 8, 5); // shoulders/arms swinging
    ctx.fillRect(-4 - swing, 4, 8, 5);
    ctx.fillStyle = '#6a5642';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b5482f'; // red bandana bindle over the shoulder
    ctx.beginPath();
    ctx.arc(-9, -9, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b221b'; // hat
    ctx.beginPath();
    ctx.arc(1, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d3127';
    ctx.beginPath();
    ctx.arc(1, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (p.stun > 0) {
      label(ctx, 'Oof!', p.x, p.y - 22, COLORS.cream);
    }
    // Stamina, only when it isn't full.
    if (p.stamina < 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = p.stamina > 0.25 ? '#8fc0e8' : '#e86a50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 17, -Math.PI / 2, -Math.PI / 2 + p.stamina * Math.PI * 2);
      ctx.stroke();
    }

  }

  drawBull(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(b.facing);
    ctx.fillStyle = '#26324c'; // uniform
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3a24'; // billy club
    ctx.fillRect(2, 8, 12, 3);
    ctx.fillStyle = '#ffd88a'; // lantern
    ctx.beginPath();
    ctx.arc(9, -8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a2236'; // cap with a peak
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(4, -4, 5, 8);
    ctx.restore();

    if (b.state === 'chase') label(ctx, '!', b.x, b.y - 26, '#ff6a4a', 26);
    else if (b.alert > 0 || b.state === 'search') {
      label(ctx, '?', b.x, b.y - 26, '#ffcf6a', 24);
      // Alert meter.
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(b.x - 14, b.y - 46, 28, 5);
      ctx.fillStyle = '#ffcf6a';
      ctx.fillRect(b.x - 14, b.y - 46, 28 * b.alert, 5);
    }
  }

  drawHud(ctx) {
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    // Status top left (src/ui/status.js); it opens the journal.
    const plate = drawStatusPlate(ctx, this.journey, { title: `${LOCATIONS[this.from].name} Yard`, t: this.t });

    // The yard clock, and the next one out: top centre, or as near it as the
    // plate leaves room for (a long name and a full party).
    const cx = Math.max(W / 2, plate.x + plate.w + 175);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `26px ${FONTS.body}`;
    ctx.fillText(yard_clock(this.clock), cx, 26);
    const next = this.trains.filter((t) => !t.gone).sort((a, b) => a.departIn - b.departIn)[0];
    if (next) {
      ctx.font = `15px ${FONTS.body}`;
      ctx.fillStyle = next.departIn <= 10 ? '#ff9a6a' : 'rgba(244, 230, 200, 0.7)';
      const left = this.trains.filter((t) => !t.gone).length;
      const tonight = `${left} ${left === 1 ? 'freight' : 'freights'} waiting`;
      ctx.fillText(next.departIn > 0 ? `${tonight}  ·  next out ${yard_clock(next.departAt % MINUTES_PER_DAY)}` : 'a freight’s pulling out!', cx, 52);
    }

    ctx.restore();

    drawPrompts(
      ctx,
      this.game.input,
      [
        ['sprint', 'Run'],
        ['act', this.focus?.verb ?? 'Act'],
        ['pause', 'Pause'],
      ],
      W - 24,
      H - 22,
    );
  }

  drawIntro(ctx) {
    const a = Math.min(1, this.intro);
    ctx.save();
    ctx.globalAlpha = a;
    panel(ctx, W / 2 - 360, 250, 720, 190);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `30px ${FONTS.title}`;
    ctx.fillText(this.trains.length > 1 ? 'Find your freight' : 'Get to the open boxcar', W / 2, 300);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `18px ${FONTS.body}`;
    ctx.fillText('Cards on the cars, engine numbers and the board in the', W / 2, 348);
    ctx.fillText('yard office window tell where each one is bound.', W / 2, 374);
    ctx.fillStyle = 'rgba(244, 230, 200, 0.7)';
    ctx.fillText(`${this.night > 0.5 ? 'Keep out of the lantern light' : 'Keep out of the bulls’ sight'}. Climb between a standing freight’s cars to cross it.`, W / 2, 410);
    ctx.restore();
  }

  drawOutcome(ctx) {
    const o = this.outcome;
    const city = LOCATIONS[this.from].name;
    const text = {
      boarded: ['Aboard!', this.to ? `This one’s bound for ${LOCATIONS[this.to].name}.` : ''],
      caught: ['Caught by the bull', `A night in the ${city} lockup. They let you out at 7 in the morning.`],
      missed: ['Missed them all', 'Every freight pulled out without you. There’ll be more.'],
    }[o];
    ctx.fillStyle = o === 'boarded' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    // The message wrapped to the panel; the panel (and the menu under it)
    // as tall as it needs.
    ctx.save();
    ctx.font = `20px ${FONTS.body}`;
    const lines = wrapLines(ctx, text[1], OUTCOME_W - 80);
    const below = (lines.length - 1) * OUTCOME_LINE; // extra height for every line past the first
    const h = (o === 'boarded' ? 140 : 260) + below;
    panel(ctx, W / 2 - OUTCOME_W / 2, 250, OUTCOME_W, h, '#1c1212');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = o === 'boarded' ? COLORS.accent : '#ff8a6a';
    ctx.font = `38px ${FONTS.title}`;
    ctx.fillText(text[0], W / 2, 300);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `20px ${FONTS.body}`;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 350 + i * OUTCOME_LINE));
    ctx.restore();
    if (this.outcomeMenu) this.outcomeMenu.layout.y = 420 + below;
    if (o !== 'boarded' && this.outcomeT >= 0.6) this.outcomeMenu.draw(ctx, this.t);
  }
}

const OUTCOME_W = 720;
const OUTCOME_LINE = 28;

/** Words wrapped to lines no wider than maxW, in ctx's current font. */
function wrapLines(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function makeCar(letter, x, y) {
  const type = CAR_TYPES[letter];
  if (!type) throw new Error(`Unknown yard car letter "${letter}"`);
  return { x: x - CAR_W / 2, y, w: CAR_W, h: CAR_L, kind: type.kind, color: type.color };
}

// ------------------------------------------------------------- drawing bits

function drawTrack(ctx, x) {
  ctx.fillStyle = '#3b332e'; // ballast
  ctx.fillRect(x - 30, TOP, 60, BOTTOM - TOP);
  ctx.fillStyle = '#241a14'; // ties
  for (let y = TOP; y < BOTTOM; y += 16) ctx.fillRect(x - 24, y, 48, 6);
  ctx.fillStyle = '#7a716a'; // rails
  ctx.fillRect(x - 14, TOP, 3, BOTTOM - TOP);
  ctx.fillRect(x + 11, TOP, 3, BOTTOM - TOP);
}

function drawCar(ctx, car, dir = 1) {
  if (car.y > BOTTOM + 10 || car.y + car.h < TOP - 10) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, TOP, W, BOTTOM - TOP);
  ctx.clip();
  const { x, y, w, h } = car;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x + 4, y + 4, w, h);

  if (car.kind === 'engine') {
    ctx.fillStyle = '#1b1b1d';
    ctx.fillRect(x + 2, y, w - 4, h);
    const front = dir > 0 ? y + h - 16 : y + 16;
    const cab = dir > 0 ? y + 6 : y + h - 34;
    ctx.fillStyle = '#2c2c30';
    ctx.fillRect(x, cab, w, 28); // cab
    ctx.fillStyle = '#3a3a3e';
    ctx.beginPath();
    ctx.arc(x + w / 2, front, 6, 0, Math.PI * 2); // stack
    ctx.fill();
    ctx.fillStyle = '#ffe6a0'; // headlamp
    ctx.beginPath();
    ctx.arc(x + w / 2, dir > 0 ? y + h - 3 : y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (car.kind === 'tank') {
    ctx.fillStyle = '#26262a';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 2, w - 6, h - 4, 18);
    ctx.fill();
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(x + w / 2 - 2, y + 8, 4, h - 16);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (car.kind === 'gon') {
    ctx.fillStyle = '#4a3b30';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#141212'; // coal load
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  } else {
    ctx.fillStyle = car.color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let yy = y + 10; yy < y + h; yy += 10) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; // roof walk
    ctx.fillRect(x + w / 2 - 3, y, 6, h);
  }
  ctx.restore();
}

/** The gate in the west fence, back to town. */
function drawTownGate(ctx, y) {
  ctx.save();
  ctx.fillStyle = '#16110f';
  ctx.fillRect(0, TOP, 6, y - GATE_Y_SPAN - TOP);
  ctx.fillRect(0, y + GATE_Y_SPAN, 6, BOTTOM - y - GATE_Y_SPAN);
  ctx.fillStyle = '#5a4c40';
  ctx.fillRect(0, y - GATE_Y_SPAN - 4, 10, 8);
  ctx.fillRect(0, y + GATE_Y_SPAN - 4, 10, 8);
  ctx.translate(16, y - GATE_Y_SPAN - 18);
  ctx.fillStyle = '#d8ccb0';
  ctx.fillRect(-8, -9, 74, 18);
  ctx.fillStyle = '#1e1612';
  ctx.font = `bold 11px ${FONTS.body}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('← TO TOWN', -3, 1);
  ctx.restore();
}

/** A destination card tacked to a car's west side. */
function drawCard(ctx, car) {
  if (car.y + 40 < TOP || car.y > BOTTOM) return;
  ctx.fillStyle = '#ece4d0';
  ctx.fillRect(car.x - 3, car.y + 18, 7, 16);
  ctx.fillStyle = 'rgba(40, 30, 20, 0.7)';
  ctx.fillRect(car.x - 2, car.y + 22, 5, 2);
  ctx.fillRect(car.x - 2, car.y + 27, 5, 2);
}

/** The yard office: a shack with a lit window on its east side, the board inside. */
function drawOffice(ctx, o) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(o.x + 5, o.y + 5, o.w, o.h);
  ctx.fillStyle = '#5a4636';
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = '#3e3026'; // roof ridge, from above
  ctx.fillRect(o.x, o.y + o.h / 2 - 3, o.w, 6);
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(o.x - 3, o.y - 3, o.w + 6, 4);
  ctx.fillRect(o.x - 3, o.y + o.h - 1, o.w + 6, 4);
  ctx.fillStyle = '#f0c870'; // the window
  ctx.fillRect(o.x + o.w - 3, o.y + 14, 5, o.h - 28);
  ctx.fillStyle = '#d8ccb0';
  ctx.font = `bold 10px ${FONTS.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICE', o.x + o.w / 2, o.y + 12);
  ctx.restore();
}

function drawOfficeGlow(ctx, o, night = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cx = o.x + o.w + 4;
  const cy = o.y + o.h / 2;
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70);
  g.addColorStop(0, `rgba(240, 190, 100, ${0.35 * night})`);
  g.addColorStop(1, 'rgba(240, 190, 100, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 70, cy - 70, 140, 140);
  ctx.restore();
}

function label(ctx, text, x, y, color, size) {
  ctx.save();
  if (size) ctx.font = `bold ${size}px ${FONTS.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ------------------------------------------------------------------ physics

function circleRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

/** Move a circle by (dx, dy), sliding along rects and staying in the yard. */
function moveCircle(body, dx, dy, r, rects) {
  body.x += dx;
  for (const rect of rects) {
    if (circleRect(body.x, body.y, r, rect)) {
      body.x = dx > 0 ? Math.min(body.x, rect.x - r) : dx < 0 ? Math.max(body.x, rect.x + rect.w + r) : body.x;
    }
  }
  body.y += dy;
  for (const rect of rects) {
    if (circleRect(body.x, body.y, r, rect)) {
      body.y = dy > 0 ? Math.min(body.y, rect.y - r) : dy < 0 ? Math.max(body.y, rect.y + rect.h + r) : body.y;
    }
  }
  body.x = Math.max(r + 4, Math.min(W - r - 4, body.x));
  body.y = Math.max(TOP + r + 2, Math.min(BOTTOM - r - 2, body.y));
}

/** Distance along a unit ray to a rect, or null. */
function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  for (const [o, d, lo, hi] of [
    [ox, dx, r.x, r.x + r.w],
    [oy, dy, r.y, r.y + r.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (!len) return false;
  const t = rayRect(x1, y1, dx / len, dy / len, r);
  return t !== null && t < len;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function lerpAngle(a, b, k) {
  return a + angleDiff(b, a) * Math.min(1, k);
}
