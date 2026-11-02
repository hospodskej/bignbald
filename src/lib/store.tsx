import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { slotKey } from '@/data/plans';
import type { MealSlot } from '@/data/recipes';
import { dayKey } from './dates';
import { generateMealPlan } from './nutrition';
import { defaultProfile, emptyState } from './seed';
import { enqueue, migrateLocalData, outboxItems } from './outbox';
import { tokenStore } from './tokenStore';
import type { Account, AppState, FoodLogItem, LoggedSet, MealPlan, Profile, Session } from './types';
import { newSession, prefill, rankUps, uid } from './workout';

export interface SignInResult {
  user: { username: string; email: string };
  token: string;
  profile?: Partial<Profile> | null;
  workouts?: Session[];
  weights?: { date: string; kg: number }[];
  foodLogs?: FoodLogItem[];
  days?: { date: string; mealsEaten: string[]; waterMl: number }[];
  mealPlan?: { plan: MealPlan; groceryChecked: string[] } | null;
}

const KEY = 'bignbald:v1';

export const accountOf = (s: AppState): Account => s.account ?? { status: 'guest', username: '', email: '' };

function useActions(set: (fn: (s: AppState) => AppState) => void) {
  return useMemo(() => {
    const active = (fn: (a: NonNullable<AppState['active']>) => NonNullable<AppState['active']>) =>
      set((s) => (s.active ? { ...s, active: fn(s.active) } : s));
    const editSets = (entry: number, fn: (sets: LoggedSet[]) => LoggedSet[]) =>
      active((a) => ({ ...a, entries: a.entries.map((e, i) => (i === entry ? { ...e, sets: fn(e.sets) } : e)) }));

    return {
      updateProfile: (patch: Partial<Profile>) =>
        set((s) => {
          const profile = { ...s.profile, ...patch };
          const newPlan = Boolean(patch.dietStyle && patch.dietStyle !== s.profile.dietStyle);
          const next = { ...s, profile, mealPlan: newPlan ? generateMealPlan(profile.dietStyle) : s.mealPlan };
          return enqueue(next, outboxItems.profile(next), ...(newPlan ? [outboxItems.mealPlan(next)] : []));
        }),
      updateAccount: (patch: Partial<Account>) =>
        set((s) => ({ ...s, account: { ...accountOf(s), ...patch } })),
      logWeight: (kg: number) =>
        set((s) => {
          const next = {
            ...s,
            profile: { ...s.profile, weightKg: kg },
            weightLog: [...s.weightLog.filter((w) => w.date !== dayKey()), { date: dayKey(), kg }],
          };
          return enqueue(next, outboxItems.weight(dayKey(), kg), outboxItems.profile(next));
        }),

      startWorkout: (dayId: string) => set((s) => ({ ...s, active: newSession(s, dayId) })),
      discardWorkout: () => set((s) => ({ ...s, active: null })),
      updateSet: (entry: number, index: number, patch: Partial<LoggedSet>) =>
        editSets(entry, (sets) => sets.map((x, i) => (i === index ? { ...x, ...patch } : x))),
      addSet: (entry: number) =>
        editSets(entry, (sets) => [...sets, { kg: sets[sets.length - 1]?.kg ?? '', reps: '', done: false }]),
      removeSet: (entry: number) => editSets(entry, (sets) => (sets.length > 1 ? sets.slice(0, -1) : sets)),
      useWeight: (entry: number, kg: number) =>
        editSets(entry, (sets) => sets.map((x) => (x.done ? x : { ...x, kg: String(kg) }))),
      /** Swap in the active workout, and remember it for next time. */
      swapExercise: (entry: number, exerciseId: string) =>
        set((s) => {
          if (!s.active) return s;
          const e = s.active.entries[entry];
          const key = slotKey(s.active.hero, s.active.dayId, e.slot);
          return {
            ...s,
            slotChoices: { ...s.slotChoices, [key]: exerciseId },
            active: {
              ...s.active,
              entries: s.active.entries.map((x, i) =>
                i === entry ? { ...x, exerciseId, sets: prefill(s.history, exerciseId, x.sets.length) } : x,
              ),
            },
          };
        }),
      chooseForSlot: (dayId: string, slot: number, exerciseId: string) =>
        set((s) => ({ ...s, slotChoices: { ...s.slotChoices, [slotKey(s.profile.hero, dayId, slot)]: exerciseId } })),
      finishWorkout: () =>
        set((s) => {
          if (!s.active) return s;
          const session = { ...s.active, finishedAt: Date.now() };
          return enqueue(
            { ...s, history: [...s.history, session], active: null, lastRankUps: rankUps(s.history, session) },
            outboxItems.workout(session),
          );
        }),
      /** The sync hook calls this once the server has an item (or rejected it for good). */
      markSent: (itemId: string) => set((s) => ({ ...s, outbox: (s.outbox ?? []).filter((x) => x.id !== itemId) })),

      /**
       * After sign up / log in. A new account starts empty; logging in loads
       * everything the server has for that account.
       */
      signIn: (r: SignInResult) =>
        set((s) => {
          // The server sends empty fields back as null; fall back to defaults for those.
          const saved = Object.fromEntries(Object.entries(r.profile ?? s.profile).filter(([, v]) => v !== null && v !== undefined));
          const profile = { ...defaultProfile, ...saved } as Profile;
          const base = emptyState(profile);
          const days = r.days ?? [];
          return {
            ...base,
            account: { status: 'registered', username: r.user.username, email: r.user.email, token: r.token },
            history: r.workouts ?? [],
            weightLog: r.weights?.length ? r.weights : base.weightLog,
            foodLog: r.foodLogs ?? [],
            mealsEaten: Object.fromEntries(days.map((d) => [d.date, d.mealsEaten as MealSlot[]])),
            waterMl: Object.fromEntries(days.map((d) => [d.date, d.waterMl])),
            mealPlan: r.mealPlan?.plan ?? base.mealPlan,
            groceryChecked: r.mealPlan?.groceryChecked ?? [],
            outbox: [],
            syncVersion: 2,
          };
        }),
      signOut: () => set((s) => ({ ...s, account: { ...accountOf(s), status: 'guest', token: undefined }, outbox: [] })),

      logFood: (foodId: string, grams: number) =>
        set((s) => {
          const item = { id: uid(), date: dayKey(), foodId, grams };
          return enqueue({ ...s, foodLog: [...s.foodLog, item] }, outboxItems.addFood(item));
        }),
      removeFood: (id: string) =>
        set((s) => {
          const next = { ...s, foodLog: s.foodLog.filter((f) => f.id !== id) };
          // Never reached the server? Then just drop the queued add instead of sending a delete.
          const unsent = (s.outbox ?? []).some((x) => x.key === `food:${id}` && x.method === 'POST');
          return unsent ? { ...next, outbox: (s.outbox ?? []).filter((x) => x.key !== `food:${id}`) } : enqueue(next, outboxItems.removeFood(id));
        }),
      toggleMeal: (slot: MealSlot) =>
        set((s) => {
          const key = dayKey();
          const eaten = s.mealsEaten[key] ?? [];
          const next = { ...s, mealsEaten: { ...s.mealsEaten, [key]: eaten.includes(slot) ? eaten.filter((x) => x !== slot) : [...eaten, slot] } };
          return enqueue(next, outboxItems.day(next, key));
        }),
      setMeal: (day: number, slot: MealSlot, recipeId: string) =>
        set((s) => {
          const next = { ...s, mealPlan: { ...s.mealPlan, [day]: { ...s.mealPlan[day], [slot]: recipeId } } };
          return enqueue(next, outboxItems.mealPlan(next));
        }),
      addWater: (ml: number) =>
        set((s) => {
          const next = { ...s, waterMl: { ...s.waterMl, [dayKey()]: Math.max(0, (s.waterMl[dayKey()] ?? 0) + ml) } };
          return enqueue(next, outboxItems.day(next, dayKey()));
        }),
      toggleGrocery: (foodId: string) =>
        set((s) => {
          const has = s.groceryChecked.includes(foodId);
          const next = { ...s, groceryChecked: has ? s.groceryChecked.filter((x) => x !== foodId) : [...s.groceryChecked, foodId] };
          return enqueue(next, outboxItems.mealPlan(next));
        }),
      clearGroceries: () =>
        set((s) => {
          const next = { ...s, groceryChecked: [] };
          return enqueue(next, outboxItems.mealPlan(next));
        }),

      /** After the server deleted your workouts: clear them here too, but stay signed in. */
      startFresh: () => set((s) => ({ ...emptyState(s.profile), account: s.account, syncVersion: 2 })),
    };
  }, [set]);
}

