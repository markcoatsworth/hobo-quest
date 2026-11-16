// Outside the family home: a thin farm up the Hudson from the city.
//
// The opening cutscene ends on this very picture: the house, the bare tree,
// the mailbox, the river and the shut mill across the field, and you
// standing where the sheriff left you. So this area draws itself with the
// cutscene's own art (src/art/hudson.js) instead of the generic town look,
// and with the camera at 0 it is exactly that last frame. Walk right for the
// barn, the neighbours, and the road to the city.

import {
  BANK,
  HOUSE_DOOR,
  HOUSE_SCALE,
  RIVER_TOP,
  YARD,
  drawBareTree,
  drawFigure,
  drawFields,
  drawGround,
  drawHaze,
  drawHouse,
  drawKidSide,
  drawMailbox,
  drawMill,
  drawRiverValley,
  drawRoad,
  drawSky,
  drawSmoke,
  drawVignette,
} from '../../../art/hudson.js';

const DOOR = HOUSE_DOOR; // the middle of the house's front door
const ROAD_SIGN = 2480;

export default {
  name: 'The Family Home',
  mapLabel: 'Explore the Family Home',
  width: 2650,
  start: 720, // where the sheriff dropped you, by the mailbox
  facing: -1, // looking at the house
  camera: 0,
  feet: YARD + 4,
  figureHeight: 145,

  npcs: [
    {
      id: 'neighbour',
      name: 'Mrs. Vandermeer',
      x: 1950,
      look: { coat: '#5a4a5a', hat: 'cloche', hatColor: '#6a3a4a', skin: '#e6c0a0' },
      lines: [
        'Oh, child. I heard about your father. I’m so sorry.',
        'The man from the bank came Thursday and nailed that paper to your door. You can’t stay on here.',
        'If there’s work anywhere, it’s down in the city. Follow the river road south.',
      ],
    },
  ],

  // Things to look at. Their pictures are part of the backdrop below.
  props: [
    {
      x: DOOR + 60,
      name: 'the notice on the door',
      verb: 'Read the notice on the door',
      lines: [
        'NOTICE OF FORECLOSURE. By order of the court, this property is to be sold at public auction on the 18th of April, 1932.',
        'All occupants are to vacate the premises.',
      ],
    },
    { x: 630, name: 'the mailbox', lines: ['Empty. The little door hangs open on one hinge.'] },
    {
      x: 1430,
      name: 'Riverside Mill',
      lines: ['Across the field, the mill where Dad worked eleven years, until they let him go.', 'No smoke from the stacks. There hasn’t been since the winter.'],
    },
    {
      x: 1700,
      name: 'the barn',
      lines: ['Empty stalls. Dad sold the mule and the plough last fall to keep up with the mortgage.', 'It didn’t keep up.'],
    },
  ],

  exits: [
    { x: DOOR, to: 'family_home_house', at: 150, label: 'Go inside' },
    { x: ROAD_SIGN, to: 'town', at: 160, label: 'Take the road to the city' },
  ],

  draw: {
    backdrop(ctx, { camX, t }) {
      // Far off: fixed sky, the river and cliffs sliding slowly behind.
      drawSky(ctx, RIVER_TOP, [1060, 150]);
      drawRiverValley(ctx, 300 - camX * 0.3, t);
      drawGround(ctx, BANK);
      drawFields(ctx);
      // The mill across the field, in between.
      drawMill(ctx, 1000 - camX * 0.6, BANK + 30, t, false);

      ctx.save();
      ctx.translate(-camX, 0);
      drawBareTree(ctx, 560, YARD - 4, 2.2);
      drawHouse(ctx);
      drawMailbox(ctx, 630);
      drawBarn(ctx, 1500, YARD);
      drawNeighbours(ctx, 2010, YARD, t);
      ctx.restore();

      drawRoad(ctx);

      ctx.save();
      ctx.translate(-camX, 0);
      drawFingerpost(ctx, ROAD_SIGN, YARD + 2, 'NEW YORK CITY');
      ctx.restore();
    },

    person(ctx, { x, feet, look, facing, step, t, player }) {
      if (player) drawKidSide(ctx, x, feet, t, { facing, step });
      else drawFigure(ctx, x, feet, look, t, { facing });
    },

    over(ctx) {
      drawHaze(ctx);
      drawVignette(ctx);
    },
  },
};

