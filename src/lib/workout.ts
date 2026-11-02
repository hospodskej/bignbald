import { exercise, EXERCISES, incrementFor } from '@/data/exercises';
import { combineHeat, Heat } from '@/data/muscles';
import { planDay, PLANS, slotKey } from '@/data/plans';
import { rankFor } from '@/data/ranks';
import type { HeroId } from '@/data/heroes';
import { DAY_MS, startOfWeek } from './dates';
import type { AppState, LoggedSet, RankUp, Session } from './types';

export const MIN_REPS = 5;
export const UPGRADE_REPS = 12;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
export const setKg = (s: LoggedSet) => num(s.kg);
export const setReps = (s: LoggedSet) => Math.round(num(s.reps));
const counts = (s: LoggedSet) => s.done && setReps(s) >= MIN_REPS;

/** Newest first. */
export const finished = (history: Session[]) =>
  [...history].filter((s) => s.finishedAt).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));

/** Every logged appearance of an exercise, newest first. */
export function performances(history: Session[], exerciseId: string) {
  const out: { session: Session; sets: LoggedSet[] }[] = [];
  for (const s of finished(history)) {
    const e = s.entries.find((x) => x.exerciseId === exerciseId);
    if (e && e.sets.some((x) => x.done)) out.push({ session: s, sets: e.sets.filter((x) => x.done) });
  }
  return out;
}

/** Heaviest set with at least 5 reps: this is what ranks are based on. */
export function bestKg(history: Session[], exerciseId: string): number {
  let best = 0;
  for (const s of history)
    for (const e of s.entries)
      if (e.exerciseId === exerciseId) for (const set of e.sets) if (counts(set)) best = Math.max(best, setKg(set));
  return best;
}

export const rankOf = (history: Session[], exerciseId: string) => {
  const kg = bestKg(history, exerciseId);
  return kg > 0 ? rankFor(exercise(exerciseId), kg) : null;
};

export const lastSets = (history: Session[], exerciseId: string) => performances(history, exerciseId)[0]?.sets ?? [];

export type Suggestion =
  | { kind: 'upgrade'; fromKg: number; toKg: number; reps: number[] }
  | { kind: 'deload'; fromKg: number; toKg: number }
  | null;

/**
 * "Time for an upgrade": 12+ reps on the first set, at the same weight, two sessions in a row.
 * Below 5 reps on the first set: suggest going back down.
 */
export function suggestion(history: Session[], exerciseId: string): Suggestion {
  const [a, b] = performances(history, exerciseId);
  if (!a) return null;
  const e = exercise(exerciseId);
  const step = incrementFor(e);
  const firstA = a.sets[0];
  if (firstA && setReps(firstA) > 0 && setReps(firstA) < MIN_REPS) {
    return { kind: 'deload', fromKg: setKg(firstA), toKg: Math.max(0, setKg(firstA) - step) };
  }
  if (!b) return null;
  const firstB = b.sets[0];
  if (firstA && firstB && setKg(firstA) === setKg(firstB) && setReps(firstA) >= UPGRADE_REPS && setReps(firstB) >= UPGRADE_REPS) {
    return { kind: 'upgrade', fromKg: setKg(firstA), toKg: setKg(firstA) + step, reps: [setReps(firstB), setReps(firstA)] };
  }
  return null;
}

export const exerciseForSlot = (state: AppState, hero: HeroId, dayId: string, i: number) =>
  state.slotChoices[slotKey(hero, dayId, i)] ?? planDay(hero, dayId).slots[i].exercise;

/** Which day is up next: after the last finished day of the current plan. */
export function nextDayId(state: AppState): string {
  const plan = PLANS[state.profile.hero];
  const last = finished(state.history).find((s) => s.hero === plan.hero);
  if (!last) return plan.days[0].id;
  const i = plan.days.findIndex((d) => d.id === last.dayId);
  return plan.days[(i + 1) % plan.days.length].id;
}

