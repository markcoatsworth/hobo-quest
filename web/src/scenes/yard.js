// A rail yard, seen from above. Start at the west fence, cross the sidings
// and reach the open boxcar on the departing freight on the far east track
// before it pulls out. Bulls (railroad police) patrol with lanterns; parked
// cars block their view, shunting cuts of cars will knock you flat.

import { drawPrompts } from '../core/prompts.js';
import { seeded } from '../core/rng.js';
import { saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { Menu } from '../core/menu.js';
import { CITIES, ROUTES } from '../data/routes.js';
import { MapScene } from './map.js';
import { TravelScene } from './travel.js';
import { panel, TitleScene } from './title.js';

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
const VIEW_RANGE = 215;
const VIEW_HALF = 0.62; // radians either side of facing
const HEAR_RANGE = 46; // notices you this close, whatever way he faces
const CATCH_RANGE = 22;

const HOP_RANGE = 34;
const TRAIN_ACCEL = 11; // px/s² once it departs
const TRAIN_MAX = 95;

// Car letters in a city's yard layout (see src/cities/index.js).
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

export class YardScene {
  constructor(game, journey) {
    this.game = game;
    this.journey = journey;
    const stops = ROUTES[journey.route].stops;
    this.from = stops[journey.stop];
    this.to = stops[journey.stop + 1];
    this.layout = CITIES[this.from].yard;
    this.t = 0;
    this.outcome = null; // 'boarded' | 'caught' | 'missed'
    this.paused = null; // Menu while paused
    this.intro = 2.5; // seconds of title banner

    this.build();
  }

  // ---------------------------------------------------------------- layout

  /** Lay the yard out exactly as the city's module describes it. */
  build() {
    const { tracks, train, bulls, departs, player } = this.layout;

    this.trackXs = tracks.map((t) => t.x);
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
      } else {
        [...track.cars].forEach((c, j) => {
          if (c !== '.') this.parked.push(makeCar(c, track.x, FIRST_SLOT_Y + j * SLOT));
        });
      }
    }

    this.buildTrain(train, departs);

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

  buildTrain({ cars: letters = DEFAULT_TRAIN, open }, departs) {
    // A long freight heading south (down the screen), engine at the bottom,
    // the rest stretching north past the fence.
    const cars = [];
    let y = BOTTOM - 40;
    [...letters].forEach((c, i) => {
      if (i === 0) {
        cars.push({ ...makeCar(c, DEPART_X, y), h: 120 });
        y -= CAR_GAP;
        return;
      }
      y -= SLOT;
      const car = makeCar(i === open ? 'B' : c, DEPART_X, y);
      if (i === open) car.open = true;
      cars.push(car);
    });
    this.train = { cars, departIn: departs, speed: 0, offset: 0, openCar: cars[open] };
  }

  // -------------------------------------------------------------- geometry

  /** Every rect that blocks movement and sight, this frame. */
  blockers() {
    const list = this.parked.slice();
    for (const cut of this.cuts) list.push(...cut.cars);
    for (const car of this.train.cars) list.push(car);
    return list;
  }

  door() {
    const car = this.train.openCar;
    return { x: car.x - 6, y: car.y + car.h / 2 };
  }

  // ---------------------------------------------------------------- update

  update(dt, input, pointer) {
    if (this.outcome) return this.updateOutcome(dt, input, pointer);

    if (this.paused) {
      if (input.pressed('pause') || input.pressed('back')) {
        this.paused = null;
        return;
      }
      const choice = this.paused.update(dt, input, pointer);
      if (choice === 'resume') this.paused = null;
      else if (choice === 'map') this.game.setScene(new MapScene(this.game, this.journey));
      else if (choice === 'title') this.game.setScene(new TitleScene(this.game));
      return;
    }
    if (input.pressed('pause')) {
      this.paused = new Menu(
        [
          { id: 'resume', label: 'Resume' },
          { id: 'map', label: 'Back to the Map' },
          { id: 'title', label: 'Quit to Title' },
        ],
        { x: W / 2, y: 330, rowH: 54, width: 320, fontSize: 28 },
      );
      return;
    }

    this.t += dt;
    this.intro = Math.max(0, this.intro - dt);
    const blockers = this.blockers();

    this.updateTrain(dt);
    this.updateCuts(dt);
    this.updatePlayer(dt, input, blockers);
    for (const bull of this.bulls) this.updateBull(bull, dt, blockers);
    if (this.outcome) return;

    // Boarding.
    const d = this.door();
    this.canHop = Math.hypot(this.player.x - d.x, this.player.y - d.y) < HOP_RANGE && this.player.stun <= 0;
    if (this.canHop && input.pressed('confirm')) this.finish('boarded');
    else if (d.y > BOTTOM + 30) this.finish('missed');
  }

  updateTrain(dt) {
    const train = this.train;
    train.departIn -= dt;
    if (train.departIn > 0) return;
    train.speed = Math.min(TRAIN_MAX, train.speed + TRAIN_ACCEL * dt);
    for (const car of train.cars) car.y += train.speed * dt;
    train.offset += train.speed * dt;
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
      const rate = 1.4 * (1.6 - dist / VIEW_RANGE) * (p.sprinting ? 1.6 : 1);
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
        const target = seen ? p : b.lastSeen;
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
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const d = Math.hypot(dx, dy);
    if (d > VIEW_RANGE) return false;
    const inLight = Math.abs(angleDiff(Math.atan2(dy, dx), b.facing)) <= VIEW_HALF;
    // Behind him, he only notices you close up, and sooner if you're running.
    const heard = d < (p.sprinting ? HEAR_RANGE : HEAR_RANGE * 0.6);
    if (!inLight && !heard) return false;
    return !blockers.some((r) => segmentHitsRect(b.x, b.y, p.x, p.y, r));
  }

  finish(outcome) {
    if (this.outcome) return;
    const j = this.journey;
    this.outcome = outcome;
    this.outcomeT = 0;
    if (outcome === 'caught') {
      j.day += 1;
      j.arrests += 1;
      this.game.input.rumble(400, 1, 1);
    } else if (outcome === 'missed') {
      j.day += 1;
      j.missed += 1;
    }
    if (outcome !== 'boarded') {
      saveJourney(j);
      this.outcomeMenu = new Menu(
        [
          { id: 'retry', label: 'Try Again Tomorrow' },
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
      for (const car of this.train.cars) car.y += Math.max(40, this.train.speed) * dt;
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
    drawTrack(ctx, DEPART_X);
    this.drawFences(ctx);

    for (const car of this.parked) drawCar(ctx, car);
    for (const cut of this.cuts) for (const car of cut.cars) drawCar(ctx, car, cut.dir);
    for (const car of this.train.cars) drawCar(ctx, car, 1);
    this.drawDoorMarker(ctx);

    // Night falls over everything but the lanterns.
    ctx.fillStyle = 'rgba(8, 10, 24, 0.42)';
    ctx.fillRect(0, 0, W, H);
    for (const b of this.bulls) this.drawCone(ctx, b, blockers);
    this.drawDoorGlow(ctx);

    this.drawPlayer(ctx);
    for (const b of this.bulls) this.drawBull(ctx, b);

    this.drawHud(ctx);
    if (this.intro > 0 && !this.outcome) this.drawIntro(ctx);
    if (this.paused) this.drawPause(ctx);
    if (this.outcome) this.drawOutcome(ctx);
  }

  drawGround(ctx) {
    ctx.fillStyle = '#2d2622';
    ctx.fillRect(0, 0, W, H);
    // Cinder speckle: a fixed texture, the same in every yard.
    const r = seeded(1932);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 900; i++) ctx.fillRect(r() * W, TOP + r() * (BOTTOM - TOP), 2, 2);
    ctx.fillStyle = 'rgba(255,240,220,0.05)';
    for (let i = 0; i < 500; i++) ctx.fillRect(r() * W, TOP + r() * (BOTTOM - TOP), 2, 2);
  }

  drawFences(ctx) {
    ctx.fillStyle = '#16110f';
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

  drawDoorMarker(ctx) {
    if (this.outcome === 'boarded') return;
    const car = this.train.openCar;
    // The open door: a dark gap in the car's west side with lamplight inside.
    ctx.fillStyle = '#e09a4a';
    ctx.fillRect(car.x + 4, car.y + car.h / 2 - 20, car.w - 8, 40);
    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(car.x - 2, car.y + car.h / 2 - 20, 6, 40);
  }

  drawDoorGlow(ctx) {
    // A pulse over the open door, so the goal reads through the dark.
    if (this.outcome === 'boarded') return;
    const car = this.train.openCar;
    const cy = car.y + car.h / 2;
    if (cy > BOTTOM) return;
    const pulse = (Math.sin(this.t * 4) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(car.x + car.w / 2, cy, 4, car.x + car.w / 2, cy, 46 + pulse * 10);
    g.addColorStop(0, `rgba(240, 170, 80, ${0.35 + pulse * 0.2})`);
    g.addColorStop(1, 'rgba(240, 170, 80, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(car.x - 60, cy - 70, car.w + 120, 140);
    ctx.restore();
  }

  drawCone(ctx, b, blockers) {
    // Lantern light, cut short where cars block it.
    const rays = 28;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TOP, W, BOTTOM - TOP);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const color = b.state === 'chase' ? '255, 90, 60' : b.alert > 0 ? '255, 190, 80' : '255, 215, 140';
    const grad = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, VIEW_RANGE);
    grad.addColorStop(0, `rgba(${color}, 0.32)`);
    grad.addColorStop(1, `rgba(${color}, 0.02)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (let i = 0; i <= rays; i++) {
      const a = b.facing - VIEW_HALF + (i / rays) * VIEW_HALF * 2;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      let len = VIEW_RANGE;
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

    if (this.canHop && !this.outcome) {
      const d = this.door();
      ctx.save();
      ctx.font = `bold 15px ${FONTS.body}`;
      label(ctx, 'Hop on!', d.x - 40, d.y - 34, COLORS.accent);
      ctx.restore();
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
    ctx.fillStyle = COLORS.cream;
    ctx.font = `24px ${FONTS.title}`;
    ctx.fillText(`${CITIES[this.from].name} Yard`, 24, 30);
    ctx.font = `16px ${FONTS.body}`;
    ctx.fillStyle = 'rgba(244, 230, 200, 0.7)';
    ctx.fillText(`Freight to ${CITIES[this.to].name} on the east track`, 24, 56);

    ctx.textAlign = 'center';
    const left = this.train.departIn;
    if (left > 0) {
      const s = Math.ceil(left);
      ctx.fillStyle = s <= 10 ? '#ff9a6a' : COLORS.cream;
      ctx.font = `26px ${FONTS.body}`;
      ctx.fillText(`Departs in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, W / 2, 36);
    } else {
      ctx.fillStyle = '#ff9a6a';
      ctx.font = `26px ${FONTS.body}`;
      ctx.fillText('She’s pulling out!', W / 2, 36);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `20px ${FONTS.body}`;
    ctx.fillText(`Day ${this.journey.day}`, W - 24, 30);
    ctx.restore();

    drawPrompts(
      ctx,
      this.game.input,
      [
        ['sprint', 'Run'],
        ['confirm', 'Hop on'],
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
    panel(ctx, W / 2 - 330, 270, 660, 150);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `30px ${FONTS.title}`;
    ctx.fillText('Get to the open boxcar', W / 2, 322);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `19px ${FONTS.body}`;
    ctx.fillText('Keep out of the lantern light. Mind the moving cars.', W / 2, 370);
    ctx.restore();
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, W / 2 - 220, 220, 440, 250, '#1c1212');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.cream;
    ctx.font = `32px ${FONTS.title}`;
    ctx.fillText('Paused', W / 2, 275);
    ctx.restore();
    this.paused.draw(ctx, this.t);
  }

  drawOutcome(ctx) {
    const o = this.outcome;
    const city = CITIES[this.from].name;
    const text = {
      boarded: ['Aboard!', `Next stop, ${CITIES[this.to].name}.`],
      caught: ['Caught by the bull', `A night in the ${city} lockup. You lose a day.`],
      missed: ['Missed her', 'The freight pulled out without you. The next one leaves tomorrow.'],
    }[o];
    ctx.fillStyle = o === 'boarded' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    const h = o === 'boarded' ? 140 : 260;
    panel(ctx, W / 2 - 360, 250, 720, h, '#1c1212');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = o === 'boarded' ? COLORS.accent : '#ff8a6a';
    ctx.font = `38px ${FONTS.title}`;
    ctx.fillText(text[0], W / 2, 300);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `20px ${FONTS.body}`;
    ctx.fillText(text[1], W / 2, 350);
    ctx.restore();
    if (o !== 'boarded' && this.outcomeT >= 0.6) this.outcomeMenu.draw(ctx, this.t);
  }
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
