// The major characters: the player and the people who can join the party
// (up to four travelling together, the player included). Each one is
// hand-built in its own folder:
//
//   src/characters/<id>/index.js   the character's definition (below)
//   public/characters/<id>/        portraits, sprites etc., when there are some
//
// <id> is the character's name in snake_case, the same for the folder and
// the `id` field. Like the cities, nothing here is generated.
//
// A character module's default export:
//
// {
//   id, name,
//   age,                 years old in April 1932
//   from,                hometown, in words
//   bio,                 a line or two about who they are
//   look: { coat, pants, hat, skin },
//                        how they're drawn in town, the same as an NPC's look.
//                        hat: 'fedora' | 'straw' | 'cap' | 'bowler' | 'cloche'
// }
//
// Party fields (skills, stats, what they're good for on the road) come later.

import woody from './woody/index.js';
import judy from './judy/index.js';
import jesse from './jesse/index.js';

export const CHARACTERS = Object.fromEntries([woody, judy, jesse].map((c) => [c.id, c]));

// Most people travelling together at once, the player included.
export const PARTY_MAX = 4;