export function dayHeat(state: AppState, hero: HeroId, dayId: string): Heat {
  const day = planDay(hero, dayId);
  return combineHeat(day.slots.map((s, i) => ({ heat: exercise(exerciseForSlot(state, hero, dayId, i)).heat, weight: s.sets })));
}

/** 0..1 how demanding a day is: drives the protein bonus. */
export function dayIntensity(state: AppState, hero: HeroId, dayId: string): number {
  const day = planDay(hero, dayId);
  const load = day.slots.reduce((sum, s, i) => sum + s.sets * exercise(exerciseForSlot(state, hero, dayId, i)).load, 0);
  return Math.min(1, load / 22);
}

export function newSession(state: AppState, dayId: string): Session {
  const hero = state.profile.hero;
  const day = planDay(hero, dayId);
  return {
    id: uid(),
    hero,
    dayId,
    startedAt: Date.now(),
    entries: day.slots.map((slot, i) => {
      const exerciseId = exerciseForSlot(state, hero, dayId, i);
      return { slot: i, exerciseId, sets: prefill(state.history, exerciseId, slot.sets) };
    }),
  };
}

/** Pre-fill weights from last time (or the upgrade). Reps stay empty: you go to failure. */
export function prefill(history: Session[], exerciseId: string, count: number): LoggedSet[] {
  const last = lastSets(history, exerciseId);
  const sug = suggestion(history, exerciseId);
  return Array.from({ length: count }, (_, i) => ({
    kg: sug ? String(sug.toKg) : last[i] ? last[i].kg : last[0]?.kg ?? '',
    reps: '',
    done: false,
  }));
}

export function rankUps(before: Session[], session: Session): RankUp[] {
  const after = [...before, session];
  const ups: RankUp[] = [];
  for (const entry of session.entries) {
    const was = rankOf(before, entry.exerciseId);
    const now = rankOf(after, entry.exerciseId);
    if (!now) continue;
    if (!was || now.score > was.score) {
      const top = entry.sets.filter(counts).sort((a, b) => setKg(b) - setKg(a))[0];
      ups.push({
        exerciseId: entry.exerciseId,
        from: was?.label ?? 'Unranked',
        to: now.label,
        color: now.tier.color,
        kg: top ? setKg(top) : 0,
        reps: top ? setReps(top) : 0,
      });
    }
  }
  return ups.sort((a, b) => b.to.localeCompare(a.to));
}

export const doneSets = (s: Session) => s.entries.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
export const volume = (s: Session) =>
  s.entries.reduce((v, e) => v + e.sets.filter((x) => x.done).reduce((a, x) => a + setKg(x) * setReps(x), 0), 0);

export function weekStats(history: Session[], weekStart = startOfWeek()) {
  const inWeek = finished(history).filter((s) => (s.finishedAt ?? 0) >= weekStart && (s.finishedAt ?? 0) < weekStart + 7 * DAY_MS);
  return {
    workouts: inWeek.length,
    sets: inWeek.reduce((n, s) => n + doneSets(s), 0),
    volume: inWeek.reduce((n, s) => n + volume(s), 0),
  };
}

/** Weeks in a row with at least 3 workouts (this week counts once it gets there). */
export function weekStreak(history: Session[]): number {
  let streak = 0;
  let week = startOfWeek();
  if (weekStats(history, week).workouts < 3) week -= 7 * DAY_MS;
  while (weekStats(history, week).workouts >= 3) {
    streak++;
    week -= 7 * DAY_MS;
  }
  return streak;
}

/** XP: 10 per set, 50 per finished workout. 500 XP per level. */
export function level(history: Session[]) {
  const xp = finished(history).reduce((n, s) => n + 50 + doneSets(s) * 10, 0);
  return { level: Math.floor(xp / 500) + 1, xp: xp % 500, need: 500 };
}

export const allRanked = (history: Session[]) =>
  Object.keys(EXERCISES)
    .map((id) => ({ id, rank: rankOf(history, id), kg: bestKg(history, id) }))
    .filter((x) => x.rank)
    .sort((a, b) => (b.rank?.score ?? 0) - (a.rank?.score ?? 0));
