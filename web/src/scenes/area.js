// Exploring an area of a location, side-on: its main street (`town`) or one
// of its other areas (`areas`), indoors or out. Walk along, talk to people,
// look at things, step into places, take exits to other areas, and head for
// the rail yard. Everything here is drawn from the location's module in
// src/locations/<id>/; nothing is generated.

import { music_follow_trail } from '../core/music.js';
import { drawPrompts } from '../core/prompts.js';
import { saveJourney } from '../core/save.js';
import { COLORS, FONTS, W, H } from '../core/screen.js';
import { LOCATIONS } from '../locations/index.js';
import { MapScene } from './map.js';
import { panel, TitleScene } from './title.js';
import { PauseMenu } from '../ui/pause.js';
import { drawItemIcon } from '../ui/party.js';
import { ITEMS } from '../items/index.js';
import { inventory_add } from '../systems/inventory.js';
import { party_has } from '../systems/party.js';
import { CHARACTERS } from '../characters/index.js';
import { drawStatusPlate } from '../ui/status.js';
import { dialog_open } from '../ui/dialog.js';
import { YardScene } from './yard.js';

const BASE = 540; // where building fronts meet the sidewalk
const FEET = 572; // where people stand
const FAR_PARALLAX = 0.35;
const WALK = 190;
const RUN = 300;
const REACH = 46; // how close you need to be to talk or go in
const SLACK = 140; // how far you can walk from mid-screen before the view follows
const HUD_FADE = 1.5; // seconds for the header and prompts to appear after a cutscene

const SKIES = {
  day: { top: '#6f9bcf', bottom: '#dbe6e8', far: '#8a96a4', lit: false },
  dusk: { top: '#2e2a4e', bottom: '#e08a5a', far: '#3e3448', lit: true },
  night: { top: '#0e1228', bottom: '#2a2e4a', far: '#1e2034', lit: true },
  haze: { top: '#9a948a', bottom: '#d8c8a0', far: '#6e6660', lit: false },
  overcast: { top: '#8d98a2', bottom: '#d9d7cb', far: '#7b7e74', lit: false },
  desert: { top: '#7aa8d8', bottom: '#f2dcb0', far: '#b88a64', lit: false },
};

const KIND_LABELS = {
  store: 'Store',
  diner: 'Something to eat',
  mission: 'Mission',
  lodging: 'A bed for the night',
  landmark: 'Landmark',
  game: 'Mini-game',
  home: 'Home',
};

export class AreaScene {
  /**
   * areaId: 'town' for the location's main street, or a key of its `areas`
   * (see src/locations/index.js). at: where to stand on arrival (default:
   * the area's `start`). fromCutscene: the cutscene ended on this very
   * picture, so start on the area's own camera and fade the header and
   * prompts in rather than cutting to them.
   */
  constructor(game, journey, locationId, areaId = 'town', { at, facing, fromCutscene = false } = {}) {
    this.game = game;
    this.journey = journey;
    this.location = LOCATIONS[locationId];
    this.areaId = areaId;
    this.town = areaId === 'town' ? this.location.town : this.location.areas[areaId];
    // The people here. Someone who can join the party (joins: a character
    // id) takes their name and look from their character file.
    this.people = (this.town.npcs ?? []).map((npc) =>
      npc.joins ? { ...npc, name: npc.name ?? CHARACTERS[npc.joins].name, look: npc.look ?? CHARACTERS[npc.joins].look } : npc,
    );
    this.sky = SKIES[this.town.sky] ?? SKIES.day;
    this.player = { x: at ?? this.town.start, facing: facing ?? this.town.facing ?? 1, step: 0 };
    this.feet = this.town.feet ?? FEET;
    this.hud = fromCutscene ? 0 : 1; // header and prompts, 0..1
    this.camX = 0;
    this.t = 0;
    this.place = null; // place id being visited
    this.notice = null; // short message, e.g. no yard yet
    this.focus = null;
    this.paused = null; // PauseMenu while paused
    this.camX = this.clampCam(at == null && this.town.camera != null ? this.town.camera : this.player.x - W / 2);

    saveJourney(journey);
    music_follow_trail(journey.trail);
  }

  clampCam(x) {
    return Math.max(0, Math.min(this.town.width - W, x));
  }

  /** Can you head for the yard from here? Only in the city you're in, if freights leave it. */
  get yardOpen() {
    return this.journey.at === this.location.id && (this.location.yard?.trains?.length ?? 0) > 0;
  }

  // ---------------------------------------------------------------- update

