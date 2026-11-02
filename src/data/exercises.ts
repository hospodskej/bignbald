import type { Heat } from './muscles';

/** Poses the lift animation knows how to draw (see components/LiftAnimation). */
export type PoseId =
  | 'curl' | 'pressFlat' | 'pressIncline' | 'pressShoulder' | 'lateralRaise' | 'pushdown' | 'overheadExt'
  | 'dip' | 'pulldown' | 'cableRow' | 'bentRow' | 'reverseFly' | 'squat' | 'legPress' | 'rdl'
  | 'legExtension' | 'legCurl' | 'calfRaise' | 'cableCrunch' | 'adductor' | 'jmPress';

export type GearId = 'ezBar' | 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'landmine' | 'smith';

export interface Exercise {
  id: string;
  name: string;
  family: FamilyId;
  gear: GearId;
  pose: PoseId;
  heat: Heat;
  /** Working weight (best set with 5+ reps) that reaches Platinum IV. Other tiers scale from it. */
  platinumKg: number;
  /** Logged per dumbbell / per side. */
  perSide?: boolean;
  /** Lower-body lifts progress in bigger jumps. */
  lower?: boolean;
  /** How taxing a set is, for workout intensity and protein bonus. */
  load: number;
}

/** Families group interchangeable exercises: "any biceps curl" = any exercise in the curl family. */
export const FAMILIES = {
  inclinePress: 'Incline press',
  flatPress: 'Flat press',
  shoulderPress: 'Shoulder press',
  lateralRaise: 'Lateral raise',
  pushdown: 'Triceps pushdown',
  overheadExt: 'Overhead triceps extension',
  dip: 'Dips',
  jmPress: 'JM press',
  latPulldown: 'Lat pulldown',
  cableRow: 'Cable row',
  tbarRow: 'T-bar row',
  reverseFly: 'Reverse fly',
  curl: 'Biceps curl',
  hammerCurl: 'Hammer curl',
  squat: 'Squat / leg press',
  rdl: 'Romanian deadlift',
  legExtension: 'Leg extension',
  legCurl: 'Leg curl',
  calfRaise: 'Calf raise',
  adductor: 'Hip adductor',
  crunch: 'Cable crunch',
} as const;
export type FamilyId = keyof typeof FAMILIES;

// Shared muscle profiles, so variants of one lift stay consistent.
const H = {
  incline: { chestUpper: 1, chestMid: 0.6, chestLower: 0.3, frontDelts: 0.8, tricepsLateral: 0.5, tricepsLong: 0.3, serratus: 0.2 },
  flat: { chestMid: 1, chestLower: 0.8, chestUpper: 0.6, frontDelts: 0.5, tricepsLateral: 0.6, tricepsLong: 0.4 },
  ohp: { frontDelts: 1, sideDelts: 0.6, tricepsLateral: 0.5, tricepsLong: 0.3, traps: 0.3, chestUpper: 0.2 },
  lateral: { sideDelts: 1, frontDelts: 0.3, traps: 0.4, rearDelts: 0.2 },
  pushdown: { tricepsLateral: 1, tricepsLong: 0.6 },
  overhead: { tricepsLong: 1, tricepsLateral: 0.5 },
  dip: { chestLower: 1, tricepsLateral: 0.8, tricepsLong: 0.6, frontDelts: 0.6, chestMid: 0.5 },
  jm: { tricepsLateral: 1, tricepsLong: 0.8, chestMid: 0.3 },
  pulldown: { lats: 1, teres: 0.7, biceps: 0.5, rhomboids: 0.4, rearDelts: 0.3, brachialis: 0.3 },
  row: { rhomboids: 1, lats: 0.8, rearDelts: 0.6, traps: 0.5, biceps: 0.4, teres: 0.5, lowerBack: 0.2 },
  tbar: { rhomboids: 1, lats: 0.9, traps: 0.7, rearDelts: 0.6, lowerBack: 0.5, biceps: 0.4, teres: 0.5 },
  rearFly: { rearDelts: 1, rhomboids: 0.6, traps: 0.4 },
  curl: { biceps: 1, brachialis: 0.6, brachioradialis: 0.3, forearmFlexors: 0.3 },
  hammer: { brachialis: 1, brachioradialis: 0.9, biceps: 0.6, forearmFlexors: 0.4 },
  squat: { rectusFemoris: 1, vastusLateralis: 1, vastusMedialis: 1, gluteMax: 0.8, adductors: 0.6, lowerBack: 0.3, absLower: 0.2 },
  legPress: { vastusLateralis: 1, vastusMedialis: 1, rectusFemoris: 0.8, gluteMax: 0.6, adductors: 0.4 },
  rdl: { bicepsFemoris: 1, semitendinosus: 1, gluteMax: 0.9, lowerBack: 0.7, adductors: 0.4, forearmFlexors: 0.3, traps: 0.2 },
  legExt: { rectusFemoris: 1, vastusLateralis: 0.9, vastusMedialis: 0.9 },
  legCurl: { bicepsFemoris: 1, semitendinosus: 1, gastroMedial: 0.3, gastroLateral: 0.3 },
  calf: { gastroMedial: 1, gastroLateral: 1, soleus: 0.7 },
  calfSeated: { soleus: 1, gastroMedial: 0.5, gastroLateral: 0.5 },
  adductor: { adductors: 1, gluteMed: 0.2 },
  crunch: { absUpper: 1, absLower: 0.8, obliques: 0.5, serratus: 0.3 },
} satisfies Record<string, Heat>;

