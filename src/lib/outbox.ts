import type { AppState, FoodLogItem, OutboxItem, Session } from './types';
import { setKg, setReps, uid } from './workout';

/**
 * Everything the phone needs to tell the server goes through one queue.
 * Each item has a `key`: a newer change to the same thing (today's water,
 * the meal plan, the profile) replaces the older one still waiting.
 * The sync hook sends them in order whenever the server is reachable.
 */
export function enqueue(s: AppState, ...items: Omit<OutboxItem, 'id'>[]): AppState {
  let outbox = s.outbox ?? [];
  for (const item of items) outbox = [...outbox.filter((x) => x.key !== item.key), { ...item, id: uid() }];
  return { ...s, outbox };
}

/** The app's session -> the API's workout shape (numbers instead of the text the inputs hold). */
const workoutBody = (s: Session) => ({
  id: s.id,
  hero: s.hero,
  dayId: s.dayId,
  startedAt: s.startedAt,
  finishedAt: s.finishedAt ?? s.startedAt,
  entries: s.entries.map((e) => ({
    slot: e.slot,
    exerciseId: e.exerciseId,
    sets: e.sets.map((x) => ({ kg: setKg(x), reps: setReps(x), done: x.done })),
  })),
});

export const outboxItems = {
  workout: (s: Session) => ({ key: `workout:${s.id}`, method: 'POST' as const, path: '/account/workouts', body: workoutBody(s) }),
  profile: (st: AppState) => ({ key: 'profile', method: 'PUT' as const, path: '/account/profile', body: { profile: st.profile } }),
  weight: (date: string, kg: number) => ({ key: `weight:${date}`, method: 'PUT' as const, path: '/account/weights', body: { date, kg } }),
  addFood: (f: FoodLogItem) => ({ key: `food:${f.id}`, method: 'POST' as const, path: '/account/food-logs', body: f }),
  removeFood: (id: string) => ({ key: `food:${id}`, method: 'DELETE' as const, path: `/account/food-logs/${encodeURIComponent(id)}` }),
  day: (st: AppState, date: string) => ({
    key: `day:${date}`,
    method: 'PUT' as const,
    path: `/account/days/${date}`,
    body: { mealsEaten: st.mealsEaten[date] ?? [], waterMl: st.waterMl[date] ?? 0 },
  }),
  mealPlan: (st: AppState) => ({ key: 'meal-plan', method: 'PUT' as const, path: '/account/meal-plan', body: { plan: st.mealPlan, groceryChecked: st.groceryChecked } }),
};

/**
 * One-time upload of data that only lived on the phone before it synced
 * (food log, meals, water, meal plan) and of the old workout queue.
 */
export function migrateLocalData(s: AppState): AppState {
  if (s.syncVersion === 2 || s.account?.status !== 'registered') return s;
  const days = [...new Set([...Object.keys(s.mealsEaten), ...Object.keys(s.waterMl)])];
  const pendingWorkouts = (s.pendingUploads ?? [])
    .map((id) => s.history.find((h) => h.id === id))
    .filter((x): x is Session => Boolean(x));
  const next = enqueue(
    s,
    ...pendingWorkouts.map(outboxItems.workout),
    ...s.foodLog.map(outboxItems.addFood),
    ...days.map((d) => outboxItems.day(s, d)),
    outboxItems.mealPlan(s),
  );
  return { ...next, pendingUploads: undefined, syncVersion: 2 };
}