  update(dt, input, pointer) {
    this.t += dt;
    this.hud = Math.min(1, this.hud + dt / HUD_FADE);

    if (this.paused) {
      const choice = this.paused.update(dt, input, pointer);
      if (choice === 'resume') this.paused = null;
      else if (choice === 'map') this.game.setScene(new MapScene(this.game, this.journey));
      else if (choice === 'title') this.game.setScene(new TitleScene(this.game));
      return;
    }
    if (this.notice) this.notice.t -= dt;

    if (this.place) {
      if (input.pressed('back') || input.pressed('confirm')) this.place = null;
      return;
    }
    if (input.pressed('pause')) {
      this.paused = new PauseMenu(this.game, [
        { id: 'map', label: 'Back to the Map' },
        { id: 'title', label: 'Quit to Title' },
      ]);
      return;
    }

    // Walk the street.
    const p = this.player;
    const mx = input.move().x;
    if (Math.abs(mx) > 0.1) {
      const speed = input.down('sprint') ? RUN : WALK;
      p.x = Math.max(30, Math.min(this.town.width - 30, p.x + mx * speed * dt));
      p.facing = Math.sign(mx);
      p.step += dt * Math.abs(mx) * (input.down('sprint') ? 14 : 10);
    } else {
      p.step = 0;
    }
    // The view follows once you're more than SLACK from the middle.
    const target = p.x - W / 2;
    if (this.camX < target - SLACK) this.camX = target - SLACK;
    else if (this.camX > target + SLACK) this.camX = target + SLACK;
    this.camX = this.clampCam(this.camX);

    this.focus = this.nearest();
    if (this.focus && input.pressed('act')) this.interact(this.focus);
  }

  /** The closest thing within reach: a person, a thing, a doorway, an exit, or the way to the yard. */
  nearest() {
    const px = this.player.x;
    const options = [];
    for (const npc of this.here()) options.push({ type: 'npc', x: npc.x, npc, verb: `Talk to ${npc.name}` });
    for (const prop of this.town.props ?? []) {
      if (prop.lines) options.push({ type: 'prop', x: prop.x, prop, verb: prop.verb ?? `Look at ${prop.name}` });
    }
    for (const exit of this.town.exits ?? []) options.push({ type: 'exit', x: exit.x, exit, verb: exit.label });
    for (const b of this.town.buildings ?? []) {
      if (!b.place) continue;
      const place = this.town.places[b.place];
      const verb = b.roof === 'gate' ? `Go into ${place.name}` : `Enter ${place.name}`;
      options.push({ type: 'place', x: b.x + b.w / 2, id: b.place, verb });
    }
    if (this.town.yardSign != null) options.push({ type: 'yard', x: this.town.yardSign, verb: 'Head for the rail yard' });
    let best = null;
    for (const o of options) {
      const d = Math.abs(o.x - px);
      if (d < REACH && (!best || d < best.d)) best = { ...o, d };
    }
    return best;
  }

  interact(f) {
    // Talking and looking are conversations (src/ui/dialog.js): someone who
    // joins does at the end of it.
    if (f.type === 'npc') {
      const { name, lines, joins, character } = f.npc;
      dialog_open(this.game, { name, who: character ?? joins, lines, joins, journey: this.journey });
    } else if (f.type === 'prop') {
      const prop = f.prop;
      const full = prop.take && !this.taken(prop);
      // Something you can take shows its lines, then you take it, if you
      // looked all the way through; once it's gone, what's left (`emptyLines`).
      const lines = full || !prop.emptyLines ? prop.lines : prop.emptyLines;
      dialog_open(this.game, { name: prop.name, lines, quoted: false, onEnd: (finished) => full && finished && this.take(prop) });
    }
    else if (f.type === 'exit') {
      this.game.setScene(new AreaScene(this.game, this.journey, this.location.id, f.exit.to, { at: f.exit.at }));
    } else if (f.type === 'place') this.place = f.id;
    else if (f.type === 'yard') {
      if (this.yardOpen) this.game.setScene(new YardScene(this.game, this.journey));
      else this.notice = { text: 'No freights leave from here.', t: 3 };
    }
  }

  // ----------------------------------------------------------- taking things

  /** The save's key for something taken from a prop here. */
  takenKey(prop) {
    return `${this.location.id}:${this.areaId}:${prop.id}`;
  }

  taken(prop) {
    return !!this.journey.taken?.[this.takenKey(prop)];
  }

  /** Put a prop's item in Scout's pockets, if there's room, and remember it's gone. */
  /** The people standing here: not anyone who's already joined the party. */
  here() {
    return this.people.filter((npc) => !(npc.joins && party_has(this.journey, npc.joins)));
  }

  take(prop) {
    const scout = this.journey.party[0];
    if (inventory_add(scout, prop.take) < 0) {
      this.notice = { text: 'No room to carry it. (Check the journal: I, Tab or Y.)', t: 3 };
      return;
    }
    this.journey.taken = { ...this.journey.taken, [this.takenKey(prop)]: true };
    saveJourney(this.journey);
    this.notice = { text: `Took the ${ITEMS[prop.take].name.toLowerCase()}.`, t: 2.5 };
  }

  // ------------------------------------------------------------------ draw

