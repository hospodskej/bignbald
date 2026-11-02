import { exercise } from '@/data/exercises';
import type { HeroId } from '@/data/heroes';
import { rankFor } from '@/data/ranks';
import { seeded } from './random';
import type { AppState } from './types';
import { DAY_MS } from './dates';
import { allRanked, bestKg, level, weekStats, weekStreak } from './workout';

/**
 * DEMO DATA. The global leaderboard and other players' stats need the backend;
 * until then these generated players stand in so every screen can be clicked through.
 */
const HANDLES: [string, string, HeroId][] = [
  ['IronVlk', 'CZ', 'brawler'], ['SkyrLord', 'IS', 'acrobat'], ['DeadliftDana', 'DE', 'brawler'], ['Kubak', 'CZ', 'acrobat'],
  ['NordicNate', 'NO', 'brawler'], ['PaprikaPump', 'HU', 'brawler'], ['LaPressa', 'IT', 'acrobat'], ['Tatranka', 'SK', 'acrobat'],
  ['QuarkKing', 'DE', 'brawler'], ['BaguetteBen', 'FR', 'acrobat'], ['Pierogi', 'PL', 'brawler'], ['FjordFlex', 'DK', 'acrobat'],
  ['Halušky', 'SK', 'brawler'], ['TulipTank', 'NL', 'brawler'], ['Sauna', 'FI', 'acrobat'], ['ChorizoCurl', 'ES', 'brawler'],
  ['Alpenhorn', 'AT', 'acrobat'], ['Gyros', 'GR', 'brawler'], ['Waffle', 'BE', 'acrobat'], ['Pastel', 'PT', 'acrobat'],
  ['Knedlík', 'CZ', 'brawler'], ['Viking', 'SE', 'brawler'], ['Shamrock', 'IE', 'acrobat'], ['Bratwurst', 'DE', 'brawler'],
  ['Matcha', 'LT', 'acrobat'], ['Borscht', 'UA', 'brawler'], ['Ćevapi', 'HR', 'brawler'], ['Fondue', 'CH', 'acrobat'],
  ['Trdelník', 'CZ', 'acrobat'], ['Goulash', 'HU', 'brawler'], ['Pretzel', 'AT', 'acrobat'], ['Smørrebrød', 'DK', 'brawler'],
];

export const LEADERBOARD_LIFTS = [
  'bench-press', 'hack-squat', 'ez-bar-curl', 'barbell-rdl', 'incline-barbell-press',
  'lat-pulldown-wide', 't-bar-row', 'dumbbell-shoulder-press',
];

export interface BoardRow {
  id: string;
  name: string;
  country: string;
  hero: HeroId;
  kg: number;
  rankLabel: string;
  rankColor: string;
  you?: boolean;
  position: number;
}

const roundStep = (kg: number, perSide?: boolean) => (perSide ? Math.round(kg) : Math.round(kg / 2.5) * 2.5);

export function leaderboard(state: AppState, exerciseId: string): BoardRow[] {
  const e = exercise(exerciseId);
  const rnd = seeded(exerciseId);
  const rows: Omit<BoardRow, 'position'>[] = HANDLES.map(([name, country, hero], i) => {
    const kg = roundStep(e.platinumKg * (2.15 - (i / HANDLES.length) * 1.7) * (0.92 + rnd() * 0.16), e.perSide);
    const r = rankFor(e, kg);
    return { id: name, name, country, hero, kg, rankLabel: r.label, rankColor: r.tier.color };
  });
  const mine = bestKg(state.history, exerciseId);
  if (mine > 0) {
    const r = rankFor(e, mine);
    rows.push({ id: 'you', name: state.profile.name || 'You', country: 'You', hero: state.profile.hero, kg: mine, rankLabel: r.label, rankColor: r.tier.color, you: true });
  }
  return rows.sort((a, b) => b.kg - a.kg || (a.you ? -1 : 1)).map((r, i) => ({ ...r, position: i + 1 }));
}

export interface Rival {
  id: string;
  name: string;
  hero: HeroId;
  demo: boolean;
  /** How strong they are relative to you. */
  factor: number;
}

export function rivals(state: AppState): Rival[] {
  return [
    { id: 'brother', name: state.profile.rivalName || 'Brother', hero: state.profile.hero === 'brawler' ? 'acrobat' : 'brawler', demo: true, factor: 0.94 },
    { id: 'IronVlk', name: 'IronVlk', hero: 'brawler', demo: true, factor: 1.12 },
    { id: 'Tatranka', name: 'Tatranka', hero: 'acrobat', demo: true, factor: 0.86 },
    { id: 'QuarkKing', name: 'QuarkKing', hero: 'brawler', demo: true, factor: 1.03 },
  ];
}

export function duel(state: AppState, rivalId: string) {
  const rival = rivals(state).find((r) => r.id === rivalId) ?? rivals(state)[0];
  const rnd = seeded(rival.id + new Date().toDateString());
  // Rolling 7 days, so the duel never resets to 0 on a Monday morning.
  const mine = weekStats(state.history, Date.now() - 7 * DAY_MS);
  const jitter = () => rival.factor * (0.88 + rnd() * 0.24);
  const theirs = {
    workouts: Math.max(1, Math.round(Math.max(3, mine.workouts) * jitter())),
    sets: Math.round(Math.max(30, mine.sets) * jitter()),
    volume: Math.round(Math.max(9000, mine.volume) * jitter()),
  };
  const myLevel = level(state.history).level;
  const myStreak = weekStreak(state.history);
  const lifts = allRanked(state.history).slice(0, 6).map(({ id, kg }) => {
    const e = exercise(id);
    const theirKg = roundStep(kg * jitter(), e.perSide);
    return { id, name: e.name, you: kg, them: theirKg, youRank: rankFor(e, kg), themRank: rankFor(e, theirKg) };
  });
  const rows = [
    { label: 'Workouts', you: mine.workouts, them: theirs.workouts },
    { label: 'Sets', you: mine.sets, them: theirs.sets },
    { label: 'Volume (kg)', you: Math.round(mine.volume), them: theirs.volume },
    { label: 'Week streak', you: myStreak, them: Math.max(0, Math.round(myStreak * jitter())) },
    { label: 'Level', you: myLevel, them: Math.max(1, Math.round(myLevel * jitter())) },
  ];
  const score = [...rows, ...lifts.map((l) => ({ you: l.you, them: l.them }))].reduce(
    (acc, r) => ({ you: acc.you + (r.you > r.them ? 1 : 0), them: acc.them + (r.them > r.you ? 1 : 0) }),
    { you: 0, them: 0 },
  );
  return { rival, rows, lifts, score, week: { you: mine, them: theirs } };
}
