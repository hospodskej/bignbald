import type { Nutrition } from './nutrients';

/** Values per 100 g (or 100 ml for drinks). European supermarket staples. */
export interface Food {
  id: string;
  name: string;
  aisle: 'Meat & fish' | 'Dairy & eggs' | 'Grains & bread' | 'Tins & jars' | 'Fruit & veg' | 'Pantry' | 'Drinks';
  per100: Partial<Nutrition>;
  /** A typical portion for quick adding. */
  serving: { grams: number; label: string };
  vegan?: boolean;
  vegetarian?: boolean;
}

type Row = [
  id: string, name: string, aisle: Food['aisle'], servingG: number, servingLabel: string, diet: 'meat' | 'veg' | 'vegan',
  kcal: number, protein: number, carbs: number, fat: number, fibre: number, sugar: number, satFat: number, salt: number,
  magnesium: number, potassium: number, calcium: number, iron: number, zinc: number, vitaminD: number, caffeine?: number,
];

// prettier-ignore
const rows: Row[] = [
  ['chicken-breast', 'Chicken breast', 'Meat & fish', 150, '1 fillet', 'meat', 110, 23, 0, 1.5, 0, 0, 0.4, 0.15, 28, 370, 5, 0.4, 0.8, 0.1],
  ['beef-mince-5', 'Beef mince 5% fat', 'Meat & fish', 125, '1/4 pack', 'meat', 125, 21, 0, 5, 0, 0, 2.2, 0.17, 21, 320, 10, 2.2, 5, 0.1],
  ['salmon', 'Salmon fillet', 'Meat & fish', 125, '1 fillet', 'meat', 208, 20, 0, 13, 0, 0, 3, 0.15, 29, 360, 9, 0.3, 0.4, 11],
  ['tuna-can', 'Tuna in water (drained)', 'Tins & jars', 120, '1 tin', 'meat', 116, 26, 0, 1, 0, 0, 0.3, 0.8, 30, 240, 12, 1.3, 0.7, 1.7],
  ['ham', 'Cooked ham', 'Meat & fish', 50, '2 slices', 'meat', 110, 19, 1, 3.5, 0, 1, 1.2, 2.2, 20, 300, 8, 0.8, 1.8, 0.5],
  ['eggs', 'Eggs', 'Dairy & eggs', 60, '1 egg', 'veg', 143, 12.6, 0.7, 9.5, 0, 0.4, 3.1, 0.36, 12, 138, 56, 1.8, 1.3, 2],
  ['skyr', 'Skyr natural', 'Dairy & eggs', 150, '1 small pot', 'veg', 63, 11, 4, 0.2, 0, 4, 0.1, 0.1, 12, 150, 150, 0, 0.5, 0],
  ['quark', 'Low-fat quark', 'Dairy & eggs', 250, '1/2 tub', 'veg', 67, 12, 4, 0.3, 0, 4, 0.2, 0.1, 11, 130, 90, 0.1, 0.5, 0],
  ['cottage-cheese', 'Cottage cheese', 'Dairy & eggs', 200, '1 tub', 'veg', 98, 11, 3.4, 4.3, 0, 2.7, 2.7, 0.9, 8, 104, 83, 0.1, 0.4, 0.1],
  ['milk', 'Milk 1.5%', 'Dairy & eggs', 250, '1 glass', 'veg', 47, 3.4, 4.9, 1.5, 0, 4.9, 1, 0.1, 11, 150, 120, 0, 0.4, 0.1],
  ['edam', 'Edam cheese', 'Dairy & eggs', 30, '2 slices', 'veg', 350, 25, 0, 27, 0, 0, 17, 2, 30, 90, 730, 0.4, 3.8, 0.2],
  ['whey', 'Whey protein', 'Pantry', 30, '1 scoop', 'veg', 380, 78, 6, 6, 0, 4, 3.5, 0.5, 200, 500, 450, 1, 2, 0],
  ['tofu', 'Tofu (firm)', 'Dairy & eggs', 200, '1 block', 'vegan', 144, 15, 2, 8.7, 2, 0.6, 1.3, 0.02, 58, 240, 350, 2.7, 1.6, 0],
  ['oats', 'Rolled oats', 'Grains & bread', 60, '1 bowl', 'vegan', 372, 13, 59, 7, 10, 1, 1.2, 0, 130, 360, 50, 4, 3, 0],
  ['rice', 'Basmati rice (dry)', 'Grains & bread', 75, '1 portion', 'vegan', 350, 8, 78, 0.6, 1.3, 0.1, 0.2, 0, 25, 100, 10, 0.8, 1.2, 0],
  ['pasta', 'Pasta (dry)', 'Grains & bread', 90, '1 portion', 'vegan', 355, 12.5, 71, 1.5, 3, 3, 0.3, 0, 50, 220, 20, 1.5, 1.3, 0],
  ['rye-bread', 'Rye bread', 'Grains & bread', 80, '2 slices', 'vegan', 220, 7, 40, 1.5, 8, 3, 0.3, 1.1, 50, 230, 25, 2.2, 1.4, 0],
  ['potatoes', 'Potatoes', 'Fruit & veg', 250, '3 medium', 'vegan', 77, 2, 17, 0.1, 1.8, 0.8, 0, 0, 23, 420, 12, 0.8, 0.3, 0],
  ['broccoli', 'Broccoli', 'Fruit & veg', 150, '1 portion', 'vegan', 34, 2.8, 4, 0.4, 2.6, 1.7, 0.1, 0.03, 21, 316, 47, 0.7, 0.4, 0],
  ['spinach', 'Spinach', 'Fruit & veg', 80, '1 handful', 'vegan', 23, 2.9, 1.4, 0.4, 2.2, 0.4, 0.1, 0.2, 79, 558, 99, 2.7, 0.5, 0],
  ['pepper', 'Bell pepper', 'Fruit & veg', 150, '1 pepper', 'vegan', 31, 1, 6, 0.3, 2.1, 4.2, 0, 0, 12, 210, 7, 0.4, 0.2, 0],
  ['onion', 'Onion', 'Fruit & veg', 110, '1 onion', 'vegan', 40, 1.1, 9, 0.1, 1.7, 4.2, 0, 0, 10, 146, 23, 0.2, 0.2, 0],
  ['tomatoes-can', 'Chopped tomatoes', 'Tins & jars', 400, '1 tin', 'vegan', 21, 1.2, 3.5, 0.1, 1, 3.5, 0, 0.05, 11, 220, 15, 0.6, 0.2, 0],
  ['kidney-beans', 'Kidney beans (drained)', 'Tins & jars', 240, '1 tin', 'vegan', 100, 7, 13, 0.5, 7, 1, 0.1, 0.3, 35, 320, 30, 1.6, 0.8, 0],
  ['chickpeas', 'Chickpeas (drained)', 'Tins & jars', 240, '1 tin', 'vegan', 120, 7, 15, 2.5, 6, 0.5, 0.3, 0.3, 30, 200, 40, 1.5, 1, 0],
  ['lentils', 'Red lentils (dry)', 'Grains & bread', 75, '1 portion', 'vegan', 350, 25, 50, 1.5, 11, 2, 0.2, 0, 47, 680, 35, 6.5, 3.3, 0],
  ['banana', 'Banana', 'Fruit & veg', 120, '1 banana', 'vegan', 89, 1.1, 23, 0.3, 2.6, 12, 0.1, 0, 27, 358, 5, 0.3, 0.2, 0],
  ['apple', 'Apple', 'Fruit & veg', 180, '1 apple', 'vegan', 52, 0.3, 14, 0.2, 2.4, 10, 0, 0, 5, 107, 6, 0.1, 0, 0],
  ['berries', 'Frozen berries', 'Fruit & veg', 100, '1 cup', 'vegan', 45, 0.8, 9, 0.3, 4, 7, 0, 0, 15, 150, 20, 0.6, 0.2, 0],
  ['peanut-butter', 'Peanut butter', 'Pantry', 20, '1 tbsp', 'vegan', 600, 25, 15, 50, 6, 6, 10, 0.8, 170, 650, 45, 1.9, 2.9, 0],
  ['olive-oil', 'Olive oil', 'Pantry', 10, '1 tbsp', 'vegan', 884, 0, 0, 100, 0, 0, 14, 0, 0, 1, 1, 0.6, 0, 0],
  ['almonds', 'Almonds', 'Pantry', 30, '1 handful', 'vegan', 580, 21, 10, 50, 12, 4, 3.8, 0, 270, 730, 270, 3.7, 3.1, 0],
  ['dark-chocolate', 'Dark chocolate 85%', 'Pantry', 20, '2 squares', 'vegan', 600, 10, 20, 50, 12, 14, 30, 0, 230, 700, 70, 12, 3.3, 0, 80],
  ['coffee', 'Coffee', 'Drinks', 250, '1 mug', 'vegan', 2, 0.1, 0, 0, 0, 0, 0, 0, 3, 50, 2, 0, 0, 0, 40],
  ['espresso', 'Espresso', 'Drinks', 30, '1 shot', 'vegan', 9, 0.1, 1.7, 0.2, 0, 0, 0.1, 0, 80, 115, 2, 0.1, 0, 0, 212],
  ['energy-drink', 'Energy drink', 'Drinks', 250, '1 can', 'vegan', 45, 0, 11, 0, 0, 11, 0, 0.2, 0, 0, 0, 0, 0, 0, 32],
];

export const FOODS: Record<string, Food> = Object.fromEntries(
  rows.map(([id, name, aisle, grams, label, diet, kcal, protein, carbs, fat, fibre, sugar, satFat, salt, magnesium, potassium, calcium, iron, zinc, vitaminD, caffeine = 0]) => [
    id,
    {
      id, name, aisle, serving: { grams, label },
      vegetarian: diet !== 'meat', vegan: diet === 'vegan',
      per100: { kcal, protein, carbs, fat, fibre, sugar, satFat, salt, magnesium, potassium, calcium, iron, zinc, vitaminD, caffeine },
    },
  ]),
);

export const food = (id: string): Food => {
  const f = FOODS[id];
  if (!f) throw new Error(`Unknown food ${id}`);
  return f;
};