const LOAD = { bigLower: 1.6, compound: 1.2, isolation: 0.8, small: 0.6 } as const;

type Def = Omit<Exercise, 'id'>;
const defs: Record<string, Def> = {
  // Push
  'incline-barbell-press': { name: 'Incline barbell press', family: 'inclinePress', gear: 'barbell', pose: 'pressIncline', heat: H.incline, platinumKg: 85, load: LOAD.compound },
  'incline-dumbbell-press': { name: 'Incline dumbbell press', family: 'inclinePress', gear: 'dumbbell', pose: 'pressIncline', heat: H.incline, platinumKg: 36, perSide: true, load: LOAD.compound },
  'incline-smith-press': { name: 'Incline Smith press', family: 'inclinePress', gear: 'smith', pose: 'pressIncline', heat: H.incline, platinumKg: 90, load: LOAD.compound },
  'incline-machine-press': { name: 'Incline machine press', family: 'inclinePress', gear: 'machine', pose: 'pressIncline', heat: H.incline, platinumKg: 100, load: LOAD.compound },
  'bench-press': { name: 'Barbell bench press', family: 'flatPress', gear: 'barbell', pose: 'pressFlat', heat: H.flat, platinumKg: 100, load: LOAD.compound },
  'dumbbell-bench-press': { name: 'Dumbbell bench press', family: 'flatPress', gear: 'dumbbell', pose: 'pressFlat', heat: H.flat, platinumKg: 40, perSide: true, load: LOAD.compound },
  'machine-chest-press': { name: 'Machine chest press', family: 'flatPress', gear: 'machine', pose: 'pressFlat', heat: H.flat, platinumKg: 110, load: LOAD.compound },
  'smith-bench-press': { name: 'Smith bench press', family: 'flatPress', gear: 'smith', pose: 'pressFlat', heat: H.flat, platinumKg: 105, load: LOAD.compound },
  'dumbbell-shoulder-press': { name: 'Dumbbell shoulder press', family: 'shoulderPress', gear: 'dumbbell', pose: 'pressShoulder', heat: H.ohp, platinumKg: 30, perSide: true, load: LOAD.compound },
  'machine-shoulder-press': { name: 'Machine shoulder press', family: 'shoulderPress', gear: 'machine', pose: 'pressShoulder', heat: H.ohp, platinumKg: 70, load: LOAD.compound },
  'barbell-overhead-press': { name: 'Barbell overhead press', family: 'shoulderPress', gear: 'barbell', pose: 'pressShoulder', heat: H.ohp, platinumKg: 65, load: LOAD.compound },
  'dumbbell-lateral-raise': { name: 'Dumbbell lateral raise', family: 'lateralRaise', gear: 'dumbbell', pose: 'lateralRaise', heat: H.lateral, platinumKg: 15, perSide: true, load: LOAD.small },
  'cable-lateral-raise': { name: 'Cable lateral raise', family: 'lateralRaise', gear: 'cable', pose: 'lateralRaise', heat: H.lateral, platinumKg: 12.5, perSide: true, load: LOAD.small },
  'machine-lateral-raise': { name: 'Machine lateral raise', family: 'lateralRaise', gear: 'machine', pose: 'lateralRaise', heat: H.lateral, platinumKg: 45, load: LOAD.small },
  'rope-pushdown': { name: 'Rope pushdown', family: 'pushdown', gear: 'cable', pose: 'pushdown', heat: H.pushdown, platinumKg: 45, load: LOAD.isolation },
  'bar-pushdown': { name: 'Straight-bar pushdown', family: 'pushdown', gear: 'cable', pose: 'pushdown', heat: H.pushdown, platinumKg: 55, load: LOAD.isolation },
  'cable-overhead-extension': { name: 'Cable overhead extension', family: 'overheadExt', gear: 'cable', pose: 'overheadExt', heat: H.overhead, platinumKg: 40, load: LOAD.isolation },
  'dumbbell-overhead-extension': { name: 'Dumbbell overhead extension', family: 'overheadExt', gear: 'dumbbell', pose: 'overheadExt', heat: H.overhead, platinumKg: 40, load: LOAD.isolation },
  'weighted-dip': { name: 'Dips (added weight)', family: 'dip', gear: 'bodyweight', pose: 'dip', heat: H.dip, platinumKg: 40, load: LOAD.compound },
  'jm-press': { name: 'JM press', family: 'jmPress', gear: 'barbell', pose: 'jmPress', heat: H.jm, platinumKg: 70, load: LOAD.isolation },
  'close-grip-bench': { name: 'Close-grip bench press', family: 'jmPress', gear: 'barbell', pose: 'pressFlat', heat: H.jm, platinumKg: 95, load: LOAD.compound },
  // Pull
  'lat-pulldown-wide': { name: 'Lat pulldown (wide)', family: 'latPulldown', gear: 'cable', pose: 'pulldown', heat: H.pulldown, platinumKg: 85, load: LOAD.compound },
  'lat-pulldown-close': { name: 'Lat pulldown (close grip)', family: 'latPulldown', gear: 'cable', pose: 'pulldown', heat: H.pulldown, platinumKg: 85, load: LOAD.compound },
  'lat-pulldown-neutral': { name: 'Lat pulldown (neutral)', family: 'latPulldown', gear: 'cable', pose: 'pulldown', heat: H.pulldown, platinumKg: 85, load: LOAD.compound },
  'underhand-cable-row': { name: 'Underhand cable row', family: 'cableRow', gear: 'cable', pose: 'cableRow', heat: H.row, platinumKg: 80, load: LOAD.compound },
  'close-grip-cable-row': { name: 'Close-grip cable row', family: 'cableRow', gear: 'cable', pose: 'cableRow', heat: H.row, platinumKg: 85, load: LOAD.compound },
  'wide-cable-row': { name: 'Wide-grip cable row', family: 'cableRow', gear: 'cable', pose: 'cableRow', heat: H.row, platinumKg: 75, load: LOAD.compound },
  't-bar-row': { name: 'T-bar row', family: 'tbarRow', gear: 'landmine', pose: 'bentRow', heat: H.tbar, platinumKg: 80, load: LOAD.compound },
  'chest-supported-row': { name: 'Chest-supported row', family: 'tbarRow', gear: 'machine', pose: 'bentRow', heat: H.tbar, platinumKg: 90, load: LOAD.compound },
  'barbell-row': { name: 'Barbell row', family: 'tbarRow', gear: 'barbell', pose: 'bentRow', heat: H.tbar, platinumKg: 90, load: LOAD.compound },
  'machine-reverse-fly': { name: 'Machine reverse fly', family: 'reverseFly', gear: 'machine', pose: 'reverseFly', heat: H.rearFly, platinumKg: 55, load: LOAD.small },
  'cable-reverse-fly': { name: 'Cable reverse fly', family: 'reverseFly', gear: 'cable', pose: 'reverseFly', heat: H.rearFly, platinumKg: 15, perSide: true, load: LOAD.small },
  'dumbbell-reverse-fly': { name: 'Dumbbell reverse fly', family: 'reverseFly', gear: 'dumbbell', pose: 'reverseFly', heat: H.rearFly, platinumKg: 14, perSide: true, load: LOAD.small },
  'ez-bar-curl': { name: 'EZ-bar curl', family: 'curl', gear: 'ezBar', pose: 'curl', heat: H.curl, platinumKg: 30, load: LOAD.isolation },
  'barbell-curl': { name: 'Barbell curl', family: 'curl', gear: 'barbell', pose: 'curl', heat: H.curl, platinumKg: 40, load: LOAD.isolation },
  'dumbbell-curl': { name: 'Dumbbell curl', family: 'curl', gear: 'dumbbell', pose: 'curl', heat: H.curl, platinumKg: 20, perSide: true, load: LOAD.isolation },
  'incline-dumbbell-curl': { name: 'Incline dumbbell curl', family: 'curl', gear: 'dumbbell', pose: 'curl', heat: H.curl, platinumKg: 16, perSide: true, load: LOAD.isolation },
  'preacher-curl': { name: 'Preacher curl', family: 'curl', gear: 'ezBar', pose: 'curl', heat: H.curl, platinumKg: 32.5, load: LOAD.isolation },
  'cable-curl': { name: 'Cable curl', family: 'curl', gear: 'cable', pose: 'curl', heat: H.curl, platinumKg: 35, load: LOAD.isolation },
  'dumbbell-hammer-curl': { name: 'Dumbbell hammer curl', family: 'hammerCurl', gear: 'dumbbell', pose: 'curl', heat: H.hammer, platinumKg: 24, perSide: true, load: LOAD.isolation },
  'rope-hammer-curl': { name: 'Rope hammer curl', family: 'hammerCurl', gear: 'cable', pose: 'curl', heat: H.hammer, platinumKg: 40, load: LOAD.isolation },
  // Legs + abs
  'hack-squat': { name: 'Hack squat', family: 'squat', gear: 'machine', pose: 'squat', heat: H.squat, platinumKg: 160, lower: true, load: LOAD.bigLower },
  'back-squat': { name: 'Barbell back squat', family: 'squat', gear: 'barbell', pose: 'squat', heat: H.squat, platinumKg: 140, lower: true, load: LOAD.bigLower },
  'smith-squat': { name: 'Smith squat', family: 'squat', gear: 'smith', pose: 'squat', heat: H.squat, platinumKg: 140, lower: true, load: LOAD.bigLower },
  'leg-press': { name: 'Leg press', family: 'squat', gear: 'machine', pose: 'legPress', heat: H.legPress, platinumKg: 260, lower: true, load: LOAD.bigLower },
  'barbell-rdl': { name: 'Barbell RDL', family: 'rdl', gear: 'barbell', pose: 'rdl', heat: H.rdl, platinumKg: 140, lower: true, load: LOAD.bigLower },
  'dumbbell-rdl': { name: 'Dumbbell RDL', family: 'rdl', gear: 'dumbbell', pose: 'rdl', heat: H.rdl, platinumKg: 60, perSide: true, lower: true, load: LOAD.bigLower },
  'leg-extension': { name: 'Leg extension', family: 'legExtension', gear: 'machine', pose: 'legExtension', heat: H.legExt, platinumKg: 90, lower: true, load: LOAD.isolation },
  'lying-leg-curl': { name: 'Lying leg curl', family: 'legCurl', gear: 'machine', pose: 'legCurl', heat: H.legCurl, platinumKg: 70, lower: true, load: LOAD.isolation },
  'seated-leg-curl': { name: 'Seated leg curl', family: 'legCurl', gear: 'machine', pose: 'legCurl', heat: H.legCurl, platinumKg: 80, lower: true, load: LOAD.isolation },
  'standing-calf-raise': { name: 'Standing calf raise', family: 'calfRaise', gear: 'machine', pose: 'calfRaise', heat: H.calf, platinumKg: 120, lower: true, load: LOAD.small },
  'seated-calf-raise': { name: 'Seated calf raise', family: 'calfRaise', gear: 'machine', pose: 'calfRaise', heat: H.calfSeated, platinumKg: 80, lower: true, load: LOAD.small },
  'hip-adductor': { name: 'Hip adductor machine', family: 'adductor', gear: 'machine', pose: 'adductor', heat: H.adductor, platinumKg: 100, lower: true, load: LOAD.isolation },
  'cable-crunch': { name: 'Cable crunch', family: 'crunch', gear: 'cable', pose: 'cableCrunch', heat: H.crunch, platinumKg: 70, load: LOAD.small },
  'machine-crunch': { name: 'Crunch machine', family: 'crunch', gear: 'machine', pose: 'cableCrunch', heat: H.crunch, platinumKg: 80, load: LOAD.small },
};

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  Object.entries(defs).map(([id, d]) => [id, { id, ...d }]),
);
export type ExerciseId = keyof typeof defs;

export const exercise = (id: string): Exercise => {
  const e = EXERCISES[id];
  if (!e) throw new Error(`Unknown exercise ${id}`);
  return e;
};

/** All variants you can swap to for a family. */
export const variantsOf = (family: FamilyId): Exercise[] =>
  Object.values(EXERCISES).filter((e) => e.family === family);

/** Weight jump for "time for an upgrade". */
export const incrementFor = (e: Exercise): number => (e.lower ? 5 : e.perSide ? 2 : 2.5);
