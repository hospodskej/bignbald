import type { HeroId } from '@/data/heroes';
import type { DietStyle, MealSlot } from '@/data/recipes';

export type Goal = 'bigger' | 'leaner' | 'lose' | 'maintain';
export type Sex = 'male' | 'female';

export interface Account {
  /** guest = local only. registered = signed up (sync arrives with the server). */
  status: 'guest' | 'registered';
  username: string;
  email: string;
}

export interface Profile {
  name: string;
  hero: HeroId;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  /** Optional body composition: makes calorie and protein maths more accurate. */
  bodyComp: { mode: 'none' } | { mode: 'bodyFat'; pct: number } | { mode: 'leanMass'; kg: number };
  goal: Goal;
  goalWeightKg: number;
  dietStyle: DietStyle;
  rivalName: string;
}

export interface LoggedSet {
  kg: string;
  reps: string;
  done: boolean;
}

export interface SessionEntry {
  slot: number;
  exerciseId: string;
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  hero: HeroId;
  dayId: string;
  startedAt: number;
  finishedAt?: number;
  entries: SessionEntry[];
}

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  foodId: string;
  grams: number;
}

export type MealPlan = Record<number, Partial<Record<MealSlot, string>>>; // 0 = Monday

export interface RankUp {
  exerciseId: string;
  from: string;
  to: string;
  color: string;
  kg: number;
  reps: number;
}

export interface AppState {
  version: 1;
  account?: Account;
  profile: Profile;
  weightLog: { date: string; kg: number }[];
  history: Session[];
  active: Session | null;
  /** Remembered swaps: "hero:day:slot" -> exercise id. */
  slotChoices: Record<string, string>;
  foodLog: FoodLogItem[];
  /** Planned meals ticked off as eaten, per date. */
  mealsEaten: Record<string, MealSlot[]>;
  waterMl: Record<string, number>;
  mealPlan: MealPlan;
  groceryChecked: string[];
  lastRankUps: RankUp[];
}
