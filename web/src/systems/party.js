// The party: Scout, and up to three others who join along the way (the
// characters in src/characters/). Each member carries their own things and
// gets hungry on their own; money is shared (src/systems/money.js).
//
// In the journey (src/core/save.js) the party is plain data:
//
//   party: [
//     { id: 'scout', hunger: 45, inventory: [null, null, null, null] },
//     ...
//   ]
//
// party[0] is always the player. hunger: 0 (just eaten) .. 100 (collapsing),
// see src/systems/hunger.js. inventory: one entry per slot, an item id or
// null for empty, see src/systems/inventory.js.
//
// Plain functions on plain data with GameMaker-style names, like every
// system here, so they port line for line.

import { CHARACTERS, PARTY_MAX, PLAYER } from '../characters/index.js';

export { PARTY_MAX };

const DEFAULT_SLOTS = 4;

/** A new party member: their character's id, how hungry, empty pockets. */
export function party_member_new(id, hunger = 30) {
  const slots = CHARACTERS[id]?.slots ?? DEFAULT_SLOTS;
  return { id, hunger, inventory: new Array(slots).fill(null) };
}

/** The party a new journey starts with: Scout, just out of jail and hungry. */
export function party_new() {
  return [party_member_new(PLAYER, 45)];
}

/** The member with this character id, or null. */
export function party_member(journey, id) {
  return journey.party.find((m) => m.id === id) ?? null;
}

export function party_has(journey, id) {
  return party_member(journey, id) !== null;
}

export function party_full(journey) {
  return journey.party.length >= PARTY_MAX;
}

/** Someone joins. False if they're already in or there's no room. */
export function party_join(journey, id, hunger = 30) {
  if (party_has(journey, id) || party_full(journey) || !CHARACTERS[id]) return false;
  journey.party.push(party_member_new(id, hunger));
  return true;
}

/** Someone leaves (never the player). Returns what they were carrying. */
export function party_leave(journey, id) {
  if (id === PLAYER) return [];
  const i = journey.party.findIndex((m) => m.id === id);
  if (i < 0) return [];
  return journey.party.splice(i, 1)[0].inventory.filter((item) => item !== null);
}
