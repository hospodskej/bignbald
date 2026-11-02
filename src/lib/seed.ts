import { dayKey } from './dates';
import { generateMealPlan } from './nutrition';
import type { AppState, Profile } from './types';

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
  rivalName: '',
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
