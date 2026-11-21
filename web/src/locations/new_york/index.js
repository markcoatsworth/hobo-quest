// New York: the family home up the Hudson (family_home/), and the city
// itself: the Bowery at dusk, under the Third Avenue El. The rail yard is
// only reachable through the city.

import familyHome from './family_home/index.js';
import town from './town.js';
import yard from './yard.js';

export default {
  id: 'new_york',
  name: 'New York',
  at: [995, 322],
  blurb: 'Shantytowns in the parks and breadlines around the block. Time to head west.',

  areas: {
    ...familyHome,
  },

  town,

  yard,
};
