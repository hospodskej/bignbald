import { food } from '@/data/foods';
import { addNutrition, Nutrition, NutrientId, zeroNutrition } from '@/data/nutrients';
import { DIET_STYLES, MealSlot, MEAL_SLOTS, recipe, recipesFor, servingNutrition } from '@/data/recipes';
import { PLANS } from '@/data/plans';
import { dayKey, weekdayIndex } from './dates';
import type { AppState, Goal, MealPlan, Profile } from './types';
import { dayIntensity, finished, nextDayId } from './workout';

export const GOALS: Record<Goal, { label: string; sub: string; delta: number; proteinPerKgLean: number; proteinPerKg: number }> = {
  bigger: { label: 'Get bigger', sub: 'Lean bulk · +300 kcal', delta: 300, proteinPerKgLean: 2.4, proteinPerKg: 2.0 },
  leaner: { label: 'Get leaner', sub: 'Recomp · −300 kcal', delta: -300, proteinPerKgLean: 2.6, proteinPerKg: 2.2 },
  lose: { label: 'Lose weight', sub: 'Cut · −500 kcal', delta: -500, proteinPerKgLean: 2.7, proteinPerKg: 2.2 },
  maintain: { label: 'Maintain', sub: 'Hold steady', delta: 0, proteinPerKgLean: 2.2, proteinPerKg: 1.8 },
};

/** Lean mass from the profile, if the user gave body fat % or lean / muscle mass. */
export function leanMassKg(p: Profile): number | null {
  if (p.bodyComp.mode === 'leanMass') return p.bodyComp.kg;
  if (p.bodyComp.mode === 'bodyFat') return p.weightKg * (1 - p.bodyComp.pct / 100);
  return null;
}

export interface Targets {
  maintenance: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  formula: string;
  explain: string;
}

/** Lifting 3-6 days a week. */
const ACTIVITY = 1.45;

/**
 * With lean mass known: Katch-McArdle BMR and protein per kg of lean mass
 * (a 130 kg lifter with 80 kg lean mass gets ~190 g, not 260 g).
 * Otherwise: Mifflin-St Jeor and protein per kg of body weight.
 */
export function targets(p: Profile): Targets {
  const lean = leanMassKg(p);
  const bmr = lean
    ? 370 + 21.6 * lean
    : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const maintenance = bmr * ACTIVITY;
  const g = GOALS[p.goal];
  const style = DIET_STYLES[p.dietStyle];
  const kcal = Math.round((maintenance + g.delta) / 50) * 50;
  const protein = Math.round((lean ? lean * g.proteinPerKgLean : p.weightKg * g.proteinPerKg) * style.proteinBoost);
  let fat: number;
  let carbs: number;
  if (style.carbCap) {
    carbs = style.carbCap;
    fat = Math.round((kcal - protein * 4 - carbs * 4) / 9);
  } else {
    fat = Math.round((kcal * style.fatPct) / 9);
    carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  }
  return {
    maintenance: Math.round(maintenance / 50) * 50,
    kcal,
    protein,
    carbs,
    fat,
    formula: lean ? `Katch-McArdle, ${Math.round(lean)} kg lean mass` : 'Mifflin-St Jeor (add body fat for more accuracy)',
    explain: g.delta > 0 ? 'A small surplus builds muscle without much fat.' : g.delta < 0 ? 'A deficit with high protein keeps your muscle.' : 'Eat at maintenance.',
  };
}

/** Today's bonus: up to +15% protein and +60 g carbs on the heaviest days. */
export function trainingBoost(state: AppState, date = new Date()) {
  const key = dayKey(date);
  const today = finished(state.history).find((s) => dayKey(s.finishedAt ?? 0) === key);
  const active = state.active && dayKey(state.active.startedAt) === key ? state.active : null;
  const s = today ?? active;
  const dayId = s?.dayId ?? nextDayId(state);
  const hero = s?.hero ?? state.profile.hero;
  const intensity = dayIntensity(state, hero, dayId);
  const base = targets(state.profile);
  const dayName = PLANS[hero].days.find((d) => d.id === dayId)?.name ?? '';
  return {
    trained: Boolean(s),
    dayName,
    intensity,
    label: intensity > 0.75 ? 'HIGH INTENSITY' : intensity > 0.45 ? 'MEDIUM INTENSITY' : 'LIGHT DAY',
    protein: Math.round(base.protein * 0.15 * intensity),
    carbs: DIET_STYLES[state.profile.dietStyle].carbCap ? 0 : Math.round(60 * intensity),
  };
}

