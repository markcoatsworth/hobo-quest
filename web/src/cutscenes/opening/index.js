// The opening, up the Hudson from New York City: a sheriff drives a teenager
// home from the county jail, let out early because their father has died.
// Mom and the kid's sister went west a year ago, and there's no way to
// reach them. The sheriff gives the kid five dollars and drops them at the
// empty house. The game picks up there: the family home, then the city.
//
// The teenager is deliberately neither boy nor girl: nobody says "he" or
// "she" about them, and they're called "kid". The pictures are in art.js.

import {
  drawBreadlineShot,
  drawFarmsteadShot,
  drawFreightShot,
  drawHouseShot,
  drawMillShot,
  drawRoadShot,
  drawWindshieldShot,
} from './art.js';

export default {
  id: 'opening',
  name: 'Opening',
  // video: 'cutscenes/opening/opening.mp4',

  music: 'no_depression_in_heaven',

  cast: {
    sheriff: 'Sheriff',
    kid: 'Kid',
  },

  shots: [
    // About 48 seconds of the valley before anyone speaks: the country going
    // by, cut with the two of them riding in silence.
    {
      // Out on the river road.
      duration: 7.5,
      caption: 'The Hudson Valley, April 1932',
      draw: drawRoadShot,
    },
    {
      // The mill, shut, men waiting at the gate anyway.
      duration: 7,
      draw: drawMillShot,
    },
    {
      // In the car: the kid watching it all go by out the side window.
      duration: 6,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3, sheriff: 0 }),
    },
    {
      // A farm the bank took.
      duration: 7,
      draw: drawFarmsteadShot,
    },
    {
      // A river town: the bank closed, a line at the soup kitchen.
      duration: 7,
      draw: drawBreadlineShot,
    },
    {
      // In the car: the sheriff glances over.
      duration: 6,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: 0, sheriff: t > 2.5 ? -3 : 0 }),
    },
    {
      // A freight along the river, riders on top.
      duration: 7.5,
      draw: drawFreightShot,
    },
    {
      // In the car, and the talking starts.
      lead: 1.5,
      tail: 1.5,
      draw: drawWindshieldShot,
      lines: [
        { who: 'sheriff', text: 'Judge says you can go. Three weeks early.' },
        { who: 'kid', text: 'Because of Dad.' },
        { who: 'sheriff', text: 'Because of your dad. I’m sorry, kid. Doc says his heart just quit on him.' },
        { who: 'sheriff', text: 'You got any other family around here?' },
        { who: 'kid', text: 'Not anymore. Mom and my sister left last year.' },
        { who: 'kid', text: 'After the mill let Dad go, he took to drinking. Mom couldn’t take it.' },
        { who: 'sheriff', text: 'Where’d they go?' },
        { who: 'kid', text: 'West. California, maybe. Mom said she’d write once they got settled.' },
        { who: 'kid', text: 'If she ever did, Dad never showed me.' },
        { who: 'sheriff', text: 'So you’ve got no way to reach them.' },
        { who: 'kid', text: 'No, sir.' },
        { who: 'sheriff', text: 'Here. Five dollars.', beat: 'offer' },
        { who: 'kid', text: 'I can’t take that.' },
        { who: 'sheriff', text: 'It ain’t charity. Call it what the county owes you for three weeks of bad coffee.', beat: 'taken' },
        { who: 'sheriff', text: 'Get yourself fed. Get back on your feet.' },
      ],
    },
    {
      // At the house.
      lead: 3.2,
      tail: 5,
      dialog: 'top',
      draw: drawHouseShot,
      lines: [
        { who: 'sheriff', text: 'This is you.' },
        { who: 'kid', text: 'Thanks, Sheriff.', beat: 'out' },
        { who: 'sheriff', text: 'And stay off those freight trains, kid. The railroad bulls won’t go as easy on you as I do.' },
      ],
    },
  ],
};
