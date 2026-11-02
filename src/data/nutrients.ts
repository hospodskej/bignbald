/**
 * Every nutrient the app tracks. Macros show by default; the rest sit behind
 * "More nutrients". kind: goal = try to reach it, limit = stay under it.
 */
export const NUTRIENTS = {
  kcal: { label: 'Calories', unit: 'kcal', kind: 'goal', macro: true },
  protein: { label: 'Protein', unit: 'g', kind: 'goal', macro: true },
  carbs: { label: 'Carbs', unit: 'g', kind: 'goal', macro: true },
  fat: { label: 'Fat', unit: 'g', kind: 'goal', macro: true },
  fibre: { label: 'Fibre', unit: 'g', kind: 'goal', macro: false },
  magnesium: { label: 'Magnesium', unit: 'mg', kind: 'goal', macro: false },
  potassium: { label: 'Potassium', unit: 'mg', kind: 'goal', macro: false },
  calcium: { label: 'Calcium', unit: 'mg', kind: 'goal', macro: false },
  iron: { label: 'Iron', unit: 'mg', kind: 'goal', macro: false },
  zinc: { label: 'Zinc', unit: 'mg', kind: 'goal', macro: false },
  vitaminD: { label: 'Vitamin D', unit: 'µg', kind: 'goal', macro: false },
  caffeine: { label: 'Caffeine', unit: 'mg', kind: 'limit', macro: false },
  sugar: { label: 'Sugar', unit: 'g', kind: 'limit', macro: false },
  satFat: { label: 'Saturated fat', unit: 'g', kind: 'limit', macro: false },
  salt: { label: 'Salt', unit: 'g', kind: 'limit', macro: false },
} as const;

export type NutrientId = keyof typeof NUTRIENTS;
export type Nutrition = Record<NutrientId, number>;
export const NUTRIENT_IDS = Object.keys(NUTRIENTS) as NutrientId[];
export const EXTRA_NUTRIENTS = NUTRIENT_IDS.filter((id) => !NUTRIENTS[id].macro);

export const zeroNutrition = (): Nutrition =>
  Object.fromEntries(NUTRIENT_IDS.map((id) => [id, 0])) as Nutrition;

export function addNutrition(a: Nutrition, b: Partial<Nutrition>, factor = 1): Nutrition {
  const out = { ...a };
  for (const id of NUTRIENT_IDS) out[id] += (b[id] ?? 0) * factor;
  return out;
}
