// Scout: the player. A teenager from a thin farm up the Hudson from New
// York City, let out of the county jail three weeks early because their
// father has died, with their mother and sister somewhere out west.
// Deliberately neither boy nor girl: nobody calls Scout "he" or "she".
// Named in the opening cutscene (src/cutscenes/opening/).

export default {
  id: 'scout',
  name: 'Scout',
  player: true,
  age: null, // TODO
  from: 'The Hudson Valley, New York',
  bio: 'Out of the county jail early, with five dollars from the sheriff and a family gone west.',

  // As drawn in the opening and the family home (src/art/hudson.js: KID).
  look: { coat: '#5d5348', pants: '#3d3833', hat: 'cap', skin: '#c8956d', hair: '#3b2b20' },
  slots: 4, // what fits in a coat's pockets and a bindle
};
