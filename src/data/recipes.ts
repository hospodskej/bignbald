import { food } from './foods';
import { addNutrition, Nutrition, zeroNutrition } from './nutrients';

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export const SLOT_LABEL: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export const DIET_STYLES = {
  balanced: { label: 'Balanced', blurb: 'A bit of everything. Easy to stick to.', fatPct: 0.3, proteinBoost: 1, carbCap: null as number | null },
  highProtein: { label: 'High-protein', blurb: 'Extra protein for building muscle.', fatPct: 0.27, proteinBoost: 1.1, carbCap: null as number | null },
  mediterranean: { label: 'Mediterranean', blurb: 'Fish, olive oil, veg and grains.', fatPct: 0.35, proteinBoost: 1, carbCap: null as number | null },
  vegetarian: { label: 'Vegetarian', blurb: 'No meat or fish. Eggs and dairy are in.', fatPct: 0.3, proteinBoost: 1, carbCap: null as number | null },
  vegan: { label: 'Vegan', blurb: 'Fully plant-based.', fatPct: 0.3, proteinBoost: 1, carbCap: null as number | null },
  keto: { label: 'Keto', blurb: 'Very low carb, high fat. Max 30 g carbs a day.', fatPct: 0.7, proteinBoost: 1, carbCap: 30 as number | null },
} as const;
export type DietStyle = keyof typeof DIET_STYLES;

export interface Recipe {
  id: string;
  name: string;
  kind: 'breakfast' | 'main' | 'snack';
  /** Servings one batch makes: the meal-prep unit. */
  servings: number;
  /** Grams of each food for the whole batch. */
  ingredients: [foodId: string, grams: number][];
  styles: DietStyle[];
  steps: string;
}

const ALL: DietStyle[] = ['balanced', 'highProtein'];

