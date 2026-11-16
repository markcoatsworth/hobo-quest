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
//   cast?: { who: 'Name' },  speaker names for dialogue lines
//   music?,              a track id (src/music/) to start with the cutscene.
//                        It plays to its end even after the cutscene is over,
//                        then the playlist for wherever the player is carries on
//   video?,              path of a video under public/, e.g.
//                        'cutscenes/opening/opening.mp4'. When set, the video
//                        plays instead of the shots; if it fails to load, the
//                        shots play as a fallback.
//   shots: [...],        the sequence drawn in code, in order. Each runs
//                        `lead` seconds, then its lines, then `tail` seconds:
//                        { lead?, tail?,      seconds of picture before and
//                                             after the lines (a shot without
//                                             lines can give `duration`)
//                          lines?: [{ who, text, time?, beat? }]
//                                             dialogue, typed out and held long
//                                             enough to read (or `time` s).
//                                             beat: a story moment the
//                                             picture shows from this line on
//                          caption?,          title text over the picture
//                          dialog?: 'top',    put the lines at the top, where
//                                             the bottom of the picture matters
//                          fadeIn?, fadeOut?, false to cut instead of fading
//                          draw?(ctx, t, cue) }
//                                             the picture: t = seconds into the
//                                             shot, cue = { phase: 'lead' |
//                                             'lines' | 'tail', phaseT, line,
//                                             speaking: who is mid-sentence,
//                                             beat: the latest beat reached }.
//                                             Without it the shot is black.
// }
//
// Confirm finishes typing a line, then moves on; Back skips the whole
// cutscene. The opening plays after New Game.

import opening from './opening/index.js';
import ending_happy from './ending_happy/index.js';
import ending_sad from './ending_sad/index.js';

export const CUTSCENES = Object.fromEntries([opening, ending_happy, ending_sad].map((c) => [c.id, c]));
