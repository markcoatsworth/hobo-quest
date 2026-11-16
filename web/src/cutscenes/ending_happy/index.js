// The happy ending: reaching Los Angeles in time. Placeholder until the
// story is written.

import { W, H } from '../../core/screen.js';

export default {
  id: 'ending_happy',
  name: 'Happy Ending',
  // video: 'cutscenes/ending_happy/ending_happy.mp4',

  shots: [
    {
      duration: 5,
      caption: 'Placeholder: the happy ending goes here.',
      draw(ctx, t) {
        // Sun coming up over the groves.
        const k = Math.min(1, t / 5);
        ctx.fillStyle = '#f0c890';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f8e070';
        ctx.beginPath();
        ctx.arc(W / 2, 520 - k * 120, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a6a3a';
        ctx.fillRect(0, 520, W, H - 520);
      },
    },
  ],
};
