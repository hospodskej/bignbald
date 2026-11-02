# Big N Bald API

AdonisJS 7 (TypeScript) + Lucid ORM. SQLite locally (nothing to install), PostgreSQL in production.

## Run it

Needs **Node 24+**.

```bash
cd server
npm install
npm run setup     # once: creates .env with a secret key and builds the database
npm run dev       # API on http://localhost:3333
npm test          # API tests (separate test database)
```

The app finds the API by itself: the browser uses the same computer, Expo Go uses your PC's Wi-Fi address.
On Windows, allow Node through the firewall when asked, otherwise your phone can't reach it.

## Endpoints (all under `/api/v1`)

| | |
| --- | --- |
| `POST /auth/signup` | email, username, password, profile → token |
| `POST /auth/login` | email, password → token + profile |
| `POST /auth/check` | is this email / username free? |
| `GET/PUT /account/profile` | the app's profile (name, hero, body stats, goal…) |
| `PUT /account/identity` | change username / email |
| `GET/PUT /account/weights` | body weight, one entry per day |
| `GET/POST/DELETE /account/workouts` | finished workouts (upload is retry-safe) |
| `GET/POST /account/food-logs`, `DELETE /account/food-logs/:id` | food log (upload is retry-safe) |
| `GET /account/days`, `PUT /account/days/:date` | eaten meals + water per day |
| `GET/PUT /account/meal-plan` | weekly meal plan + shopping-list ticks |
| `POST /account/logout` | revokes the token |
| `GET /leaderboards/:exerciseId` | top 50 + your position |
| `GET /duels/:username` | you vs them: last 7 days + shared lifts |
| `GET /players?q=` | find players by username |

## Where things live (the AdonisJS way)

| Folder | What |
| --- | --- |
| `start/routes.ts` | every URL and which controller handles it |
| `app/controllers` | one class per resource |
| `app/validators` | input rules (VineJS) |
| `app/models` | database models; columns come from `database/schema.ts` (generated) |
| `database/migrations` | table changes, in order |
| `app/services` | logic shared by controllers (leaderboard / duel maths) |
| `app/shared` | exercises, ranks, heroes, copied from the app by `scripts/sync_shared.mjs` (don't edit here) |
| `tests/functional` | API tests |

Handy generators: `node ace make:controller Name`, `node ace make:model Name -m`, `node ace make:migration name`, `node ace make:validator name`.

## Production

Set `NODE_ENV=production`, `DB_CONNECTION=pg`, `DATABASE_URL=postgres://…`, a fresh `APP_KEY` (`node ace generate:key`), then `npm run build` and `node build/bin/server.js` (run `node ace migration:run --force` on deploy).