  draw(ctx) {
    const view = { camX: this.camX, W, H, base: BASE, t: this.t };
    const town = this.town;

    if (town.draw?.backdrop) {
      // The area draws its own world: sky, ground and all.
      town.draw.backdrop(ctx, view);
    } else if (town.interior) {
      drawInterior(ctx, town.interior, this.camX);
    } else {
      // Sky.
      const g = ctx.createLinearGradient(0, 0, 0, BASE);
      g.addColorStop(0, this.sky.top);
      g.addColorStop(1, this.sky.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Far silhouettes.
      ctx.save();
      ctx.translate(-this.camX * FAR_PARALLAX, 0);
      ctx.fillStyle = this.sky.far;
      for (const s of town.far ?? []) drawFarShape(ctx, s);
      ctx.restore();
      town.draw?.far?.(ctx, view);

      if (town.ground === 'dirt') {
        // A dirt lane, ruts, and a grass verge.
        ctx.fillStyle = '#7a6c54';
        ctx.fillRect(0, BASE, W, H - BASE);
        ctx.fillStyle = 'rgba(70, 60, 44, 0.45)';
        ctx.fillRect(0, BASE + 30, W, 3);
        ctx.fillRect(0, BASE + 60, W, 3);
        ctx.fillStyle = '#5f6444';
        ctx.fillRect(0, BASE + 90, W, H - BASE - 90);
        ctx.fillStyle = '#6e7350';
        for (let x = -(this.camX % 23); x < W; x += 23) ctx.fillRect(x, BASE + 86, 3, 8);
      } else {
        // Street and sidewalk.
        ctx.fillStyle = '#5a524a';
        ctx.fillRect(0, BASE, W, 52);
        ctx.fillStyle = '#7a7268';
        for (let x = -(this.camX % 60); x < W; x += 60) ctx.fillRect(x, BASE, 2, 52);
        ctx.fillStyle = '#8a8278';
        ctx.fillRect(0, BASE + 50, W, 6); // curb
        ctx.fillStyle = '#3a3532';
        ctx.fillRect(0, BASE + 56, W, H - BASE - 56);
      }
    }

    // Buildings.
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (const b of town.buildings ?? []) {
      if (b.x + b.w < this.camX - 20 || b.x > this.camX + W + 20) continue;
      drawBuilding(ctx, b, this.sky.lit, this.focus?.type === 'place' && this.focus.id === b.place);
    }
    for (const x of town.lamps ?? []) drawLamp(ctx, x, this.sky.lit);
    if (town.yardSign != null) drawYardSign(ctx, town.yardSign, this.yardOpen);
    for (const exit of town.exits ?? []) if (exit.sign) drawSignpost(ctx, exit.x, exit.sign);
    for (const prop of town.props ?? []) {
      if (prop.x > this.camX - 200 && prop.x < this.camX + W + 200) drawProp(ctx, prop, this.focus?.prop === prop, prop.take && this.taken(prop));
    }
    ctx.restore();
    town.draw?.street?.(ctx, view);

    // People.
    ctx.save();
    ctx.translate(-this.camX, 0);
    const person = town.draw?.person;
    for (const npc of this.here()) {
      const facing = this.player.x < npc.x ? -1 : 1;
      if (person) person(ctx, { x: npc.x, feet: this.feet, look: npc.look, facing, step: 0, t: this.t });
      else drawPerson(ctx, npc.x, this.feet, npc.look, facing, 0, this.t);
    }
    const p = this.player;
    if (person) person(ctx, { x: p.x, feet: this.feet, facing: p.facing, step: p.step, t: this.t, player: true });
    else drawPerson(ctx, p.x, this.feet, HOBO, p.facing, p.step, this.t, true);
    if (this.focus && !this.game.overlay && !this.place) {
      ctx.globalAlpha = this.hud;
      bubble(ctx, this.focus.verb, p.x, this.feet - (town.figureHeight ?? 110), this.camX);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    town.draw?.over?.(ctx, view);

    // Status top left (src/ui/status.js): who, where, when; it opens the journal.
    drawStatusPlate(ctx, this.journey, { title: this.town.name ?? this.location.name, t: this.t, alpha: this.hud });

    if (this.notice && this.notice.t > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.notice.t * 2);
      panel(ctx, W / 2 - 360, 90, 720, 60, '#1c1212');
      ctx.fillStyle = COLORS.cream;
      ctx.font = `19px ${FONTS.body}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.notice.text, W / 2, 121);
      ctx.restore();
    }

    if (this.place) this.drawPlace(ctx);

    const prompts = this.place ? [['back', 'Leave']] : [['sprint', 'Hurry'], ['act', 'Act'], ['pause', 'Menu']];
    ctx.save();
    ctx.globalAlpha = this.hud;
    drawPrompts(ctx, this.game.input, prompts, W - 24, H - 22);
    ctx.restore();

    if (this.paused) this.paused.draw(ctx);
  }

  drawPlace(ctx) {
    const place = this.town.places[this.place];
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, W, H);
    const x = W / 2 - 340;
    panel(ctx, x, 110, 680, 450, '#1c1212');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.accent;
    ctx.font = `36px ${FONTS.title}`;
    ctx.fillText(place.name, W / 2, 168);
    ctx.fillStyle = 'rgba(244, 230, 200, 0.55)';
    ctx.font = `16px ${FONTS.body}`;
    ctx.fillText(KIND_LABELS[place.kind] ?? place.kind, W / 2, 204);
    ctx.textAlign = 'left';
    let y = wrapLeft(ctx, place.blurb, x + 50, 248, 580, 28, `20px ${FONTS.body}`, COLORS.cream);

    y += 24;
    ctx.font = `19px ${FONTS.body}`;
    if (place.stock?.length) {
      for (const [item, price] of place.stock) {
        ctx.fillStyle = 'rgba(244, 230, 200, 0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(item, x + 80, y);
        ctx.textAlign = 'right';
        ctx.fillText(price, x + 600, y);
        ctx.strokeStyle = 'rgba(244, 230, 200, 0.2)';
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(x + 80 + ctx.measureText(item).width + 10, y + 6);
        ctx.lineTo(x + 590 - ctx.measureText(price).width, y + 6);
        ctx.stroke();
        ctx.setLineDash([]);
        y += 32;
      }
      y += 6;
    }
    const soon = {
      store: 'Buying and selling comes later.',
      diner: 'Buying a meal comes later.',
      mission: 'Staying for the soup comes later.',
      lodging: 'Taking a bed comes later.',
      game: place.game ? `${place.game}: a mini-game for later.` : 'A mini-game for later.',
      landmark: '',
      home: '',
    }[place.kind];
    if (soon) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(244, 230, 200, 0.4)';
      ctx.fillText(`(${soon})`, W / 2, Math.min(y + 10, 528));
    }
    ctx.restore();
  }
}

// --------------------------------------------------------------- drawing

// The player: the teenager from the opening cutscene, same cap and coat.
const HOBO = { coat: '#5d5348', pants: '#3d3833', hat: 'cap', skin: '#c8956d', bindle: true };

function drawFarShape(ctx, { shape, x, w, h }) {
  const y = BASE;
  ctx.beginPath();
  switch (shape) {
    case 'tower':
      ctx.rect(x, y - h, w, h);
      ctx.rect(x + w * 0.2, y - h - 20, w * 0.6, 20);
      break;
    case 'spire':
      ctx.rect(x, y - h * 0.8, w, h * 0.8);
      ctx.moveTo(x + w * 0.1, y - h * 0.8);
      ctx.lineTo(x + w / 2, y - h);
      ctx.lineTo(x + w * 0.9, y - h * 0.8);
      break;
    case 'dome':
      ctx.rect(x, y - h * 0.5, w, h * 0.5);
      ctx.moveTo(x + w * 0.2, y - h * 0.5);
      ctx.arc(x + w / 2, y - h * 0.5, w * 0.3, Math.PI, 0);
      ctx.rect(x + w / 2 - 3, y - h, 6, h * 0.25);
      break;
    case 'stack':
      ctx.rect(x, y - h, w, h);
      break;
    case 'tank':
      ctx.rect(x + w * 0.15, y - h * 0.45, 6, h * 0.45);
      ctx.rect(x + w * 0.85 - 6, y - h * 0.45, 6, h * 0.45);
      ctx.rect(x, y - h, w, h * 0.55);
      break;
    case 'mountain':
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.3, y - h * 0.8);
      ctx.lineTo(x + w * 0.45, y - h);
      ctx.lineTo(x + w * 0.6, y - h * 0.75);
      ctx.lineTo(x + w * 0.75, y - h * 0.85);
      ctx.lineTo(x + w, y);
      break;
    case 'block':
    default:
      ctx.rect(x, y - h, w, h);
  }
  ctx.fill();
}

function drawBuilding(ctx, b, lit, focused) {
  const top = BASE - b.h;
  const door = b.x + b.w / 2;

  if (b.roof === 'gate') {
    // An open place (park, market, alley): two posts and an arch with the sign.
    ctx.fillStyle = shade(b.wall, -0.25);
    ctx.fillRect(b.x + 10, BASE - 150, 16, 150);
    ctx.fillRect(b.x + b.w - 26, BASE - 150, 16, 150);
    ctx.fillRect(b.x + 6, BASE - 160, b.w - 12, 14);
    if (b.sign) signBoard(ctx, b.sign, door, BASE - 182, focused);
    return;
  }

  ctx.fillStyle = b.wall;
  ctx.fillRect(b.x, top, b.w, b.h);
  // Roofline.
  ctx.fillStyle = shade(b.wall, -0.3);
  if (b.roof === 'gable') {
    ctx.beginPath();
    ctx.moveTo(b.x - 8, top);
    ctx.lineTo(door, top - b.w * 0.28);
    ctx.lineTo(b.x + b.w + 8, top);
    ctx.fill();
  } else if (b.roof === 'false-front') {
    ctx.fillRect(b.x + b.w * 0.15, top - 26, b.w * 0.7, 28);
    ctx.fillRect(b.x + b.w * 0.3, top - 40, b.w * 0.4, 16);
  } else {
    ctx.fillRect(b.x - 4, top - 6, b.w + 8, 10); // cornice
  }

  // Windows on a grid, the ground floor left for the door and shop front.
  const cols = b.windows === false ? 0 : Math.max(1, Math.floor((b.w - 30) / 48));
  const gap = (b.w - cols * 26) / (cols + 1);
  let row = 0;
  for (let y = top + 24; y < BASE - 110; y += 56, row++) {
    for (let c = 0; c < cols; c++) {
      const wx = b.x + gap + c * (26 + gap);
      const on = lit && (row + c * 2 + Math.round(b.x / 10)) % 3 !== 0;
      ctx.fillStyle = on ? '#e8c070' : shade(b.wall, -0.45);
      ctx.fillRect(wx, y, 26, 34);
      ctx.fillStyle = shade(b.wall, -0.2);
      ctx.fillRect(wx - 3, y + 34, 32, 4);
    }
  }

  // Ground floor: door, and a shop window if it's a place.
  ctx.fillStyle = shade(b.wall, -0.5);
  ctx.fillRect(door - 16, BASE - 64, 32, 64);
  if (b.place && b.shop !== false) {
    ctx.fillStyle = lit ? '#d8b070' : shade(b.wall, 0.25);
    ctx.fillRect(b.x + 14, BASE - 60, door - 30 - b.x - 14, 38);
    ctx.fillRect(door + 30, BASE - 60, b.x + b.w - 14 - door - 30, 38);
  }
  if (b.sign) signBoard(ctx, b.sign, door, BASE - 84, focused);
}

function signBoard(ctx, text, x, y, focused) {
  ctx.save();
  ctx.font = `bold 15px ${FONTS.body}`;
  const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = focused ? '#3a2416' : '#24180f';
  ctx.fillRect(x - w / 2, y - 14, w, 28);
  ctx.strokeStyle = focused ? COLORS.accent : 'rgba(244, 230, 200, 0.5)';
  ctx.lineWidth = focused ? 2 : 1;
  ctx.strokeRect(x - w / 2 + 2, y - 12, w - 4, 24);
  ctx.fillStyle = focused ? COLORS.accent : COLORS.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawLamp(ctx, x, lit) {
  ctx.fillStyle = '#2a2624';
  ctx.fillRect(x - 3, BASE - 150, 6, 170);
  ctx.fillRect(x - 10, BASE - 156, 20, 8);
  ctx.fillStyle = lit ? '#ffe2a0' : '#8a8478';
  ctx.fillRect(x - 7, BASE - 172, 14, 16);
  if (lit) {
    const g = ctx.createRadialGradient(x, BASE - 164, 4, x, BASE - 164, 90);
    g.addColorStop(0, 'rgba(255, 220, 150, 0.35)');
    g.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 90, BASE - 254, 180, 180);
  }
}

/** A fingerpost pointing the way out of an area. */
function drawSignpost(ctx, x, text) {
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 3, BASE - 100, 6, 130);
  ctx.save();
  ctx.font = `bold 14px ${FONTS.body}`;
  const w = ctx.measureText(text).width + 30;
  ctx.translate(x, BASE - 92);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-w / 2, -16);
  ctx.lineTo(w / 2 - 14, -16);
  ctx.lineTo(w / 2 + 2, 0);
  ctx.lineTo(w / 2 - 14, 16);
  ctx.lineTo(-w / 2, 16);
  ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, -6, 1);
  ctx.restore();
}

// ------------------------------------------------------------- interiors

// Windows and things on the wall hang this much lower than they're drawn,
// so a person indoors comes up to them the way they would in a real room.
const HANG = 60;

/** Indoors: wallpaper, wainscot and floorboards, windows onto the weather. */
function drawInterior(ctx, room, camX) {
  const wall = room.wall ?? '#a89a7c';
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, BASE);
  ctx.fillStyle = shade(wall, -0.08);
  for (let x = -(camX % 36); x < W; x += 36) ctx.fillRect(x, 0, 12, BASE - 96);
  // Water stains, a strip of paper coming away.
  ctx.fillStyle = 'rgba(90, 70, 40, 0.12)';
  for (const sx of room.stains ?? []) {
    ctx.beginPath();
    ctx.ellipse(sx - camX, 120, 70, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ceiling beam, wainscot, baseboard.
  ctx.fillStyle = '#4a3a2e';
  ctx.fillRect(0, 64, W, 22);
  ctx.fillStyle = shade(room.wainscot ?? '#7a5e46', 0);
  ctx.fillRect(0, BASE - 96, W, 96);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let x = -(camX % 70); x < W; x += 70) ctx.fillRect(x, BASE - 96, 3, 96);
  ctx.fillStyle = '#3e3026';
  ctx.fillRect(0, BASE - 100, W, 6);
  ctx.fillRect(0, BASE - 8, W, 8);
  // Floor.
  ctx.fillStyle = room.floor ?? '#6a5240';
  ctx.fillRect(0, BASE, W, H - BASE);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = BASE + 14; y < H; y += 18) ctx.fillRect(0, y, W, 2);
  for (const wx of room.windows ?? []) {
    const x = wx - camX;
    if (x < -120 || x > W + 120) continue;
    ctx.save();
    ctx.translate(0, HANG); // at a person's height, not up by the ceiling
    ctx.fillStyle = '#3e3026';
    ctx.fillRect(x - 56, BASE - 330, 112, 150);
    const g = ctx.createLinearGradient(0, BASE - 320, 0, BASE - 190);
    g.addColorStop(0, '#9aa3aa');
    g.addColorStop(1, '#cfccbf');
    ctx.fillStyle = g;
    ctx.fillRect(x - 48, BASE - 322, 96, 134);
    ctx.fillStyle = '#3e3026';
    ctx.fillRect(x - 3, BASE - 322, 6, 134);
    ctx.fillRect(x - 48, BASE - 258, 96, 5);
    // A torn curtain on one side.
    ctx.fillStyle = 'rgba(170, 150, 120, 0.85)';
    ctx.beginPath();
    ctx.moveTo(x - 60, BASE - 336);
    ctx.lineTo(x - 26, BASE - 336);
    ctx.lineTo(x - 36, BASE - 220);
    ctx.lineTo(x - 44, BASE - 236);
    ctx.lineTo(x - 52, BASE - 180);
    ctx.lineTo(x - 60, BASE - 180);
    ctx.fill();
    ctx.restore();
  }
}

/** The things in an area you can look at, by `kind`. Drawn in world x. empty: its item's been taken. */
function drawProp(ctx, prop, focused, empty) {
  const x = prop.x;
  ctx.save();
  switch (prop.kind) {
    case 'door': {
      ctx.fillStyle = '#3e3026';
      ctx.fillRect(x - 44, BASE - 196, 88, 196);
      ctx.fillStyle = '#5e4a3a';
      ctx.fillRect(x - 36, BASE - 188, 72, 188);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 28, BASE - 176, 56, 70);
      ctx.fillRect(x - 28, BASE - 92, 56, 70);
      ctx.fillStyle = '#b8a070';
      ctx.beginPath();
      ctx.arc(x + 24, BASE - 96, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'coat': {
      ctx.translate(0, HANG);
      ctx.fillStyle = '#3e3026';
      ctx.fillRect(x - 40, BASE - 260, 80, 8);
      ctx.fillStyle = '#2a2420';
      ctx.fillRect(x - 3, BASE - 254, 6, 12);
      ctx.fillStyle = '#4a4034';
      ctx.beginPath();
      ctx.moveTo(x - 10, BASE - 244);
      ctx.lineTo(x + 10, BASE - 244);
      ctx.lineTo(x + 34, BASE - 220);
      ctx.lineTo(x + 30, BASE - 120);
      ctx.lineTo(x - 30, BASE - 120);
      ctx.lineTo(x - 34, BASE - 220);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x - 1, BASE - 236, 2, 110);
      ctx.fillRect(x - 22, BASE - 170, 16, 4);
      break;
    }
    case 'table': {
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(x - 90, BASE - 84, 180, 12);
      ctx.fillRect(x - 80, BASE - 72, 8, 72);
      ctx.fillRect(x + 72, BASE - 72, 8, 72);
      // Chairs: three tucked in, one pulled out and turned.
      ctx.fillStyle = '#4a3426';
      for (const cx of [x - 60, x + 50]) {
        ctx.fillRect(cx, BASE - 130, 6, 130);
        ctx.fillRect(cx, BASE - 50, 34, 6);
      }
      ctx.save();
      ctx.translate(x + 130, BASE);
      ctx.rotate(0.12);
      ctx.fillRect(0, -130, 6, 130);
      ctx.fillRect(0, -50, 36, 6);
      ctx.fillRect(30, -50, 6, 50);
      ctx.restore();
      ctx.fillStyle = '#d8d0c0'; // one cup
      ctx.fillRect(x + 20, BASE - 96, 14, 12);
      break;
    }
    case 'sink': {
      ctx.fillStyle = '#6e5a46';
      ctx.fillRect(x - 70, BASE - 92, 140, 92);
      ctx.fillStyle = '#b8b4aa';
      ctx.fillRect(x - 60, BASE - 104, 120, 16);
      ctx.fillStyle = '#7e7a72';
      ctx.fillRect(x - 6, BASE - 140, 10, 36);
      ctx.fillRect(x - 6, BASE - 140, 26, 8);
      // Bottles on the floor in front, some on their sides.
      const colours = ['#3e5a3a', '#5a3e26', '#3e5a3a', '#4a4a3a', '#5a3e26', '#3e5a3a'];
      colours.forEach((c, k) => {
        ctx.fillStyle = c;
        const bx = x - 66 + k * 24;
        if (k % 3 === 2) {
          ctx.fillRect(bx - 6, BASE + 14, 30, 11);
          ctx.fillRect(bx + 24, BASE + 17, 8, 5);
        } else {
          ctx.fillRect(bx, BASE - 2, 12, 28);
          ctx.fillRect(bx + 3, BASE - 12, 6, 12);
        }
      });
      break;
    }
    case 'stove': {
      ctx.fillStyle = '#2a2826';
      ctx.fillRect(x - 46, BASE - 110, 92, 110);
      ctx.fillRect(x - 54, BASE - 118, 108, 10);
      ctx.fillRect(x + 16, 86, 14, BASE - 204); // stovepipe up to the ceiling
      ctx.fillStyle = '#3e3a36';
      ctx.fillRect(x - 32, BASE - 82, 64, 40);
      ctx.fillStyle = '#5a5650';
      ctx.fillRect(x - 6, BASE - 66, 12, 6);
      break;
    }
    case 'calendar': {
      ctx.translate(0, HANG);
      ctx.fillStyle = '#2a2420';
      ctx.fillRect(x - 1, BASE - 296, 2, 8);
      ctx.fillStyle = '#e8e0cc';
      ctx.fillRect(x - 26, BASE - 288, 52, 72);
      ctx.fillStyle = '#9a3a2a';
      ctx.fillRect(x - 26, BASE - 288, 52, 16);
      ctx.fillStyle = '#e8e0cc';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MARCH', x, BASE - 280);
      ctx.fillStyle = 'rgba(40, 30, 20, 0.6)';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) ctx.fillRect(x - 21 + c * 7.5, BASE - 266 + r * 11, 5, 5);
      ctx.fillStyle = '#2a2420';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillText('1931', x, BASE - 222);
      break;
    }
    case 'photo': {
      ctx.translate(0, HANG);
      ctx.fillStyle = '#3e2e22';
      ctx.fillRect(x - 36, BASE - 300, 72, 56);
      ctx.fillStyle = '#b8a07a';
      ctx.fillRect(x - 30, BASE - 294, 60, 44);
      ctx.fillStyle = '#5a4630';
      for (const [px, h] of [
        [-20, 26],
        [-7, 30],
        [6, 20],
        [17, 16],
      ]) {
        ctx.fillRect(x + px, BASE - 252 - h, 8, h);
        ctx.beginPath();
        ctx.arc(x + px + 4, BASE - 256 - h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cupboard': {
      // A kitchen cupboard, doors standing ajar on bare shelves.
      ctx.fillStyle = '#4e3a2c';
      ctx.fillRect(x - 54, BASE - 214, 108, 214);
      ctx.fillStyle = '#2a1e18'; // inside
      ctx.fillRect(x - 46, BASE - 204, 92, 196);
      ctx.fillStyle = '#5e4836'; // shelves
      for (const sy of [-150, -96, -42]) ctx.fillRect(x - 46, BASE + sy, 92, 6);
      if (!empty && prop.take) drawItemIcon(ctx, prop.take, x + 6, BASE - 112, 26);
      ctx.fillStyle = '#6a5240'; // the doors, swung part open
      ctx.beginPath();
      ctx.moveTo(x - 54, BASE - 214);
      ctx.lineTo(x - 26, BASE - 222);
      ctx.lineTo(x - 26, BASE + 4);
      ctx.lineTo(x - 54, BASE);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 54, BASE - 214);
      ctx.lineTo(x + 82, BASE - 224);
      ctx.lineTo(x + 82, BASE + 6);
      ctx.lineTo(x + 54, BASE);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b8a070';
      ctx.fillRect(x - 32, BASE - 112, 4, 10);
      ctx.fillRect(x + 76, BASE - 112, 4, 10);
      break;
    }
    case 'bed': {
      ctx.fillStyle = '#4a3a2e';
      ctx.fillRect(x - 90, BASE - 60, 180, 14);
      ctx.fillRect(x - 90, BASE - 110, 10, 110);
      ctx.fillRect(x + 80, BASE - 80, 10, 80);
      ctx.fillStyle = '#9a9080';
      ctx.fillRect(x - 80, BASE - 74, 160, 16);
      ctx.fillStyle = '#c8c0b0';
      ctx.fillRect(x - 78, BASE - 84, 40, 12);
      break;
    }
    case 'mailbox': {
      ctx.fillStyle = '#5a4636';
      ctx.fillRect(x - 3, BASE - 64, 6, 84);
      ctx.fillStyle = '#7a7670';
      ctx.beginPath();
      ctx.roundRect(x - 22, BASE - 82, 44, 20, [10, 10, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#1e1a18';
      ctx.fillRect(x - 22, BASE - 72, 4, 10);
      ctx.save();
      ctx.translate(x - 22, BASE - 62);
      ctx.rotate(0.9); // the door hanging open
      ctx.fillStyle = '#5c5852';
      ctx.fillRect(0, -18, 3, 18);
      ctx.restore();
      break;
    }
    case 'notice': {
      ctx.fillStyle = '#ece4d0';
      ctx.fillRect(x - 14, BASE - 106, 28, 36);
      ctx.fillStyle = 'rgba(40, 30, 20, 0.6)';
      for (let r = 0; r < 5; r++) ctx.fillRect(x - 10, BASE - 100 + r * 6, r === 0 ? 20 : 14 + ((r * 5) % 7), 2);
      break;
    }
    default:
      break;
  }
  if (focused && prop.kind !== 'door') {
    // A soft glow so it reads as something you can look at.
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(242, 184, 102, 0.08)';
    ctx.fillRect(x - 70, BASE - 320, 140, 340);
  }
  ctx.restore();
}

function drawYardSign(ctx, x, open) {
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 3, BASE - 100, 6, 130);
  ctx.save();
  ctx.translate(x, BASE - 92);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-50, -16);
  ctx.lineTo(40, -16);
  ctx.lineTo(56, 0);
  ctx.lineTo(40, 16);
  ctx.lineTo(-50, 16);
  ctx.fill();
  ctx.fillStyle = open ? '#2a1a12' : 'rgba(42, 26, 18, 0.5)';
  ctx.font = `bold 14px ${FONTS.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RAIL YARD', -2, 1);
  ctx.restore();
}

/** A person seen side-on, feet at (x, feet). facing 1 = right. */
function drawPerson(ctx, x, feet, look, facing, step, t, isPlayer = false) {
  ctx.save();
  ctx.translate(x, feet);
  ctx.scale(facing, 1);
  const swing = Math.sin(step) * 8;
  const breathe = Math.sin(t * 2 + x) * 0.6;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs.
  ctx.strokeStyle = look.pants;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(swing * 0.6, -2);
  ctx.moveTo(0, -34);
  ctx.lineTo(-swing * 0.6, -2);
  ctx.stroke();
  ctx.fillStyle = '#1e1814';
  ctx.fillRect(swing * 0.6 - 4, -4, 12, 5);
  ctx.fillRect(-swing * 0.6 - 4, -4, 12, 5);

  // Coat.
  ctx.fillStyle = look.coat;
  ctx.beginPath();
  ctx.roundRect(-11, -72 + breathe, 22, 42, 5);
  ctx.fill();
  // Arm.
  ctx.strokeStyle = shade(look.coat, -0.15);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(2, -66 + breathe);
  ctx.lineTo(4 - swing * 0.5, -40);
  ctx.stroke();

  // Head and hat.
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(2, -82 + breathe, 9, 0, Math.PI * 2);
  ctx.fill();
  const hat = look.hat;
  ctx.fillStyle = hat === 'straw' ? '#d8c088' : hat === 'cloche' ? '#6a3a4a' : '#2b221b';
  if (hat === 'fedora' || hat === 'straw') {
    ctx.fillRect(-12, -89 + breathe, 28, 4);
    ctx.fillRect(-6, -98 + breathe, 16, 10);
  } else if (hat === 'cap') {
    ctx.fillRect(-8, -95 + breathe, 18, 8);
    ctx.fillRect(8, -89 + breathe, 9, 3);
  } else if (hat === 'bowler') {
    ctx.fillRect(-10, -89 + breathe, 24, 3);
    ctx.beginPath();
    ctx.arc(2, -90 + breathe, 9, Math.PI, 0);
    ctx.fill();
  } else if (hat === 'cloche') {
    ctx.beginPath();
    ctx.arc(2, -86 + breathe, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-10, -87 + breathe, 24, 3);
  }

  if (isPlayer && look.bindle) {
    // Bindle on a stick over the back shoulder.
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -64 + breathe);
    ctx.lineTo(-22, -92 + breathe);
    ctx.stroke();
    ctx.fillStyle = '#b5482f';
    ctx.beginPath();
    ctx.arc(-24, -88 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A prompt over the player's head, kept on screen at the ends of an area. */
function bubble(ctx, text, x, y, camX) {
  ctx.save();
  ctx.font = `17px ${FONTS.body}`;
  const w = ctx.measureText(text).width + 24;
  x = Math.max(camX + w / 2 + 10, Math.min(camX + W - w / 2 - 10, x));
  ctx.fillStyle = 'rgba(20, 14, 12, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 18, w, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapLeft(ctx, text, x, y, maxW, lineH, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineH;
}

/** Lighten (k > 0) or darken (k < 0) a hex colour. */
function shade(hex, k) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = n.map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
  return `rgb(${out.join(',')})`;
}
