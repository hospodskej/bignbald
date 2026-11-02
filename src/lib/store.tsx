import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { slotKey } from '@/data/plans';
import type { MealSlot } from '@/data/recipes';
import { dayKey } from './dates';
import { generateMealPlan } from './nutrition';
import { defaultProfile, emptyState } from './seed';
import type { Account, AppState, LoggedSet, Profile, Session } from './types';

import { newSession, prefill, rankUps, uid } from './workout';

export interface SignInResult {
  user: { username: string; email: string };
  token: string;
  profile?: Partial<Profile> | null;
  workouts?: Session[];
  weights?: { date: string; kg: number }[];
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
          const mealPlan = patch.dietStyle && patch.dietStyle !== s.profile.dietStyle ? generateMealPlan(patch.dietStyle) : s.mealPlan;
          return { ...s, profile, mealPlan };
        }),
      updateAccount: (patch: Partial<Account>) =>
        set((s) => ({ ...s, account: { ...accountOf(s), ...patch } })),
      logWeight: (kg: number) =>
        set((s) => ({
          ...s,
          profile: { ...s.profile, weightKg: kg },
          weightLog: [...s.weightLog.filter((w) => w.date !== dayKey()), { date: dayKey(), kg }],
        })),

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
          return {
            ...s,
            history: [...s.history, session],
            active: null,
            lastRankUps: rankUps(s.history, session),
            pendingUploads: [...(s.pendingUploads ?? []), session.id],
          };
        }),
      markUploaded: (id: string) => set((s) => ({ ...s, pendingUploads: (s.pendingUploads ?? []).filter((x) => x !== id) })),

      /**
       * After sign up / log in. A new account starts empty; logging in loads
       * everything the server has for that account.
       */
      signIn: (r: SignInResult) =>
        set((s) => {
          const profile = { ...defaultProfile, ...(r.profile ?? s.profile) } as Profile;
          const base = emptyState(profile);
          return {
            ...base,
            account: { status: 'registered', username: r.user.username, email: r.user.email, token: r.token },
            history: r.workouts ?? [],
            weightLog: r.weights?.length ? r.weights : base.weightLog,
          };
        }),
      signOut: () => set((s) => ({ ...s, account: { ...accountOf(s), status: 'guest', token: undefined } })),

      logFood: (foodId: string, grams: number) =>
        set((s) => ({ ...s, foodLog: [...s.foodLog, { id: uid(), date: dayKey(), foodId, grams }] })),
      removeFood: (id: string) => set((s) => ({ ...s, foodLog: s.foodLog.filter((f) => f.id !== id) })),
      toggleMeal: (slot: MealSlot) =>
        set((s) => {
          const key = dayKey();
          const eaten = s.mealsEaten[key] ?? [];
          return { ...s, mealsEaten: { ...s.mealsEaten, [key]: eaten.includes(slot) ? eaten.filter((x) => x !== slot) : [...eaten, slot] } };
        }),
      setMeal: (day: number, slot: MealSlot, recipeId: string) =>
        set((s) => ({ ...s, mealPlan: { ...s.mealPlan, [day]: { ...s.mealPlan[day], [slot]: recipeId } } })),
      addWater: (ml: number) =>
        set((s) => ({ ...s, waterMl: { ...s.waterMl, [dayKey()]: Math.max(0, (s.waterMl[dayKey()] ?? 0) + ml) } })),
      toggleGrocery: (foodId: string) =>
        set((s) => ({
          ...s,
          groceryChecked: s.groceryChecked.includes(foodId) ? s.groceryChecked.filter((x) => x !== foodId) : [...s.groceryChecked, foodId],
        })),
      clearGroceries: () => set((s) => ({ ...s, groceryChecked: [] })),

      startFresh: () => set((s) => emptyState(s.profile)),
    };
  }, [set]);
}

type Actions = ReturnType<typeof useActions>;
const Ctx = createContext<{ state: AppState; actions: Actions } | null>(null);

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as AppState) : null;
        setState(parsed?.version === 1 ? parsed : emptyState());
      })
      .catch(() => setState(emptyState()));
  }, []);

  useEffect(() => {
    if (!state) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}), 250);
  }, [state]);

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

