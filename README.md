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

Two terminals:

```bash
# 1. the API (Node 24+)
cd server
npm install
npm run setup        # first time only
npm run dev

# 2. the app
npm install
npx expo start       # press w for the browser, or scan the QR code with Expo Go
```

On a computer the web app shows inside a phone frame; on a phone browser it runs full-screen like the app (and can be added to the home screen).

## Accounts and data

You sign up or log in before anything else. Workouts, profile and body weight sync to the server
(workouts wait in a queue if you're offline). Leaderboards and duels use everyone's real logged sets.
Barcode scanning is still to come.

## Code map

Single source of truth: content lives once as data, and types come from it.

| Folder | What |
| --- | --- |
| `src/data` | Heroes, plans, exercises (+ variants), muscles, rank tiers, foods (per 100 g), recipes, nutrients |
| `src/lib` | Logic: workouts & progression, nutrition targets, meal plans & groceries, store, API client and sync |
| `server` | The API (AdonisJS), see `server/README.md` |
| `src/components` | UI kit, body map, lift animation, hero badge, rank badges, tab bar, phone frame |
| `src/app` | Screens (Expo Router, file = route) |
| `src/theme` | Colours, fonts, spacing |

Add a hero: an entry in `src/data/heroes.ts` + a plan in `src/data/plans.ts`. Add an exercise: one line in `src/data/exercises.ts` (its rank thresholds scale from `platinumKg`).
