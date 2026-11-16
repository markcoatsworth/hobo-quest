// Every item in the game, defined once in items.json: plain JSON, so the
// GameMaker build can load the same file. An item:
//
//   id: {
//     name,              as shown in the party screen
//     kind,              'food' | ... (more to come)
//     food?,             how much eating it takes off hunger (src/systems/hunger.js)
//     icon,              how it's drawn in an inventory slot (src/ui/party.js)
//     about,             a line about it
//   }
//
// In the journey an item is just its id, in a party member's inventory.

import ITEMS from './items.json' with { type: 'json' };

export { ITEMS };