type Actions = ReturnType<typeof useActions>;
const Ctx = createContext<{ state: AppState; actions: Actions } | null>(null);

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY).catch(() => null), tokenStore.get()]).then(([raw, token]) => {
      let parsed: AppState | null = null;
      try {
        parsed = raw ? (JSON.parse(raw) as AppState) : null;
      } catch {}
      const loaded = parsed?.version === 1 ? parsed : emptyState();
      // Older versions kept the token in the app data; it moves to the token store below.
      const t = token ?? loaded.account?.token;
      setState(migrateLocalData(loaded.account ? { ...loaded, account: { ...loaded.account, token: t ?? undefined } } : loaded));
    });
  }, []);

  // App data: saved shortly after every change, never including the login token.
  useEffect(() => {
    if (!state) return;
    if (timer.current) clearTimeout(timer.current);
    const safe = state.account ? { ...state, account: { ...state.account, token: undefined } } : state;
    timer.current = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(safe)).catch(() => {}), 250);
  }, [state]);

  // Login token: its own secure storage.
  const token = state?.account?.token;
  const loaded = state !== null;
  useEffect(() => {
    if (!loaded) return;
    if (token) tokenStore.set(token);
    else tokenStore.clear();
  }, [token, loaded]);

  const set = useCallback((fn: (s: AppState) => AppState) => setState((s) => (s ? fn(s) : s)), []);
  const actions = useActions(set);

  if (!state) return <>{fallback}</>;
  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

