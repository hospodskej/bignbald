# Big N Bald

A free lifting + diet app for iPhone, Android and web, built with Expo (React Native) and TypeScript.

- **Heroes = training plans.** The Brawler (6-day split) and the Acrobat (Upper A / Legs / Upper B rotation). Your avatar is your hero's emblem.
- **Ranks for every lift.** Fixed weight thresholds per exercise, Iron → Champion with divisions IV–I. A rank-up screen fires when you climb.
- **Progression.** 12+ reps on your first set at the same weight, two sessions in a row → "time for an upgrade". Under 5 reps → ease off.
- **Swap anything.** Every exercise can be swapped for a variation; "any biceps curl" style slots open the picker. Your choice is remembered.
- **Muscle map.** Anatomical front/back map with ~35 muscles; redder = worked harder. Tap a muscle to see its name.
- **Lift animations.** A jointed figure with real proportions and the right equipment for each lift, working muscles lit in your hero colour.
- **Diet tied to training.** Calories and macros from your profile and goal (Mifflin-St Jeor, or Katch-McArdle when you give body fat / lean mass). Hard training days add protein and carbs. Extra nutrients (caffeine, magnesium, fibre, salt…) behind "More nutrients".
- **Meal prep.** Weekly plan by diet style (balanced, high-protein, Mediterranean, vegetarian, vegan, keto), prep batches and a shopping list of European staples.
- **Rankings.** Duels (you vs a rival over the last 7 days), global leaderboard per lift, and all your ranks.

## Run it

```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go
npm run build:web       # static web build in dist/
```

On a wide screen the web app renders inside a phone frame, so it looks exactly like the mobile app.

## What is demo data (for now)

There is no backend yet. Everything you log is saved on your device. The global leaderboard players and your rivals' stats are generated demo data until accounts and the server exist. Barcode scanning is planned for the camera build + food database.

## Code map

Single source of truth: content lives once as data, and types come from it.

| Folder | What |
| --- | --- |
| `src/data` | Heroes, plans, exercises (+ variants), muscles, rank tiers, foods (per 100 g), recipes, nutrients |
| `src/lib` | Pure logic: workouts & progression, nutrition targets, meal plans & groceries, demo players, store |
| `src/components` | UI kit, body map, lift animation, hero badge, rank badges, tab bar, phone frame |
| `src/app` | Screens (Expo Router, file = route) |
| `src/theme` | Colours, fonts, spacing |

Add a hero: an entry in `src/data/heroes.ts` + a plan in `src/data/plans.ts`. Add an exercise: one line in `src/data/exercises.ts` (its rank thresholds scale from `platinumKg`).
