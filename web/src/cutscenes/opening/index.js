// The opening: how the journey begins. Placeholder until the story is written.

import { W, H } from '../../core/screen.js';

export default {
  id: 'opening',
  name: 'Opening',
  // video: 'cutscenes/opening/opening.mp4',

  shots: [
    { duration: 3, caption: 'New York City. April, 1932.' },
    {
      duration: 5,
      caption: 'Placeholder: the opening sequence goes here.',
      draw(ctx, t) {
        // Dusk sky and a freight crossing the frame.
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2a2440');
        g.addColorStop(1, '#c8784a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#1a1214';
        ctx.fillRect(0, 520, W, H - 520);
        const x = -900 + t * 260;
        for (let i = 0; i < 8; i++) ctx.fillRect(x + i * 110, 450, 100, 70);
      },
    },
  ],
};