/** The family's barn, still standing, doors shut on nothing. */
function drawBarn(ctx, x, base) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(HOUSE_SCALE, HOUSE_SCALE);
  drawBarnAt(ctx, 0, 0);
  ctx.restore();
}

function drawBarnAt(ctx, x, base) {
  ctx.fillStyle = '#6e3c30';
  ctx.fillRect(x, base - 190, 300, 190);
  ctx.fillStyle = '#4e3a32';
  ctx.beginPath();
  ctx.moveTo(x - 14, base - 190);
  ctx.lineTo(x + 70, base - 260);
  ctx.lineTo(x + 230, base - 260);
  ctx.lineTo(x + 314, base - 190);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 24, 20, 0.45)';
  ctx.lineWidth = 2;
  for (let k = 1; k < 15; k++) {
    ctx.beginPath();
    ctx.moveTo(x + k * 20, base - 186);
    ctx.lineTo(x + k * 20, base);
    ctx.stroke();
  }
  // Big doors with their cross-braces, and the hayloft door above.
  ctx.fillStyle = '#7a4636';
  ctx.fillRect(x + 90, base - 130, 120, 130);
  ctx.strokeStyle = '#d8ccb4';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 92, base - 128, 56, 126);
  ctx.strokeRect(x + 152, base - 128, 56, 126);
  ctx.beginPath();
  ctx.moveTo(x + 92, base - 128);
  ctx.lineTo(x + 148, base - 2);
  ctx.moveTo(x + 208, base - 128);
  ctx.lineTo(x + 152, base - 2);
  ctx.stroke();
  ctx.fillStyle = '#2a1a16';
  ctx.fillRect(x + 128, base - 178, 44, 36);
}

/** The Vandermeers' place: kept up, a curl of smoke from the chimney. */
function drawNeighbours(ctx, x, base, t) {
  // Built to the same scale as the family's house.
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(HOUSE_SCALE, HOUSE_SCALE);
  drawNeighboursAt(ctx, 0, 0, t);
  ctx.restore();
}

function drawNeighboursAt(ctx, x, base, t) {
  ctx.fillStyle = '#7a6656';
  ctx.fillRect(x + 190, base - 236, 22, 60);
  drawSmoke(ctx, x + 200, base - 238, t, 0.7);
  ctx.fillStyle = '#5e5048';
  ctx.beginPath();
  ctx.moveTo(x - 16, base - 160);
  ctx.lineTo(x + 130, base - 246);
  ctx.lineTo(x + 276, base - 160);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8d0bc';
  ctx.fillRect(x, base - 162, 260, 162);
  ctx.strokeStyle = 'rgba(80, 72, 60, 0.3)';
  ctx.lineWidth = 1.5;
  for (let y = base - 150; y < base; y += 12) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 260, y);
    ctx.stroke();
  }
  for (const wx of [x + 30, x + 180]) {
    ctx.fillStyle = '#e8c88a'; // a lamp lit inside
    ctx.fillRect(wx, base - 120, 50, 56);
    ctx.fillStyle = '#4a3e34';
    ctx.fillRect(wx + 23, base - 120, 4, 56);
    ctx.fillRect(wx, base - 94, 50, 4);
  }
  ctx.fillStyle = '#4a3e34';
  ctx.fillRect(x + 108, base - 104, 46, 104);
  ctx.fillStyle = '#5a4c40';
  ctx.fillRect(x - 10, base - 136, 280, 8);
  for (const px of [x - 6, x + 262]) ctx.fillRect(px, base - 136, 6, 136);
}

/** A fingerpost by the road. */
function drawFingerpost(ctx, x, base, text) {
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(x - 4, base - 130, 8, 130);
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  const w = ctx.measureText(text).width + 34;
  ctx.translate(x, base - 112);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.lineTo(w - 30, -16);
  ctx.lineTo(w - 12, 0);
  ctx.lineTo(w - 30, 16);
  ctx.lineTo(-14, 16);
  ctx.fill();
  ctx.fillStyle = '#2a1a12';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, -2, 1);
  ctx.restore();
}
