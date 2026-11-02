import type { Exercise } from './exercises';

/**
 * League-style tiers. Thresholds are fixed weights per lift, derived from one
 * number per exercise (platinumKg) so every lift scales the same way.
 * Example, EZ-bar curl (Platinum at 30 kg): Bronze 5 kg, Silver 12.5, Gold 20, Platinum 30.
 */
export const TIERS = [
  { id: 'iron', name: 'Iron', color: '#9AA3B2', ratio: 0 },
  { id: 'bronze', name: 'Bronze', color: '#D08B57', ratio: 1 / 6 },
  { id: 'silver', name: 'Silver', color: '#C9D1DA', ratio: 5 / 12 },
  { id: 'gold', name: 'Gold', color: '#F2C14E', ratio: 2 / 3 },
  { id: 'platinum', name: 'Platinum', color: '#3FD0C9', ratio: 1 },
  { id: 'diamond', name: 'Diamond', color: '#7FB2FF', ratio: 4 / 3 },
  { id: 'master', name: 'Master', color: '#B98BFF', ratio: 5 / 3 },
  { id: 'champion', name: 'Champion', color: '#FF4D3D', ratio: 2 },
] as const;

export type Tier = (typeof TIERS)[number];
const DIVISIONS = ['IV', 'III', 'II', 'I'] as const;

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function tierStarts(e: Exercise): number[] {
  const step = e.perSide || e.platinumKg < 40 ? 0.5 : 2.5;
  return TIERS.map((t) => roundTo(e.platinumKg * t.ratio, step));
}

export interface Rank {
  tier: Tier;
  tierIndex: number;
  /** IV (lowest) to I. Champion has none. */
  division: string;
  /** 0..1 inside the current division. */
  progress: number;
  /** Weight needed for the next division, or null at Champion. */
  nextKg: number | null;
  nextLabel: string | null;
  label: string;
  /** Comparable score: higher = better rank. */
  score: number;
}

export function rankFor(e: Exercise, kg: number): Rank {
  const starts = tierStarts(e);
  let ti = 0;
  for (let i = 0; i < starts.length; i++) if (kg >= starts[i]) ti = i;
  const tier = TIERS[ti];
  if (ti === TIERS.length - 1) {
    return { tier, tierIndex: ti, division: '', progress: 1, nextKg: null, nextLabel: null, label: tier.name, score: ti * 4 + 4 };
  }
  const lo = starts[ti];
  const hi = starts[ti + 1];
  const span = (hi - lo) / 4;
  const d = Math.min(3, Math.floor((kg - lo) / span));
  const nextKg = d < 3 ? lo + span * (d + 1) : hi;
  const nextLabel = d < 3 ? `${tier.name} ${DIVISIONS[d + 1]}` : TIERS[ti + 1].name + (ti + 1 === TIERS.length - 1 ? '' : ' IV');
  return {
    tier,
    tierIndex: ti,
    division: DIVISIONS[d],
    progress: Math.max(0, Math.min(1, (kg - (lo + span * d)) / span)),
    nextKg: Math.round(nextKg * 2) / 2,
    nextLabel,
    label: `${tier.name} ${DIVISIONS[d]}`,
    score: ti * 4 + d,
  };
}

export const UNRANKED = { label: 'Unranked', color: '#5E6878' } as const;