export function dailyTargets(state: AppState): Record<NutrientId, number> {
  const t = targets(state.profile);
  const b = trainingBoost(state);
  const female = state.profile.sex === 'female';
  const kcal = t.kcal + b.protein * 4 + b.carbs * 4;
  return {
    kcal,
    protein: t.protein + b.protein,
    carbs: t.carbs + b.carbs,
    fat: t.fat,
    fibre: female ? 25 : 35,
    magnesium: female ? 310 : 400,
    potassium: 3500,
    calcium: 1000,
    iron: female ? 16 : 11,
    zinc: female ? 8 : 11,
    vitaminD: 15,
    caffeine: 400,
    sugar: Math.round((kcal * 0.1) / 4),
    satFat: Math.round((kcal * 0.1) / 9),
    salt: 5,
  };
}

export function eatenToday(state: AppState, date = new Date()): Nutrition {
  const key = dayKey(date);
  let n = zeroNutrition();
  const planned = state.mealPlan[weekdayIndex(date)] ?? {};
  for (const slot of state.mealsEaten[key] ?? []) {
    const id = planned[slot];
    if (id) n = addNutrition(n, servingNutrition(recipe(id)));
  }
  for (const item of state.foodLog) if (item.date === key) n = addNutrition(n, food(item.foodId).per100, item.grams / 100);
  return n;
}

/** Meal-prep friendly week: one breakfast all week, two batch-cooked mains alternating. */
export function generateMealPlan(style: AppState['profile']['dietStyle']): MealPlan {
  const pick = (kind: 'breakfast' | 'main' | 'snack', n: number) => {
    const list = recipesFor(style, kind);
    return Array.from({ length: n }, (_, i) => list[i % Math.max(1, list.length)]?.id);
  };
  const [breakfast] = pick('breakfast', 1);
  const [mainA, mainB] = pick('main', 2);
  const [snack] = pick('snack', 1);
  const plan: MealPlan = {};
  for (let d = 0; d < 7; d++) {
    plan[d] = { breakfast, lunch: d % 2 === 0 ? mainA : mainB, dinner: d % 2 === 0 ? mainB : mainA, snack };
  }
  return plan;
}

export function prepList(plan: MealPlan) {
  const servings = new Map<string, number>();
  for (let d = 0; d < 7; d++) for (const slot of MEAL_SLOTS) {
    const id = plan[d]?.[slot];
    if (id) servings.set(id, (servings.get(id) ?? 0) + 1);
  }
  return [...servings.entries()]
    .map(([id, n]) => {
      const r = recipe(id);
      return { recipe: r, servings: n, batches: Math.ceil((n / r.servings) * 2) / 2 };
    })
    .sort((a, b) => b.servings - a.servings);
}

export interface GroceryItem {
  foodId: string;
  name: string;
  aisle: string;
  grams: number;
  label: string;
}

/** Shopping list: ingredients of every planned batch, merged per food. */
export function groceryList(plan: MealPlan): GroceryItem[] {
  const grams = new Map<string, number>();
  for (const { recipe: r, batches } of prepList(plan))
    for (const [foodId, g] of r.ingredients) grams.set(foodId, (grams.get(foodId) ?? 0) + g * batches);
  return [...grams.entries()]
    .map(([foodId, g]) => {
      const f = food(foodId);
      const liquid = f.aisle === 'Drinks' || foodId === 'milk';
      const label = g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} ${liquid ? 'L' : 'kg'}` : `${Math.round(g)} ${liquid ? 'ml' : 'g'}`;
      return { foodId, name: f.name, aisle: f.aisle, grams: g, label };
    })
    .sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
}

export const slotsOrder: MealSlot[] = [...MEAL_SLOTS];
