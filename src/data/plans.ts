import type { FamilyId } from './exercises';
import type { HeroId } from './heroes';

export interface Slot {
  family: FamilyId;
  /** Default exercise for this slot; the user can swap to any variant in the family. */
  exercise: string;
  sets: number;
  /** The plan says "any X": the picker opens when you start this slot. */
  any?: boolean;
}

export interface PlanDay {
  id: string;
  name: string;
  short: string;
  slots: Slot[];
}

export interface Plan {
  hero: HeroId;
  days: PlanDay[];
  /** Fixed = one day after another. Rotation = days cycle, rest when you need it. */
  schedule: 'fixed' | 'rotation';
  minPerWeek: number;
}

const s = (family: FamilyId, exercise: string, sets: number, any = false): Slot => ({ family, exercise, sets, any });

const legsAbs: PlanDay['slots'] = [
  s('squat', 'hack-squat', 3),
  s('rdl', 'barbell-rdl', 3),
  s('legExtension', 'leg-extension', 3),
  s('legCurl', 'lying-leg-curl', 3),
  s('calfRaise', 'standing-calf-raise', 3),
  s('crunch', 'cable-crunch', 3),
];

export const PLANS: Record<HeroId, Plan> = {
  brawler: {
    hero: 'brawler',
    schedule: 'fixed',
    minPerWeek: 3,
    days: [
      {
        id: 'push', name: 'Push', short: 'Push',
        slots: [
          s('inclinePress', 'incline-barbell-press', 3),
          s('flatPress', 'bench-press', 3),
          s('shoulderPress', 'dumbbell-shoulder-press', 2),
          s('lateralRaise', 'dumbbell-lateral-raise', 3),
          s('pushdown', 'rope-pushdown', 3),
        ],
      },
      {
        id: 'pull', name: 'Pull', short: 'Pull',
        slots: [
          s('latPulldown', 'lat-pulldown-wide', 3),
          s('cableRow', 'underhand-cable-row', 3),
          s('tbarRow', 't-bar-row', 3),
          s('curl', 'ez-bar-curl', 3, true),
          s('hammerCurl', 'dumbbell-hammer-curl', 3),
        ],
      },
      { id: 'legs-1', name: 'Legs + Abs', short: 'Legs', slots: legsAbs },
      {
        id: 'upper', name: 'Upper', short: 'Upper',
        slots: [
          s('inclinePress', 'incline-barbell-press', 3),
          s('flatPress', 'bench-press', 2),
          s('lateralRaise', 'dumbbell-lateral-raise', 4),
          s('overheadExt', 'cable-overhead-extension', 3),
          s('dip', 'weighted-dip', 3),
        ],
      },
      { id: 'legs-2', name: 'Legs + Abs', short: 'Legs', slots: legsAbs },
      {
        id: 'pull-arms', name: 'Pull + Arms', short: 'Arms',
        slots: [
          s('latPulldown', 'lat-pulldown-wide', 3),
          s('cableRow', 'close-grip-cable-row', 3),
          s('reverseFly', 'machine-reverse-fly', 2),
          s('curl', 'ez-bar-curl', 3),
          s('hammerCurl', 'dumbbell-hammer-curl', 2),
          s('pushdown', 'rope-pushdown', 3),
        ],
      },
    ],
  },
  acrobat: {
    hero: 'acrobat',
    schedule: 'rotation',
    minPerWeek: 3,
    days: [
      {
        id: 'upper-a', name: 'Upper A', short: 'Upper A',
        slots: [
          s('inclinePress', 'incline-dumbbell-press', 3),
          s('flatPress', 'bench-press', 2),
          s('tbarRow', 't-bar-row', 3),
          s('latPulldown', 'lat-pulldown-wide', 3),
          s('curl', 'ez-bar-curl', 3),
          s('lateralRaise', 'dumbbell-lateral-raise', 4),
          s('jmPress', 'jm-press', 3),
          s('cableRow', 'close-grip-cable-row', 3),
        ],
      },
      {
        id: 'lower', name: 'Legs', short: 'Legs',
        slots: [
          s('squat', 'hack-squat', 3, true),
          s('rdl', 'barbell-rdl', 3),
          s('legExtension', 'leg-extension', 3),
          s('legCurl', 'lying-leg-curl', 3),
          s('calfRaise', 'standing-calf-raise', 3),
          s('adductor', 'hip-adductor', 3),
          s('crunch', 'cable-crunch', 3),
        ],
      },
      {
        id: 'upper-b', name: 'Upper B', short: 'Upper B',
        slots: [
          s('inclinePress', 'incline-dumbbell-press', 3),
          s('shoulderPress', 'machine-shoulder-press', 2),
          s('curl', 'ez-bar-curl', 3),
          s('hammerCurl', 'dumbbell-hammer-curl', 2),
          s('pushdown', 'rope-pushdown', 3),
          s('overheadExt', 'cable-overhead-extension', 3),
          s('latPulldown', 'lat-pulldown-wide', 3),
          s('lateralRaise', 'dumbbell-lateral-raise', 4),
          s('tbarRow', 't-bar-row', 3),
        ],
      },
    ],
  },
};

export const planDay = (hero: HeroId, dayId: string): PlanDay => {
  const d = PLANS[hero].days.find((x) => x.id === dayId);
  if (!d) throw new Error(`Unknown day ${hero}/${dayId}`);
  return d;
};
export const slotKey = (hero: HeroId, dayId: string, i: number) => `${hero}:${dayId}:${i}`;
export const dayNumber = (hero: HeroId, dayId: string) => PLANS[hero].days.findIndex((d) => d.id === dayId) + 1;
