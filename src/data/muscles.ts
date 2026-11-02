/**
 * Every muscle the body map can light up. Exercises reference these ids, and
 * a plan can also target a whole group (e.g. "chest" lights all three heads).
 */
export const MUSCLES = {
  neck: { label: 'Neck', group: 'neck' },
  traps: { label: 'Upper traps', group: 'upperBack' },
  rhomboids: { label: 'Rhomboids / mid traps', group: 'upperBack' },
  teres: { label: 'Teres major', group: 'upperBack' },
  lats: { label: 'Lats', group: 'lats' },
  lowerBack: { label: 'Lower back', group: 'lowerBack' },
  frontDelts: { label: 'Front delts', group: 'shoulders' },
  sideDelts: { label: 'Side delts', group: 'shoulders' },
  rearDelts: { label: 'Rear delts', group: 'shoulders' },
  chestUpper: { label: 'Upper chest', group: 'chest' },
  chestMid: { label: 'Mid chest', group: 'chest' },
  chestLower: { label: 'Lower chest', group: 'chest' },
  serratus: { label: 'Serratus', group: 'core' },
  biceps: { label: 'Biceps', group: 'biceps' },
  brachialis: { label: 'Brachialis', group: 'biceps' },
  brachioradialis: { label: 'Brachioradialis', group: 'forearms' },
  forearmFlexors: { label: 'Forearm flexors', group: 'forearms' },
  forearmExtensors: { label: 'Forearm extensors', group: 'forearms' },
  tricepsLong: { label: 'Triceps long head', group: 'triceps' },
  tricepsLateral: { label: 'Triceps lateral head', group: 'triceps' },
  absUpper: { label: 'Upper abs', group: 'abs' },
  absLower: { label: 'Lower abs', group: 'abs' },
  obliques: { label: 'Obliques', group: 'core' },
  gluteMax: { label: 'Glute max', group: 'glutes' },
  gluteMed: { label: 'Glute medius', group: 'glutes' },
  abductors: { label: 'Hip abductors', group: 'glutes' },
  adductors: { label: 'Adductors', group: 'adductors' },
  rectusFemoris: { label: 'Rectus femoris', group: 'quads' },
  vastusLateralis: { label: 'Outer quad', group: 'quads' },
  vastusMedialis: { label: 'Inner quad (teardrop)', group: 'quads' },
  bicepsFemoris: { label: 'Outer hamstring', group: 'hamstrings' },
  semitendinosus: { label: 'Inner hamstring', group: 'hamstrings' },
  gastroLateral: { label: 'Outer calf', group: 'calves' },
  gastroMedial: { label: 'Inner calf', group: 'calves' },
  soleus: { label: 'Soleus', group: 'calves' },
  tibialis: { label: 'Tibialis', group: 'calves' },
} as const;

export type MuscleId = keyof typeof MUSCLES;
export type MuscleGroup = (typeof MUSCLES)[MuscleId]['group'];
/** How hard something works each muscle, 0..1. */
export type Heat = Partial<Record<MuscleId, number>>;

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[];

/** Merge several heats (e.g. all exercises in a day), weighting each by sets. */
export function combineHeat(parts: { heat: Heat; weight: number }[]): Heat {
  const sum: Partial<Record<MuscleId, number>> = {};
  for (const { heat, weight } of parts)
    for (const id of Object.keys(heat) as MuscleId[]) sum[id] = (sum[id] ?? 0) + (heat[id] ?? 0) * weight;
  const max = Math.max(0.0001, ...Object.values(sum).map((v) => v ?? 0));
  const out: Heat = {};
  for (const id of Object.keys(sum) as MuscleId[]) out[id] = (sum[id] ?? 0) / max;
  return out;
}

/** The muscles a heat hits hardest, for captions like "Hits most: upper chest". */
export function topMuscles(heat: Heat, n = 3): string[] {
  return (Object.entries(heat) as [MuscleId, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => MUSCLES[id].label.toLowerCase());
}
