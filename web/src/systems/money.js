// Money: shared by the whole party, kept in whole cents (journey.money) so
// the sums come out the same in every engine. Scout starts with the five
// dollars the sheriff handed over in the opening.

export const START_MONEY = 500;

/** Cents as the game writes them: $5.00, 35¢. */
export function money_format(cents) {
  if (cents < 100) return `${cents}¢`;
  return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function money_can_afford(journey, cents) {
  return journey.money >= cents;
}

/** Spend if there's enough. Returns whether it was spent. */
export function money_spend(journey, cents) {
  if (journey.money < cents) return false;
  journey.money -= cents;
  return true;
}

export function money_earn(journey, cents) {
  journey.money += cents;
}
