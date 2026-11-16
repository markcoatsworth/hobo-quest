// Hunger, per party member: 0 just eaten, 100 collapsing. Only the tiers
// for now; how it rises with the days and falls with eating comes later.
//
// The tiers, from the design: Fed is rare, Hungry is normal life on the
// road, Starving is common when things go badly, Collapsing is the end of
// the line (you pass out and wake somewhere you didn't choose).

export const HUNGER_MAX = 100;

// From the top: a hunger value at or above `from` is in that tier.
export const HUNGER_TIERS = [
  { id: 'collapse', from: 85, label: 'Collapsing' },
  { id: 'starving', from: 60, label: 'Starving' },
  { id: 'hungry', from: 25, label: 'Hungry' },
  { id: 'fed', from: 0, label: 'Fed' },
];

/** The tier a hunger value falls in: { id, from, label }. */
export function hunger_tier(hunger) {
  return HUNGER_TIERS.find((tier) => hunger >= tier.from) ?? HUNGER_TIERS[HUNGER_TIERS.length - 1];
}

/** How full a member is, 0..1 (for a gauge that drains as they get hungrier). */
export function hunger_fullness(hunger) {
  return Math.max(0, Math.min(1, 1 - hunger / HUNGER_MAX));
}
