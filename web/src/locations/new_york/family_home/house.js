// Inside the family home. Everything still where it was left: Dad's coat,
// the bottles, the calendar stopped the month Mom and your sister went west.
// You're drawn here as in the farmyard and the opening cutscene
// (src/art/hudson.js), not with the smaller town figure, and bigger than
// outdoors because the room is seen from closer: the door clears your cap,
// and Dad's coat hangs beside you.

import { drawKidSide } from '../../../art/hudson.js';

const INDOOR_SCALE = 1.3; // 186 px tall, against the 196 px door

export default {
  name: 'The House',
  width: 1640,
  start: 150,
  figureHeight: 205,
  interior: {
    wall: '#a89a7c',
    wainscot: '#7a5e46',
    floor: '#6a5240',
    windows: [440, 1240],
    stains: [300, 980],
  },
  props: [
    { kind: 'door', x: 150 },
    {
      kind: 'coat',
      x: 330,
      name: 'Dad’s coat',
      lines: ['Dad’s work coat, still on its hook. It smells of the mill.', 'Nothing in the pockets but a stub of pencil and a loose button.'],
    },
    {
      kind: 'table',
      x: 620,
      name: 'the kitchen table',
      lines: ['Four chairs. Three pushed in, one pulled out and turned to face the window.', 'One cup, a ring of dried coffee in the bottom.'],
    },
    {
      kind: 'sink',
      x: 880,
      name: 'the bottles',
      lines: ['Empty bottles under the sink and across the floor. More than you can count.'],
    },
    {
      kind: 'stove',
      x: 1060,
      name: 'the stove',
      lines: ['The stove is cold. Not even kindling left in the box.'],
    },
    {
      kind: 'calendar',
      x: 1180,
      name: 'the calendar',
      lines: ['A feed-store calendar, still turned to March of last year.', 'The month Mom and your sister left. Nobody turned the page after that.'],
    },
    {
      kind: 'cupboard',
      id: 'cupboard',
      x: 1480,
      name: 'the cupboard',
      verb: 'Look in the cupboard',
      lines: ['Bare shelves, mouse droppings, a smell of damp.', 'Right at the back, missed somehow: a single can of beans. You take it.'],
      take: 'beans',
      emptyLines: ['Bare shelves. Nothing left, not even the beans.'],
    },
    {
      kind: 'photo',
      x: 1360,
      name: 'the photograph',
      lines: ['A photograph on the shelf: Mom, Dad, your sister and you on the front porch, all squinting into the sun.', 'Before the mill closed.'],
    },
  ],
  exits: [{ x: 150, to: 'family_home', at: 316, label: 'Go outside' }], // out the front door

  draw: {
    person(ctx, { x, feet, facing, step, t }) {
      drawKidSide(ctx, x, feet, t, { facing, step, scale: INDOOR_SCALE });
    },
  },
};