export const RECIPES: Recipe[] = [
  { id: 'skyr-bowl', name: 'Skyr bowl with oats and berries', kind: 'breakfast', servings: 1, ingredients: [['skyr', 250], ['oats', 50], ['berries', 100]], styles: [...ALL, 'vegetarian'], steps: 'Layer skyr, oats and berries in a bowl.' },
  { id: 'overnight-oats', name: 'Protein overnight oats', kind: 'breakfast', servings: 4, ingredients: [['oats', 320], ['milk', 600], ['whey', 120], ['berries', 300], ['peanut-butter', 60]], styles: [...ALL, 'vegetarian'], steps: 'Mix everything, split into 4 jars, fridge overnight. Keeps 4 days.' },
  { id: 'eggs-rye', name: 'Eggs, spinach and rye toast', kind: 'breakfast', servings: 1, ingredients: [['eggs', 180], ['rye-bread', 80], ['spinach', 50], ['edam', 30]], styles: [...ALL, 'vegetarian', 'mediterranean'], steps: 'Scramble 3 eggs with spinach, serve on toasted rye with cheese.' },
  { id: 'tofu-scramble', name: 'Tofu scramble on rye', kind: 'breakfast', servings: 1, ingredients: [['tofu', 200], ['rye-bread', 80], ['pepper', 100], ['olive-oil', 10]], styles: ['vegan', 'vegetarian', 'mediterranean'], steps: 'Crumble tofu into a hot pan with oil and peppers. Serve on rye.' },
  { id: 'keto-eggs', name: 'Cheesy spinach omelette', kind: 'breakfast', servings: 1, ingredients: [['eggs', 180], ['spinach', 80], ['edam', 40], ['olive-oil', 10]], styles: ['keto'], steps: 'Whisk eggs, cook in oil, fill with spinach and cheese.' },
  { id: 'chicken-rice', name: 'Chicken, rice and broccoli', kind: 'main', servings: 5, ingredients: [['chicken-breast', 1000], ['rice', 400], ['broccoli', 750], ['olive-oil', 30]], styles: [...ALL], steps: 'Bake chicken at 200 °C for 22 min. Cook rice, steam broccoli, split into 5 boxes.' },
  { id: 'beef-chili', name: 'Beef and bean chili', kind: 'main', servings: 6, ingredients: [['beef-mince-5', 1000], ['kidney-beans', 480], ['tomatoes-can', 800], ['onion', 300], ['rice', 400]], styles: [...ALL], steps: 'Brown the beef with onion, add beans and tomatoes, simmer 45 min. Serve with rice. Freezes well.' },
  { id: 'salmon-potatoes', name: 'Salmon, potatoes and spinach', kind: 'main', servings: 2, ingredients: [['salmon', 250], ['potatoes', 600], ['spinach', 200], ['olive-oil', 20]], styles: [...ALL, 'mediterranean'], steps: 'Roast potatoes 30 min, add salmon for the last 12 min, wilt spinach.' },
  { id: 'tuna-pasta', name: 'Tuna tomato pasta', kind: 'main', servings: 4, ingredients: [['pasta', 400], ['tuna-can', 480], ['tomatoes-can', 400], ['onion', 150], ['olive-oil', 30]], styles: [...ALL, 'mediterranean'], steps: 'Cook pasta. Soften onion in oil, add tomatoes and tuna, toss.' },
  { id: 'lentil-curry', name: 'Lentil and chickpea curry', kind: 'main', servings: 4, ingredients: [['lentils', 300], ['chickpeas', 480], ['tomatoes-can', 400], ['onion', 200], ['rice', 300], ['spinach', 200], ['olive-oil', 20]], styles: ['vegan', 'vegetarian', 'mediterranean', 'balanced'], steps: 'Fry onion, add lentils, chickpeas, tomatoes and water. Simmer 25 min, stir in spinach. Serve with rice.' },
  { id: 'veggie-chili', name: 'Three-bean veggie chili', kind: 'main', servings: 4, ingredients: [['kidney-beans', 480], ['chickpeas', 240], ['tofu', 400], ['tomatoes-can', 800], ['pepper', 300], ['rice', 300]], styles: ['vegan', 'vegetarian'], steps: 'Crumble tofu, fry with peppers, add beans and tomatoes, simmer 30 min.' },
  { id: 'keto-chicken', name: 'Creamy chicken and broccoli bake', kind: 'main', servings: 4, ingredients: [['chicken-breast', 800], ['broccoli', 600], ['edam', 160], ['spinach', 200], ['olive-oil', 40]], styles: ['keto'], steps: 'Layer chicken, broccoli and spinach, top with cheese, bake 30 min at 190 °C.' },
  { id: 'keto-salmon', name: 'Salmon with buttered greens', kind: 'main', servings: 2, ingredients: [['salmon', 300], ['broccoli', 300], ['spinach', 150], ['olive-oil', 30]], styles: ['keto', 'mediterranean'], steps: 'Pan-fry salmon, toss greens in oil.' },
  { id: 'quark-shake', name: 'Quark with whey and banana', kind: 'snack', servings: 1, ingredients: [['quark', 250], ['whey', 30], ['banana', 120]], styles: [...ALL, 'vegetarian'], steps: 'Stir whey into quark, slice banana on top.' },
  { id: 'protein-shake', name: 'Protein shake', kind: 'snack', servings: 1, ingredients: [['whey', 40], ['milk', 300]], styles: [...ALL, 'vegetarian'], steps: 'Shake it.' },
  { id: 'nuts-choc', name: 'Almonds and dark chocolate', kind: 'snack', servings: 1, ingredients: [['almonds', 40], ['dark-chocolate', 20]], styles: ['vegan', 'vegetarian', 'keto', 'mediterranean'], steps: 'A handful of almonds and two squares.' },
  { id: 'cottage-apple', name: 'Cottage cheese and apple', kind: 'snack', servings: 1, ingredients: [['cottage-cheese', 200], ['apple', 180]], styles: [...ALL, 'vegetarian', 'mediterranean'], steps: 'Slice the apple, eat with the cottage cheese.' },
];

export const recipe = (id: string): Recipe => {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown recipe ${id}`);
  return r;
};

/** Nutrition for one serving, computed from the ingredients (single source of truth). */
export function servingNutrition(r: Recipe): Nutrition {
  let n = zeroNutrition();
  for (const [foodId, grams] of r.ingredients) n = addNutrition(n, food(foodId).per100, grams / 100 / r.servings);
  return n;
}

export const recipesFor = (style: DietStyle, kind: Recipe['kind']) =>
  RECIPES.filter((r) => r.kind === kind && r.styles.includes(style));
