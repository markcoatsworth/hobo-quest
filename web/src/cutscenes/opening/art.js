// Drawing for the opening cutscene: a sheriff's car on a country road up the
// Hudson from New York City, past shuttered mills and thin farms, seen
// side-on and through the windshield, and the house at the end of it.
// Everything is drawn in code; nothing is random, so every viewing is the
// same.

import { W, H } from '../../core/screen.js';
import {
  BANK,
  CLIFF_TOP,
  DUST,
  HOUSE_X,
  KID,
  PEOPLE,
  RIVER_TOP,
  SIDE_ROAD,
  SKY_LOW,
  SKY_TOP,
  YARD,
  drawBareTree,
  drawDustTrail,
  drawFarm,
  drawFence,
  drawFields,
  drawFigure,
  drawFreight,
  drawGround,
  drawHaze,
  drawHouse,
  drawKidSide,
  drawMailbox,
  drawMill,
  drawPoles,
  drawRiverValley,
  drawRoad,
  drawSilo,
  drawSky,
  drawSmoke,
  drawVignette,
  fixed,
  wrap,
} from '../../art/hudson.js';

// The teenager's look, the same in every shot.
const SHERIFF = { hat: '#5e5040', hatDark: '#463a2e', band: '#2a221c', shirt: '#a88c5e', shirtDark: '#8c7248', skin: '#d6a57c', tache: '#7a6a58' };
const CAR = { body: '#22262a', light: '#3c434a', chrome: '#b3b0a8', chromeDark: '#7d7a73' };

// An overcast April day in the valley.
const blink = (t, offset) => (t + offset) % 4.3 < 0.13;

// ============================================================ the car, side

/**
 * The sheriff's sedan seen from its left (driver's) side, facing left.
 * (x, y): middle of the car where its wheels touch the road. roll: how far
 * the wheels have turned, in px travelled. kid: whether the teenager is
 * still in the passenger seat.
 */
