import { exercise, incrementFor } from '@/data/exercises';
import { PLANS } from '@/data/plans';
import { DAY_MS, dayKey } from './dates';
import { generateMealPlan } from './nutrition';
import { seeded } from './random';
import type { AppState, Profile, Session } from './types';
import { uid } from './workout';

export const defaultProfile: Profile = {
  name: 'You',
  hero: 'brawler',
  sex: 'male',
  age: 24,
  heightCm: 183,
  weightKg: 80,
  bodyComp: { mode: 'none' },
  goal: 'bigger',
  goalWeightKg: 85,
  dietStyle: 'highProtein',
  rivalName: 'Brother',
};

export function emptyState(profile: Profile = defaultProfile): AppState {
  return {
    version: 1,
    profile,
    weightLog: [{ date: dayKey(), kg: profile.weightKg }],
    history: [],
    active: null,
    slotChoices: {},
    foodLog: [],
    mealsEaten: {},
    waterMl: {},
    mealPlan: generateMealPlan(profile.dietStyle),
    groceryChecked: [],
    lastRankUps: [],
  };
}

/** Demo: 14 Brawler workouts over the last 3 weeks, so ranks, upgrades and duels have something to show. */
export function demoState(): AppState {
  const state = emptyState();
  const plan = PLANS.brawler;
  const offsets = [20, 19, 18, 16, 15, 13, 12, 11, 9, 8, 6, 5, 3, 1];
  const rnd = seeded('demo');
  const seen: Record<string, number> = {};
  const total: Record<string, number> = {};
  offsets.forEach((_, i) => plan.days[i % plan.days.length].slots.forEach((s) => (total[s.exercise] = (total[s.exercise] ?? 0) + 1)));
  // Lifts that end on "time for an upgrade": same weight, 12+ reps twice.
  const finale: Record<string, number> = { 'hack-squat': 100, 'ez-bar-curl': 27.5 };

  const history: Session[] = offsets.map((daysAgo, i) => {
    const day = plan.days[i % plan.days.length];
    const start = Date.now() - daysAgo * DAY_MS - 3 * 3600_000;
    return {
      id: uid() + i,
      hero: 'brawler',
      dayId: day.id,
      startedAt: start,
      finishedAt: start + 55 * 60_000,
      entries: day.slots.map((slot, si) => {
        const e = exercise(slot.exercise);
        const k = (seen[e.id] = (seen[e.id] ?? -1) + 1);
        const left = total[e.id] - k; // 1 = latest appearance
        const step = incrementFor(e);
        const base = Math.round((e.platinumKg * (0.45 + rnd() * 0.35)) / step) * step;
        let kg = base + step * Math.floor(k / 2);
        let first = 9 + (k % 3);
        if (finale[e.id] !== undefined && left <= 2) {
          kg = finale[e.id];
          first = left === 2 ? 12 : 13;
        } else if (finale[e.id] !== undefined) {
          kg = finale[e.id] - step;
        }
        return {
          slot: si,
          exerciseId: e.id,
          sets: Array.from({ length: slot.sets }, (_, n) => ({ kg: String(kg), reps: String(Math.max(5, first - n * 2)), done: true })),
        };
      }),
    };
  });

  const weights = [78.4, 78.6, 78.5, 79.0, 79.2, 79.5, 79.7, 80.0];
  return {
    ...state,
    history,
    weightLog: weights.map((kg, i) => ({ date: dayKey(Date.now() - (7 - i) * 7 * DAY_MS), kg })),
    mealsEaten: { [dayKey()]: ['breakfast'] },
  };
}
