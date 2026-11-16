// The opening, up the Hudson from New York City: a sheriff drives a teenager
// home from the county jail, let out early because their father has died.
// Mom and the kid's sister went west a year ago, and there's no way to
// reach them. The sheriff gives the kid five dollars and drops them at the
// empty house. The game picks up there: the family home, then the city.
//
// The teenager is deliberately neither boy nor girl: nobody says "he" or
// "she" about them. The sheriff calls them "kid"; they tell him their name,
// Scout, partway through. The pictures are in art.js.

import {
  drawBreadlineShot,
  drawDocksShot,
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

  // Talk and country alternate: a few lines in the car, then the valley
  // going by, each stretch of road answering what was just said.
  shots: [
    {
      // Out on the river road.
      duration: 7.5,
      caption: 'The Hudson Valley, April 1932',
      draw: drawRoadShot,
    },
    {
      // In the car, silent: the kid watching the country out the side window.
      duration: 6,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3, sheriff: 0 }),
    },
    {
      // The mill, shut, men waiting at the gate anyway.
      duration: 7,
      draw: drawMillShot,
    },
    {
      // In the car: the first thing said.
      lead: 2,
      tail: 2,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3 }),
      lines: [{ who: 'sheriff', text: 'Judge signed your release this morning, kid. Three weeks early.' }],
    },
    {
      // A farm the bank took.
      duration: 7,
      draw: drawFarmsteadShot,
    },
    {
      // In the car: why they let the kid out.
      lead: 1.5,
      tail: 1.5,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: 0, sheriff: -3 }),
      lines: [
        { who: 'kid', text: 'Nobody gets out of county early. Is it because of Dad?' },
        { who: 'sheriff', text: 'It is. I’m sorry, kid. They found him Tuesday. Doc says his heart just quit on him.' },
      ],
    },
    {
      // A river town: the bank closed, a line at the soup kitchen.
      duration: 7,
      draw: drawBreadlineShot,
    },
    {
      // In the car: a name. From "Scout." on, the kid's lines are captioned
      // Scout (the player's name for the rest of the game:
      // src/characters/scout/).
      lead: 1.5,
      tail: 1.5,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3 }),
      lines: [
        { who: 'sheriff', text: 'What’s your name, kid?' },
        { who: 'kid', text: 'Scout.', cast: { kid: 'Scout' } },
      ],
    },
    {
      // A dockyard gone idle: a freighter laid up, the warehouse shut.
      duration: 7,
      draw: drawDocksShot,
    },
    {
      // In the car: who's left at home.
      lead: 1.5,
      tail: 1.5,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3 }),
      lines: [
        { who: 'sheriff', text: 'With your father gone, you got any other family around here? Anybody to take you in?' },
        { who: 'kid', text: 'Not anymore. Mom and my sister left last year.' },
        { who: 'kid', text: 'After the mill let Dad go, he took to drinking. Mom couldn’t take it.' },
      ],
    },
    {
      // Further down the river road.
      duration: 7,
      draw: (ctx, t) => drawRoadShot(ctx, t + 40),
    },
    {
      // In the car: where they went.
      lead: 1.5,
      tail: 1.5,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { kid: -3, sheriff: -3 }),
      lines: [
        { who: 'sheriff', text: 'Your mother and sister. You know where they went?' },
        { who: 'kid', text: 'West. California, maybe. Mom said she’d write once they got settled.' },
        { who: 'kid', text: 'If she ever did, Dad never showed me.' },
        { who: 'sheriff', text: 'So you’ve got no way to reach them.' },
        { who: 'kid', text: 'No, sir.' },
      ],
    },
    {
      // A freight along the river, riders on top, going west.
      duration: 7.5,
      draw: drawFreightShot,
    },
    {
      // In the car, nearly there: the five dollars.
      lead: 2,
      tail: 1.5,
      draw: (ctx, t, cue) => drawWindshieldShot(ctx, t, cue, { sheriff: -3 }),
      lines: [
        { who: 'sheriff', text: 'Listen. Here. Five dollars.', beat: 'offer' },
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
      // No fade: the game picks up on this very picture (the family home).
      fadeOut: false,
      draw: drawHouseShot,
      lines: [
        { who: 'sheriff', text: 'This is you.' },
        { who: 'kid', text: 'Thanks, Sheriff.', beat: 'out' },
        { who: 'sheriff', text: 'And stay off those freight trains, kid. The railroad bulls won’t go as easy on you as I do.' },
      ],
    },
  ],
};