function drawCarSide(ctx, x, y, t, { roll = 0, bob = 0, kid = true } = {}) {
  ctx.save();
  ctx.translate(x, y + bob);

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, -bob + 2, 150, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spare tire on the back.
  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.arc(130, -62, 20, 0, Math.PI * 2);
  ctx.fill();

  // Cabin.
  ctx.fillStyle = CAR.body;
  ctx.beginPath();
  ctx.moveTo(-44, -76);
  ctx.lineTo(-26, -128);
  ctx.quadraticCurveTo(40, -136, 96, -126);
  ctx.quadraticCurveTo(122, -112, 124, -78);
  ctx.closePath();
  ctx.fill();

  // Windows: glass the colour of the dusty sky, the people inside.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-34, -82);
  ctx.lineTo(-20, -120);
  ctx.lineTo(30, -122);
  ctx.lineTo(30, -82);
  ctx.closePath();
  ctx.rect(38, -122, 66, 40);
  ctx.fillStyle = '#7d7262';
  ctx.fill();
  ctx.clip();
  // The kid, on the far side, a little behind.
  if (kid) {
    ctx.fillStyle = KID.skin;
    ctx.beginPath();
    ctx.arc(20, -96, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = KID.cap;
    ctx.fillRect(10, -110, 20, 8);
    ctx.fillRect(5, -105, 10, 3);
  }
  // The sheriff at the wheel.
  ctx.fillStyle = SHERIFF.shirt;
  ctx.fillRect(-12, -88, 26, 14);
  ctx.fillStyle = SHERIFF.skin;
  ctx.beginPath();
  ctx.arc(0, -96, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SHERIFF.hat;
  ctx.fillRect(-14, -106, 28, 4);
  ctx.beginPath();
  ctx.moveTo(-9, -104);
  ctx.lineTo(-7, -116);
  ctx.lineTo(0, -113);
  ctx.lineTo(7, -116);
  ctx.lineTo(9, -104);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 240, 210, 0.12)';
  ctx.fillRect(-40, -130, 150, 50);
  ctx.restore();

  // Hood and lower body.
  ctx.fillStyle = CAR.body;
  ctx.beginPath();
  ctx.roundRect(-128, -80, 100, 30, [10, 0, 0, 4]);
  ctx.fill();
  // The body runs right up to the bottom of the windows, so nothing behind
  // the car shows through under the doors.
  ctx.beginPath();
  ctx.roundRect(-128, -80, 262, 52, [10, 8, 8, 8]);
  ctx.fill();
  ctx.fillStyle = CAR.light;
  ctx.fillRect(-120, -79, 88, 3); // hood line
  ctx.fillRect(-26, -76, 2, 46); // door seams
  ctx.fillRect(34, -76, 2, 46);

  // Radiator and headlight.
  ctx.fillStyle = CAR.chrome;
  ctx.fillRect(-134, -84, 8, 46);
  ctx.beginPath();
  ctx.arc(-126, -72, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e6b8';
  ctx.beginPath();
  ctx.arc(-129, -72, 6, 0, Math.PI * 2);
  ctx.fill();
  // Spotlight on the windshield post.
  ctx.fillStyle = CAR.chrome;
  ctx.fillRect(-40, -114, 12, 7);
  ctx.fillStyle = '#c0453a';
  ctx.fillRect(-44, -114, 4, 7);

  // Sheriff's star on the door.
  drawStar(ctx, 4, -46, 10, '#d8b04a');

  // Fenders over the wheels, running board between.
  ctx.fillStyle = CAR.body;
  for (const wx of [-86, 82]) {
    ctx.beginPath();
    ctx.ellipse(wx, -26, 38, 30, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = CAR.light;
  ctx.fillRect(-50, -30, 98, 5);
  ctx.fillStyle = CAR.chrome;
  ctx.fillRect(-140, -34, 10, 5); // bumpers
  ctx.fillRect(136, -34, 10, 5);

  // Wheels.
  for (const wx of [-86, 82]) drawWheel(ctx, wx, -24 - bob, 24, -roll / 24);

  ctx.restore();
}

function drawWheel(ctx, x, y, r, angle) {
  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a5650';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9a968e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = angle + (k * Math.PI) / 4;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
  }
  ctx.stroke();
  ctx.fillStyle = CAR.chrome;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// ============================================================ shot 1: the road

/** The car on the river road, camera keeping pace with it. */
export function drawRoadShot(ctx, t) {
  const speed = 260; // px/s the country slides by
  const s = t * speed;
  drawSky(ctx, RIVER_TOP, [1010, 150]);
  drawRiverValley(ctx, s, t);
  drawGround(ctx, BANK);
  drawFields(ctx);

  // Middle distance: mills along the bank, thin farms, bare April trees.
  const span = 2300;
  for (const [kind, x0] of [
    ['mill', 120],
    ['tree', 560],
    ['farm', 820],
    ['tree', 1260],
    ['silo', 1420],
    ['mill', 1820],
  ]) {
    const x = wrap(x0 + s * 0.3, span) - 300;
    if (kind === 'mill') drawMill(ctx, x, BANK + 30, t, x0 < 1000);
    else if (kind === 'farm') drawFarm(ctx, x, BANK + 30);
    else if (kind === 'silo') drawSilo(ctx, x, BANK + 30);
    else drawBareTree(ctx, x, BANK + 40, 0.9);
  }

  drawPoles(ctx, wrap(s * 0.85, 460), SIDE_ROAD - 44);
  drawFence(ctx, wrap(s, 72), SIDE_ROAD - 42);
  drawRoad(ctx);

  const carX = 560;
  drawDustTrail(ctx, carX + 90, SIDE_ROAD, t, 0.6);
  drawCarSide(ctx, carX, SIDE_ROAD, t, { roll: s, bob: Math.sin(t * 9) * 1.2 });

  drawHaze(ctx, 0.12);
  drawVignette(ctx);
}

// ======================================================= shot 2: the windshield

const FRONT_HORIZON = 250;
const FOCAL = 520;
const EYE_HEIGHT = 1.6;

/** Screen position of a point on the ground (lateral X, distance z) behind the car. */
function project(X, z) {
  return [W / 2 + (X * FOCAL) / z, FRONT_HORIZON + (EYE_HEIGHT * FOCAL) / z];
}

/** Things beside the road, sliding away behind the car toward the horizon. */
function drawReceding(ctx, t) {
  const v = 9; // world units a second
  const items = [];
  const row = (X, spacing, count, kind) => {
    const span = spacing * count;
    for (let i = 0; i < count; i++) items.push({ X, z: 1.2 + wrap(i * spacing + v * t, span), kind, i });
  };
  row(-5.5, 2.6, 30, 'post');
  row(8, 14, 7, 'pole');
  row(-17, 33, 3, 'tree');
  items.sort((a, b) => b.z - a.z);

  // Wires first, so posts and poles sit on top of them.
  ctx.strokeStyle = 'rgba(70, 56, 44, 0.65)';
  ctx.lineWidth = 1;
  for (const [kind, X, spacing, heights] of [
    ['post', -5.5, 2.6, [0.9, 1.2]],
    ['pole', 8, 14, [7.2]],
  ]) {
    const zs = items.filter((it) => it.kind === kind).map((it) => it.z).sort((a, b) => a - b);
    for (let k = 1; k < zs.length; k++) {
      if (zs[k] - zs[k - 1] > spacing * 1.5) continue; // the wrap
      for (const h of heights) {
        const [x1, g1] = project(X, zs[k - 1]);
        const [x2, g2] = project(X, zs[k]);
        ctx.beginPath();
        ctx.moveTo(x1, g1 - (h * FOCAL) / zs[k - 1]);
        ctx.lineTo(x2, g2 - (h * FOCAL) / zs[k]);
        ctx.stroke();
      }
    }
  }

  for (const it of items) {
    const [x, g] = project(it.X, it.z);
    const px = FOCAL / it.z; // pixels per world unit here
    if (it.kind === 'post') {
      ctx.fillStyle = '#6a5440';
      ctx.fillRect(x - px * 0.06, g - px * 1.3, Math.max(1, px * 0.12), px * 1.3);
    } else if (it.kind === 'pole') {
      ctx.fillStyle = '#5a4636';
      ctx.fillRect(x - px * 0.1, g - px * 7.5, Math.max(1, px * 0.2), px * 7.5);
      ctx.fillRect(x - px * 0.9, g - px * 7.3, px * 1.8, Math.max(1, px * 0.15));
    } else {
      drawBareTree(ctx, x, g, px / 22);
    }
  }
}

/** Back down the valley: a line of bare woods, mill stacks on the skyline. */
function drawFrontHorizon(ctx, t) {
  ctx.fillStyle = '#6f7664';
  ctx.beginPath();
  ctx.moveTo(0, FRONT_HORIZON + 1);
  for (let x = 0; x <= W; x += 24) ctx.lineTo(x, FRONT_HORIZON - 8 - fixed(x) * 10);
  ctx.lineTo(W, FRONT_HORIZON + 1);
  ctx.fill();
  ctx.fillStyle = '#5e5850';
  for (const [x, h] of [
    [120, 54],
    [148, 40],
    [1150, 48],
    [1176, 62],
  ]) {
    ctx.fillRect(x, FRONT_HORIZON - h, 9, h);
  }
  drawSmoke(ctx, 1180, FRONT_HORIZON - 64, t, 0.6);
  drawSmoke(ctx, 124, FRONT_HORIZON - 56, t + 1.3, 0.5);
}

function drawFrontRoad(ctx) {
  ctx.fillStyle = '#a99c80';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 4, FRONT_HORIZON);
  ctx.lineTo(W / 2 + 4, FRONT_HORIZON);
  ctx.lineTo(W / 2 + 900, H);
  ctx.lineTo(W / 2 - 900, H);
  ctx.closePath();
  ctx.fill();
}

/**
 * The cab through the windshield: the kid on the left (passenger), the
 * sheriff on the right at the wheel. cue.speaking moves mouths and eyes;
 * cue.beat is 'offer' while the sheriff holds out the money, 'taken' once
 * the kid has it. look: { kid, sheriff } fixes where their eyes go while
 * nobody's talking (px, negative = toward the left of the screen).
 */
export function drawWindshieldShot(ctx, t, cue, look = {}) {
  drawSky(ctx, FRONT_HORIZON, [1110, 96]);
  drawFrontHorizon(ctx, t);
  drawGround(ctx, FRONT_HORIZON);
  drawFrontRoad(ctx);
  drawReceding(ctx, t);

  // Dust the car leaves hangs behind it, toward the horizon.
  for (let i = 0; i < 14; i++) {
    const age = wrap(t * 0.5 + i / 14, 1);
    const [x, y] = project((fixed(i) - 0.5) * 6, 3 + age * 26);
    ctx.fillStyle = `rgba(${DUST}, ${0.2 * (1 - age)})`;
    ctx.beginPath();
    ctx.arc(x, y - 20 * (1 - age), 70 * (1 - age) + 16, 0, Math.PI * 2);
    ctx.fill();
  }

  const bob = Math.sin(t * 7) * 1.6 + Math.sin(t * 2.3) * 1;
  ctx.save();
  ctx.translate(0, bob);
  drawCarFront(ctx, t, cue, look);
  ctx.restore();

  drawHaze(ctx, 0.1);
  drawVignette(ctx);
}

function drawCarFront(ctx, t, cue, look) {
  // Shadow, wheels.
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(640, 588, 400, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.beginPath();
  ctx.roundRect(350, 480, 84, 108, 14);
  ctx.roundRect(846, 480, 84, 108, 14);
  ctx.fill();

  // Roof, sun visor, windshield frame.
  ctx.fillStyle = CAR.body;
  ctx.beginPath();
  ctx.moveTo(352, 206);
  ctx.quadraticCurveTo(640, 150, 928, 206);
  ctx.lineTo(928, 214);
  ctx.lineTo(352, 214);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(366, 200, 548, 190, 10);
  ctx.fill();

  // The cab inside the glass.
  const panes = [
    [386, 214, 246, 162],
    [648, 214, 246, 162],
  ];
  ctx.save();
  ctx.beginPath();
  for (const [x, y, w, h] of panes) ctx.roundRect(x, y, w, h, 6);
  ctx.clip();
  ctx.fillStyle = '#3a2f27';
  ctx.fillRect(380, 210, 520, 170);
  // Through the back window, the dusty sky they've come from.
  ctx.fillStyle = 'rgba(200, 170, 120, 0.75)';
  ctx.beginPath();
  ctx.roundRect(440, 232, 400, 62, 14);
  ctx.fill();
  ctx.fillStyle = '#4a3a2e';
  ctx.fillRect(380, 300, 520, 90); // seat back

  drawKidFront(ctx, t, cue, look.kid);
  drawSheriffFront(ctx, t, cue, look.sheriff);

  // Glass: a little tint and a couple of glints.
  ctx.fillStyle = 'rgba(220, 196, 150, 0.1)';
  ctx.fillRect(380, 210, 520, 170);
  ctx.fillStyle = 'rgba(255, 250, 235, 0.09)';
  for (const [x0, w] of [
    [400, 40],
    [470, 14],
    [700, 50],
    [790, 16],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, 380);
    ctx.lineTo(x0 + w, 380);
    ctx.lineTo(x0 + w + 110, 210);
    ctx.lineTo(x0 + 110, 210);
    ctx.fill();
  }
  ctx.restore();

  // Centre post between the panes, in front of everything inside.
  ctx.fillStyle = CAR.body;
  ctx.fillRect(632, 206, 16, 180);

  // Spotlight on the driver's post.
  ctx.fillStyle = CAR.chrome;
  ctx.beginPath();
  ctx.roundRect(904, 244, 34, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#c0453a';
  ctx.beginPath();
  ctx.ellipse(938, 255, 7, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cowl and hood.
  ctx.fillStyle = CAR.body;
  ctx.beginPath();
  ctx.moveTo(372, 386);
  ctx.lineTo(908, 386);
  ctx.lineTo(820, 430);
  ctx.lineTo(460, 430);
  ctx.closePath();
  ctx.fill();

  // The dark apron under the hood, between the fenders and behind the
  // grille and lamps, so the road doesn't show through.
  ctx.fillStyle = '#16181a';
  ctx.beginPath();
  ctx.moveTo(460, 428);
  ctx.lineTo(820, 428);
  ctx.lineTo(850, 544);
  ctx.lineTo(430, 544);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a2c2e'; // front axle
  ctx.fillRect(440, 518, 400, 8);

  // Fenders.
  for (const cx of [392, 888]) {
    ctx.fillStyle = CAR.body;
    ctx.beginPath();
    ctx.ellipse(cx, 500, 104, 76, 0, Math.PI, 0);
    ctx.lineTo(cx + 104, 540);
    ctx.lineTo(cx - 104, 540);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CAR.light;
    ctx.beginPath();
    ctx.ellipse(cx, 500, 100, 72, 0, Math.PI * 1.15, Math.PI * 1.55);
    ctx.lineTo(cx, 500);
    ctx.closePath();
    ctx.fill();
  }

  // Radiator grille.
  ctx.fillStyle = CAR.chrome;
  ctx.beginPath();
  ctx.roundRect(560, 404, 160, 142, [30, 30, 10, 10]);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(574, 418, 132, 118, [22, 22, 6, 6]);
  ctx.fill();
  ctx.fillStyle = CAR.chromeDark;
  for (let x = 580; x < 702; x += 9) ctx.fillRect(x, 420, 3, 114);
  ctx.fillStyle = CAR.chrome;
  ctx.beginPath();
  ctx.arc(640, 400, 9, 0, Math.PI * 2);
  ctx.fill();

  // Headlights on their stalks.
  for (const cx of [470, 810]) {
    ctx.fillStyle = CAR.chromeDark;
    ctx.fillRect(cx - 4, 470, 8, 30);
    ctx.fillStyle = CAR.chrome;
    ctx.beginPath();
    ctx.arc(cx, 446, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#efe2b4';
    ctx.beginPath();
    ctx.arc(cx, 446, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - 10, 434, 9, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bumper.
  ctx.fillStyle = CAR.chrome;
  ctx.beginPath();
  ctx.roundRect(316, 540, 648, 20, 9);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(330, 543, 620, 4);
}

function drawEyes(ctx, xs, y, t, offset, look, lookDown) {
  ctx.fillStyle = '#1e1612';
  for (const x of xs) {
    if (blink(t, offset)) ctx.fillRect(x - 4, y, 8, 2);
    else {
      ctx.beginPath();
      ctx.arc(x + look, y + (lookDown ? 1.5 : 0), 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMouth(ctx, x, y, w, t, talking) {
  ctx.fillStyle = '#5a2e26';
  if (talking) {
    const open = 2 + Math.abs(Math.sin(t * 15)) * 5;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, open / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - w / 2, y - 1, w, 2.2);
  }
}

function drawFiveDollars(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#86a072';
  ctx.fillRect(-26, -12, 52, 24);
  ctx.strokeStyle = '#4e6a44';
  ctx.lineWidth = 2;
  ctx.strokeRect(-23, -9, 46, 18);
  ctx.fillStyle = '#4e6a44';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('5', 0, 1);
  ctx.restore();
}

/** The teenager in the passenger seat. Nothing here says boy or girl. */
function drawKidFront(ctx, t, cue, fixedLook) {
  const cx = 508;
  const talking = cue.speaking === 'kid';
  const listening = cue.speaking === 'sheriff';

  // Oversized coat, collar turned up.
  ctx.fillStyle = KID.coat;
  ctx.beginPath();
  ctx.moveTo(cx - 88, 400);
  ctx.quadraticCurveTo(cx - 84, 326, cx - 26, 316);
  ctx.lineTo(cx + 26, 316);
  ctx.quadraticCurveTo(cx + 84, 326, cx + 88, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = KID.coatDark;
  ctx.beginPath();
  ctx.moveTo(cx - 30, 314);
  ctx.lineTo(cx - 6, 350);
  ctx.lineTo(cx - 40, 336);
  ctx.closePath();
  ctx.moveTo(cx + 30, 314);
  ctx.lineTo(cx + 6, 350);
  ctx.lineTo(cx + 40, 336);
  ctx.closePath();
  ctx.fill();

  // Neck, head, short hair under the cap.
  ctx.fillStyle = KID.skin;
  ctx.fillRect(cx - 10, 298, 20, 22);
  ctx.fillStyle = KID.hair;
  ctx.beginPath();
  ctx.ellipse(cx, 276, 27, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KID.skin;
  ctx.beginPath();
  ctx.ellipse(cx, 282, 23, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 23, 283, 5, 0, Math.PI * 2);
  ctx.arc(cx + 23, 283, 5, 0, Math.PI * 2);
  ctx.fill();
  // A few tufts sticking out at the temples.
  ctx.fillStyle = KID.hair;
  ctx.beginPath();
  ctx.moveTo(cx - 24, 262);
  ctx.lineTo(cx - 28, 276);
  ctx.lineTo(cx - 19, 268);
  ctx.moveTo(cx + 24, 262);
  ctx.lineTo(cx + 28, 276);
  ctx.lineTo(cx + 19, 268);
  ctx.fill();

  // Face: eyes on the sheriff while he talks, down otherwise.
  // In conversation, eyes go to whoever's talking; otherwise where the shot says.
  const quiet = !talking && !listening;
  const look = listening ? 2 : quiet ? (fixedLook ?? 0) : 0;
  drawEyes(ctx, [cx - 10, cx + 10], 284, t, 1.7, look, quiet && fixedLook == null);
  ctx.strokeStyle = KID.hair;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 15, 276);
  ctx.lineTo(cx - 5, 275);
  ctx.moveTo(cx + 5, 275);
  ctx.lineTo(cx + 15, 276);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120, 70, 50, 0.35)';
  ctx.fillRect(cx - 1, 288, 3, 8);
  drawMouth(ctx, cx, 301, 10, t, talking);

  // Flat cap.
  ctx.fillStyle = KID.cap;
  ctx.beginPath();
  ctx.ellipse(cx, 256, 31, 14, 0, Math.PI, 0);
  ctx.lineTo(cx + 31, 262);
  ctx.lineTo(cx - 31, 262);
  ctx.fill();
  ctx.fillStyle = KID.capDark;
  ctx.beginPath();
  ctx.ellipse(cx, 263, 27, 6, 0, 0, Math.PI);
  ctx.fill();

  if (cue.beat === 'taken') {
    // Holding the five dollars, not quite believing it.
    drawFiveDollars(ctx, cx + 22, 360, -0.25);
    ctx.fillStyle = KID.skin;
    ctx.beginPath();
    ctx.ellipse(cx + 8, 366, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The sheriff, driving. */
function drawSheriffFront(ctx, t, cue, fixedLook) {
  const cx = 772;
  const talking = cue.speaking === 'sheriff';
  const listening = cue.speaking === 'kid';

  // Shoulders in a khaki shirt, a badge, a dark tie.
  ctx.fillStyle = SHERIFF.shirt;
  ctx.beginPath();
  ctx.moveTo(cx - 100, 400);
  ctx.quadraticCurveTo(cx - 96, 324, cx - 30, 316);
  ctx.lineTo(cx + 30, 316);
  ctx.quadraticCurveTo(cx + 96, 324, cx + 100, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SHERIFF.skin;
  ctx.beginPath();
  ctx.moveTo(cx - 14, 312);
  ctx.lineTo(cx + 14, 312);
  ctx.lineTo(cx, 332);
  ctx.fill();
  ctx.fillStyle = SHERIFF.band;
  ctx.fillRect(cx - 4, 326, 8, 50);
  drawStar(ctx, cx + 44, 346, 11, '#d8b04a');

  // Head.
  ctx.fillStyle = SHERIFF.skin;
  ctx.fillRect(cx - 12, 296, 24, 22);
  ctx.beginPath();
  ctx.ellipse(cx, 276, 28, 33, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 28, 278, 6, 0, Math.PI * 2);
  ctx.arc(cx + 28, 278, 6, 0, Math.PI * 2);
  ctx.fill();

  // Eyes on the road, a glance across when the kid talks.
  drawEyes(ctx, [cx - 11, cx + 11], 274, t, 0.3, listening ? -2 : talking ? 0 : (fixedLook ?? 0), false);
  ctx.strokeStyle = '#6a5a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 18, 266);
  ctx.lineTo(cx - 5, 267);
  ctx.moveTo(cx + 5, 267);
  ctx.lineTo(cx + 18, 266);
  ctx.stroke();
  ctx.fillStyle = 'rgba(130, 80, 56, 0.35)';
  ctx.fillRect(cx - 2, 278, 4, 10);
  // Moustache over the mouth.
  drawMouth(ctx, cx, 298, 12, t, talking);
  ctx.fillStyle = SHERIFF.tache;
  ctx.beginPath();
  ctx.ellipse(cx - 8, 291, 10, 4, 0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + 8, 291, 10, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Fedora.
  ctx.fillStyle = SHERIFF.hatDark;
  ctx.beginPath();
  ctx.ellipse(cx, 250, 52, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SHERIFF.hat;
  ctx.beginPath();
  ctx.ellipse(cx, 247, 52, 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 30, 247);
  ctx.lineTo(cx - 27, 218);
  ctx.quadraticCurveTo(cx - 14, 210, cx, 216);
  ctx.quadraticCurveTo(cx + 14, 210, cx + 27, 218);
  ctx.lineTo(cx + 30, 247);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SHERIFF.hatDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 218);
  ctx.lineTo(cx, 232);
  ctx.stroke();
  ctx.fillStyle = SHERIFF.band;
  ctx.fillRect(cx - 30, 236, 60, 8);

  // Hands on the wheel, or one held out with the money.
  ctx.strokeStyle = '#1a1410';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(cx + 6, 372, 70, 15, 0, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = SHERIFF.shirtDark;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 78, 336);
  ctx.lineTo(cx + 58, 362);
  ctx.stroke();
  ctx.fillStyle = SHERIFF.skin;
  ctx.beginPath();
  ctx.ellipse(cx + 56, 364, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (cue.beat === 'offer') {
    const reach = Math.min(1, cue.phaseT * 2.5);
    const hx = cx - 54 - reach * 120;
    const hy = 362 - reach * 18;
    ctx.strokeStyle = SHERIFF.shirtDark;
    ctx.beginPath();
    ctx.moveTo(cx - 78, 336);
    ctx.lineTo(hx + 10, hy);
    ctx.stroke();
    drawFiveDollars(ctx, hx - 14, hy - 6, 0.15);
    ctx.fillStyle = SHERIFF.skin;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = SHERIFF.shirtDark;
    ctx.beginPath();
    ctx.moveTo(cx - 78, 336);
    ctx.lineTo(cx - 50, 362);
    ctx.stroke();
    ctx.fillStyle = SHERIFF.skin;
    ctx.beginPath();
    ctx.ellipse(cx - 48, 364, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}

// ========================================================= shot 3: the house

const STOP_X = 930; // where the car pulls up

export function drawHouseShot(ctx, t, cue) {
  drawSky(ctx, RIVER_TOP, [1060, 150]);
  drawRiverValley(ctx, 300, t);
  drawGround(ctx, BANK);
  drawFields(ctx);
  drawMill(ctx, 1000, BANK + 30, t, false); // where Dad worked, shut
  drawBareTree(ctx, 560, YARD - 4, 2.2);
  drawHouse(ctx);
  drawMailbox(ctx, 630);
  drawRoad(ctx);

  // Car: rolls in and slows to a stop, waits, then pulls away to the west.
  let carX;
  let roll;
  let moving;
  if (cue.phase === 'lead') {
    const k = Math.min(1, t / 3);
    const ease = 1 - (1 - k) ** 3;
    carX = W + 220 - (W + 220 - STOP_X) * ease;
    roll = (W + 220 - carX) * 1;
    moving = k < 1;
  } else if (cue.phase === 'lines') {
    carX = STOP_X;
    roll = W + 220 - STOP_X;
    moving = false;
  } else {
    const away = 70 * cue.phaseT ** 2;
    carX = STOP_X - away;
    roll = W + 220 - STOP_X + away;
    moving = cue.phaseT > 0.2;
  }

  const out = cue.beat === 'out';
  if (out) drawKidSide(ctx, 720, YARD + 4, t);
  if (moving) drawDustTrail(ctx, carX + 90, SIDE_ROAD, t, cue.phase === 'lead' ? 1 - Math.min(1, t / 3) : Math.min(1, cue.phaseT / 2));
  drawCarSide(ctx, carX, SIDE_ROAD, t, { roll, bob: moving ? Math.sin(t * 9) * 1.2 : 0, kid: !out });

  drawHaze(ctx);
  drawVignette(ctx);
}

// ================================================== the opening montage
//
// Landscapes between the shots in the car, before anyone speaks. In each,
// the sheriff's car passes along the road in front.

/** The sheriff's car crossing the frame right to left along the road. */
function drawCarPassing(ctx, t, start = 0.8, speed = 330) {
  const x = W + 220 - Math.max(0, t - start) * speed;
  if (x < -260 || x > W + 260) return;
  const roll = Math.max(0, t - start) * speed;
  drawDustTrail(ctx, x + 90, SIDE_ROAD, t, 0.6);
  drawCarSide(ctx, x, SIDE_ROAD, t, { roll, bob: Math.sin(t * 9) * 1.2 });
}

function drawWindow(ctx, x, y, w, h, i) {
  const r = fixed(i);
  if (r > 0.84) {
    // Boarded over.
    ctx.fillStyle = '#3a2e26';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#7a6a56';
    ctx.fillRect(x - 2, y + h * 0.2, w + 4, 6);
    ctx.fillRect(x - 2, y + h * 0.65, w + 4, 6);
    return;
  }
  ctx.fillStyle = '#6a7074'; // glass, grey with the sky
  ctx.fillRect(x, y, w, h);
  if (r < 0.45) {
    // Broken: a dark hole with jagged edges.
    ctx.fillStyle = '#1e1a18';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.1);
    ctx.lineTo(x + w * 0.7, y + h * 0.3);
    ctx.lineTo(x + w * 0.5, y + h * 0.45);
    ctx.lineTo(x + w * 0.9, y + h * 0.9);
    ctx.lineTo(x + w * 0.1, y + h * 0.8);
    ctx.lineTo(x + w * 0.3, y + h * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#3a302a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

function drawSignBoard(ctx, x, y, w, h, lines, { bg = '#e6dcc4', ink = '#2a2420' } = {}) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach(([text, size, color], k) => {
    ctx.fillStyle = color ?? ink;
    ctx.font = `bold ${size}px Georgia, serif`;
    ctx.fillText(text, x + w / 2, y + h * ((k + 1) / (lines.length + 1)));
  });
}

// ------------------------------------------------------------ a shut mill

/** The mill up close: cold stacks, broken windows, a chained gate. */
export function drawMillShot(ctx, t) {
  const pan = t * 10;
  const base = 598;
  drawSky(ctx, RIVER_TOP, [260, 130]);
  drawRiverValley(ctx, 600 + pan * 0.4, t);
  drawGround(ctx, BANK);

  ctx.save();
  ctx.translate(140 - pan, 0);
  const x = 0;
  // Stacks, cold.
  ctx.fillStyle = '#6a4a3e';
  ctx.fillRect(x + 90, base - 420, 34, 420);
  ctx.fillRect(x + 560, base - 370, 28, 370);
  ctx.fillStyle = '#4e382f';
  ctx.fillRect(x + 86, base - 420, 42, 12);
  ctx.fillRect(x + 556, base - 370, 36, 12);
  // The building.
  ctx.fillStyle = '#7a5446';
  ctx.fillRect(x, base - 290, 680, 290);
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    ctx.moveTo(x + k * 85, base - 290);
    ctx.lineTo(x + k * 85 + 60, base - 324);
    ctx.lineTo(x + k * 85 + 85, base - 290);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(232, 222, 200, 0.55)';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RIVERSIDE  MILL', x + 340, base - 262);
  let i = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      drawWindow(ctx, x + 30 + col * 72, base - 236 + row * 62, 42, 42, i++ + 20);
    }
  }
  // Loading door, boarded.
  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(x + 440, base - 110, 90, 110);
  ctx.fillStyle = '#7a6a56';
  for (const y of [-90, -55, -20]) ctx.fillRect(x + 434, base + y, 102, 9);

  // Chain-link fence, the gate chained, a sign hung on it.
  const fx0 = x - 160;
  const fx1 = x + 860;
  ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let fx = fx0; fx < fx1; fx += 12) {
    ctx.moveTo(fx, base - 76);
    ctx.lineTo(fx + 60, base);
    ctx.moveTo(fx + 60, base - 76);
    ctx.lineTo(fx, base);
  }
  ctx.stroke();
  ctx.fillStyle = '#5a5654';
  ctx.fillRect(fx0, base - 78, fx1 - fx0, 4);
  for (let fx = fx0; fx <= fx1; fx += 90) ctx.fillRect(fx, base - 80, 5, 80);
  const gx = x + 250;
  ctx.fillStyle = '#4a4644';
  ctx.fillRect(gx, base - 100, 9, 100);
  ctx.fillRect(gx + 151, base - 100, 9, 100);
  ctx.strokeStyle = '#5a5654';
  ctx.lineWidth = 3;
  for (let gxx = gx + 20; gxx < gx + 150; gxx += 16) {
    ctx.beginPath();
    ctx.moveTo(gxx, base - 92);
    ctx.lineTo(gxx, base - 4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a8680';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(gx + 62, base - 58);
  ctx.quadraticCurveTo(gx + 80, base - 44, gx + 98, base - 58);
  ctx.stroke();
  ctx.fillStyle = '#6a6660';
  ctx.fillRect(gx + 74, base - 52, 12, 14);
  drawSignBoard(ctx, gx + 30, base - 96, 100, 38, [['CLOSED', 19, '#8a2a20']]);

  // Men waiting at the gate on the chance of a day's work.
  for (const [k, mx, facing] of [
    [0, gx - 90, 1],
    [1, gx - 40, 1],
    [2, gx + 200, -1],
    [3, gx + 250, -1],
    [4, gx + 330, -1],
  ]) {
    drawFigure(ctx, mx, base + 4, PEOPLE[k], t, { facing, phase: k });
  }
  ctx.restore();

  drawRoad(ctx);
  drawCarPassing(ctx, t);
  drawHaze(ctx, 0.12);
  drawVignette(ctx);
}

// -------------------------------------------------- an abandoned farmstead

/** A farm given up on: the barn caved in, the house open to the weather. */
export function drawFarmsteadShot(ctx, t) {
  const pan = t * 8;
  const base = 596;
  drawSky(ctx, RIVER_TOP, [1000, 120]);
  drawRiverValley(ctx, 1400 + pan * 0.4, t);
  drawGround(ctx, BANK);
  drawFields(ctx);

  // Crows going over.
  ctx.strokeStyle = '#2a2624';
  ctx.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    const cx = 200 + k * 46 + t * 60;
    const cy = 150 + fixed(k) * 50 + Math.sin(t * 3 + k) * 4;
    const flap = Math.sin(t * 9 + k * 1.7) * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - flap);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 8, cy - flap);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(-pan, 0);
  // The barn, its roof fallen in on one side.
  const bx = 110;
  ctx.fillStyle = '#6e3c30';
  ctx.fillRect(bx, base - 170, 330, 170);
  ctx.fillStyle = '#4e3a32';
  ctx.beginPath();
  ctx.moveTo(bx - 14, base - 170);
  ctx.lineTo(bx + 120, base - 262);
  ctx.lineTo(bx + 175, base - 236); // the ridge broken here
  ctx.lineTo(bx + 205, base - 190);
  ctx.lineTo(bx + 250, base - 220);
  ctx.lineTo(bx + 344, base - 170);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2a24';
  ctx.lineWidth = 4;
  ctx.beginPath(); // bare rafters across the hole
  ctx.moveTo(bx + 175, base - 236);
  ctx.lineTo(bx + 250, base - 220);
  ctx.moveTo(bx + 190, base - 228);
  ctx.lineTo(bx + 200, base - 196);
  ctx.stroke();
  ctx.fillStyle = '#241a16';
  ctx.fillRect(bx + 120, base - 120, 90, 120); // doorway
  ctx.save();
  ctx.translate(bx + 210, base);
  ctx.rotate(0.22); // one door hanging off its track
  ctx.fillStyle = '#7a4636';
  ctx.fillRect(0, -118, 46, 118);
  ctx.restore();
  ctx.fillStyle = '#7a4636';
  ctx.fillRect(bx + 74, base - 118, 46, 118);
  ctx.strokeStyle = 'rgba(40, 24, 20, 0.5)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 12; k++) {
    ctx.beginPath();
    ctx.moveTo(bx + 10 + k * 27, base - 166);
    ctx.lineTo(bx + 10 + k * 27, base - 124);
    ctx.stroke();
  }

  // A tractor left to rust.
  const tx = bx + 420;
  ctx.fillStyle = '#7a4a2e';
  ctx.fillRect(tx, base - 46, 70, 22);
  ctx.fillRect(tx + 50, base - 70, 6, 26);
  ctx.fillStyle = '#3a2a22';
  ctx.beginPath();
  ctx.arc(tx + 10, base - 22, 22, 0, Math.PI * 2);
  ctx.arc(tx + 72, base - 14, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6a3e26';
  ctx.beginPath();
  ctx.arc(tx + 10, base - 22, 9, 0, Math.PI * 2);
  ctx.fill();

  // The house: windows out, porch roof come down, door open.
  const hx = 680;
  ctx.fillStyle = '#9a948a';
  ctx.fillRect(hx, base - 180, 260, 180);
  ctx.fillStyle = '#5a504a';
  ctx.beginPath();
  ctx.moveTo(hx - 16, base - 180);
  ctx.lineTo(hx + 130, base - 270);
  ctx.lineTo(hx + 276, base - 180);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SKY_LOW;
  ctx.fillRect(hx + 150, base - 246, 22, 9);
  ctx.fillRect(hx + 90, base - 222, 16, 8);
  drawWindow(ctx, hx + 26, base - 150, 50, 56, 3);
  drawWindow(ctx, hx + 184, base - 150, 50, 56, 1);
  drawWindow(ctx, hx + 110, base - 236 + 40, 40, 34, 9);
  ctx.fillStyle = '#1e1a18';
  ctx.fillRect(hx + 104, base - 104, 50, 104);
  ctx.fillStyle = '#6a5e52';
  ctx.save();
  ctx.translate(hx + 154, base - 104);
  ctx.rotate(0.5);
  ctx.fillRect(0, 0, 8, 100);
  ctx.restore();
  ctx.fillStyle = '#5a4e44';
  ctx.beginPath(); // porch roof: one end still up, the other on the ground
  ctx.moveTo(hx - 20, base - 120);
  ctx.lineTo(hx + 280, base - 8);
  ctx.lineTo(hx + 280, base);
  ctx.lineTo(hx - 20, base - 110);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(hx - 18, base - 120, 7, 120);

  // Weeds up to the windowsills.
  ctx.strokeStyle = '#7a7a50';
  ctx.lineWidth = 2;
  for (let k = 0; k < 120; k++) {
    const wx = 60 + k * 9.5;
    const h = 16 + fixed(k + 70) * 26;
    ctx.beginPath();
    ctx.moveTo(wx, base + 2);
    ctx.quadraticCurveTo(wx + 4, base - h * 0.6, wx + 6 + Math.sin(t * 2 + k) * 2, base - h);
    ctx.stroke();
  }

  // The notice by the road.
  ctx.fillStyle = '#5a4636';
  ctx.fillRect(1052, base - 70, 7, 70);
  ctx.fillRect(1152, base - 70, 7, 70);
  drawSignBoard(ctx, 1030, base - 150, 150, 84, [
    ['SHERIFF’S', 17, '#8a2a20'],
    ['SALE', 24, '#8a2a20'],
    ['by order of the court', 11],
  ]);
  ctx.restore();

  drawRoad(ctx);
  drawCarPassing(ctx, t);
  drawHaze(ctx, 0.12);
  drawVignette(ctx);
}

// ------------------------------------------------------------- a breadline

/** A river town's main street: the bank shut, a line out of the soup kitchen. */
export function drawBreadlineShot(ctx, t) {
  const base = 584; // where the storefronts meet the sidewalk
  drawSky(ctx, RIVER_TOP, [180, 110]);
  ctx.fillStyle = '#7b7e74';
  ctx.fillRect(0, 300, W, 140);
  for (const [x, w, h] of [
    [0, 140, 210],
    [180, 90, 250],
    [420, 160, 200],
    [700, 70, 270],
    [880, 160, 230],
    [1100, 180, 200],
  ]) {
    ctx.fillStyle = '#868a80';
    ctx.fillRect(x, base - h - 60, w, h);
  }
  drawGround(ctx, base);

  // Storefronts, left to right.
  const fronts = [
    { x: 0, w: 290, h: 250, wall: '#7a4a3a' },
    { x: 296, w: 330, h: 230, wall: '#8e877a' },
    { x: 632, w: 330, h: 270, wall: '#a8a090' },
    { x: 968, w: 320, h: 240, wall: '#6e5444' },
  ];
  for (const f of fronts) {
    ctx.fillStyle = f.wall;
    ctx.fillRect(f.x, base - f.h, f.w, f.h);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(f.x - 4, base - f.h - 8, f.w + 8, 12);
  }
  // An empty shop.
  let i = 40;
  for (const wx of [30, 110, 190]) drawWindow(ctx, wx, base - 220, 50, 60, i++);
  ctx.fillStyle = '#5a5e60';
  ctx.fillRect(24, base - 120, 220, 84);
  drawSignBoard(ctx, 90, base - 98, 96, 40, [['FOR RENT', 15]]);
  ctx.fillStyle = '#3a2a22';
  ctx.fillRect(250, base - 100, 34, 100);

  // The soup kitchen, its door open and lit.
  for (const wx of [326, 420, 514]) drawWindow(ctx, wx, base - 210, 54, 60, i++);
  drawSignBoard(ctx, 374, base - 142, 180, 42, [['FREE SOUP', 22, '#2a2420']], { bg: '#d8ccb0' });
  const warm = ctx.createLinearGradient(0, base - 92, 0, base);
  warm.addColorStop(0, '#e8b868');
  warm.addColorStop(1, '#b07a40');
  ctx.fillStyle = warm;
  ctx.fillRect(440, base - 92, 48, 92);

  // The bank, closed for good.
  ctx.fillStyle = '#bcb4a4';
  for (const cx of [660, 740, 852, 932]) ctx.fillRect(cx, base - 200, 22, 200);
  ctx.fillStyle = '#8a8274';
  ctx.beginPath();
  ctx.moveTo(640, base - 210);
  ctx.lineTo(797, base - 262);
  ctx.lineTo(954, base - 210);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a564e';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FARMERS’ & MERCHANTS’ BANK', 797, base - 222);
  ctx.fillStyle = '#2a2622';
  ctx.fillRect(772, base - 120, 50, 120);
  drawSignBoard(ctx, 758, base - 168, 78, 34, [['CLOSED', 13, '#8a2a20']]);

  // A shop with whitewashed windows.
  for (const wx of [1000, 1090, 1180]) drawWindow(ctx, wx, base - 210, 54, 60, i++);
  ctx.fillStyle = '#d8d4c8';
  ctx.fillRect(990, base - 120, 260, 84);
  ctx.fillStyle = 'rgba(120, 116, 108, 0.6)';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('EMPTY', 1120, base - 76);

  // Sidewalk, and the line from the soup kitchen door down the street.
  ctx.fillStyle = '#8a857a';
  ctx.fillRect(0, base, W, 18);
  for (let k = 0; k < 13; k++) {
    drawFigure(ctx, 520 + k * 56, base + 14, PEOPLE[k % PEOPLE.length], t, { facing: -1, phase: k * 0.9, scale: 0.96 });
  }

  drawRoad(ctx);
  drawCarPassing(ctx, t, 1.2);
  drawHaze(ctx, 0.1);
  drawVignette(ctx);
}

// ---------------------------------------------------- a freight going west

/** A freight along the river, riders on the roofs and in the open doors. */
export function drawFreightShot(ctx, t) {
  const rail = 548;
  drawSky(ctx, RIVER_TOP, [900, 130]);
  drawRiverValley(ctx, 2200, t);
  drawGround(ctx, BANK);
  // The embankment and track.
  ctx.fillStyle = '#6a6250';
  ctx.beginPath();
  ctx.moveTo(0, rail + 30);
  ctx.lineTo(0, rail - 4);
  ctx.lineTo(W, rail - 4);
  ctx.lineTo(W, rail + 30);
  ctx.fill();
  ctx.fillStyle = '#4a4440';
  ctx.fillRect(0, rail - 6, W, 4);
  ctx.fillStyle = '#3a3430';
  for (let x = 0; x < W; x += 24) ctx.fillRect(x, rail - 3, 14, 4);

  // The train, heading right, engine first.
  const head = 300 + t * 170;
  const cars = 'ETBBGBBRBBTB';
  for (let k = 0; k < cars.length; k++) {
    const c = cars[k];
    const x1 = head - k * 182;
    const x0 = x1 - 172;
    if (x1 < -40 || x0 > W + 40) continue;
    const top = rail - 84;
    // Wheels.
    ctx.fillStyle = '#1e1a18';
    for (const wx of [x0 + 24, x0 + 52, x1 - 52, x1 - 24]) {
      ctx.beginPath();
      ctx.arc(wx, rail - 12, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (c === 'E') {
      ctx.fillStyle = '#26221f';
      ctx.fillRect(x0, top + 18, 150, 54);
      ctx.fillRect(x0, top - 6, 52, 30);
      ctx.fillRect(x1 - 52, top - 4, 16, 24);
      ctx.beginPath();
      ctx.roundRect(x0 + 50, top + 4, 110, 30, 14);
      ctx.fill();
      drawSmoke(ctx, x1 - 44, top - 6, t, 1.6);
      continue;
    }
    if (c === 'T') {
      ctx.fillStyle = '#3a3a38';
      ctx.beginPath();
      ctx.roundRect(x0, top + 20, 172, 48, 22);
      ctx.fill();
      ctx.fillRect(x0 + 80, top + 10, 14, 12);
      continue;
    }
    if (c === 'G') {
      ctx.fillStyle = '#4e4a44';
      ctx.fillRect(x0, top + 38, 172, 34);
      continue;
    }
    ctx.fillStyle = c === 'R' ? '#b8ae90' : '#6a3a2e';
    ctx.fillRect(x0, top, 172, 72);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let rx = x0 + 10; rx < x1; rx += 18) ctx.fillRect(rx, top + 4, 2, 64);
    ctx.fillStyle = 'rgba(232, 222, 200, 0.6)';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('N.Y.C.', x0 + 8, top + 16);
    // Door: open on some, a rider sitting in it, legs over the side.
    const open = k === 3 || k === 7;
    ctx.fillStyle = open ? '#1a1412' : 'rgba(0,0,0,0.25)';
    ctx.fillRect(x0 + 66, top + 10, 44, 60);
    if (open) drawFigure(ctx, x0 + 80, top + 68, PEOPLE[k % PEOPLE.length], t, { facing: 1, sit: true, scale: 0.85, phase: k });
    // Riders up top.
    if (k === 2 || k === 5 || k === 9) drawFigure(ctx, x0 + 40 + (k % 2) * 60, top, PEOPLE[(k + 2) % PEOPLE.length], t, { facing: 1, sit: true, scale: 0.8, phase: k * 2 });
  }

  drawRoad(ctx);
  drawCarPassing(ctx, t, 1.0);
  drawHaze(ctx, 0.1);
  drawVignette(ctx);
}
