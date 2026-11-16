// Cutscenes: short non-interactive sequences between the playable parts.
// Each is hand-built in its own folder:
//
//   src/cutscenes/<id>/index.js   the cutscene's definition (below)
//   public/cutscenes/<id>/        video, images, audio for it, when there are some
//
// <id> is in snake_case, the same for the folder and the `id` field.
// Cutscenes are played by CutsceneScene (src/scenes/cutscene.js).
//
// A cutscene module's default export:
//
// {
//   id, name,
//   video?,              path of a video under public/, e.g.
//                        'cutscenes/opening/opening.mp4'. When set, the video
//                        plays instead of the shots; if it fails to load, the
//                        shots play as a fallback.
//   shots: [...],        the sequence drawn in code, in order:
//                        { duration,          seconds on screen
//                          caption?,          text along the bottom
//                          draw?(ctx, t, k) } the picture: t = seconds into
//                                             the shot, k = 0..1 through it.
//                                             Without it the shot is black.
// }
//
// Each shot fades in and out. Confirm skips to the next shot, Back skips
// the whole cutscene.

import opening from './opening/index.js';
import ending_happy from './ending_happy/index.js';
import ending_sad from './ending_sad/index.js';

export const CUTSCENES = Object.fromEntries([opening, ending_happy, ending_sad].map((c) => [c.id, c]));
