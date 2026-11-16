// Inventory: each party member carries their own things, one item per slot
// (no stacking). member.inventory is an array, one entry per slot: an item
// id, or null for an empty slot. How many slots someone has comes from
// their character (src/characters/, `slots`).
//
// There are no items yet; these are the moves the game will need.

export function inventory_slots(member) {
  return member.inventory.length;
}

export function inventory_free(member) {
  return member.inventory.filter((item) => item === null).length;
}

/** Put an item in the first empty slot. Returns the slot, or -1 if full. */
export function inventory_add(member, itemId) {
  const slot = member.inventory.indexOf(null);
  if (slot >= 0) member.inventory[slot] = itemId;
  return slot;
}

/** Take whatever's in a slot out. Returns the item id, or null. */
export function inventory_remove(member, slot) {
  const item = member.inventory[slot] ?? null;
  if (item !== null) member.inventory[slot] = null;
  return item;
}

/** Hand an item from one member's slot to another member. False if they've no room. */
export function inventory_give(from, slot, to) {
  const item = from.inventory[slot];
  if (item == null || inventory_free(to) === 0) return false;
  inventory_add(to, inventory_remove(from, slot));
  return true;
}
