// The sad ending: arriving too late. Placeholder until the story is written.

import { W, H } from '../../core/screen.js';

export default {
  id: 'ending_sad',
  name: 'Sad Ending',
  // video: 'cutscenes/ending_sad/ending_sad.mp4',

  shots: [
    {
      duration: 5,
      caption: 'Placeholder: the sad ending goes here.',
      draw(ctx, t) {
        // An empty camp in the rain.
        ctx.fillStyle = '#3a4048';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#22262c';
        ctx.fillRect(0, 520, W, H - 520);
        ctx.strokeStyle = 'rgba(200, 210, 230, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 120; i++) {
          const x = (i * 97 + t * 60) % W;
          const y = (i * 53 + t * 700) % H;
          ctx.moveTo(x, y);
          ctx.lineTo(x - 6, y + 18);
        }
        ctx.stroke();
      },
    },
  ],
};
