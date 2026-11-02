import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { EXERCISES } from '../../../src/data/exercises';
import { rankFor } from '../../../src/data/ranks';
import { type AuthEnv, requireAuth } from '../auth';
import type { Db } from '../db/client';
import { profiles, sets, users, workouts } from '../db/schema';

const MIN_REPS = 5;
const WEEK_MS = 7 * 86_400_000;

/** Leaderboards and duels, computed from everyone's real logged sets. */
export function competeRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  r.use('*', requireAuth);

  /** Best weight per user (sets with 5+ reps), highest first. */
  const bests = (exerciseId: string) =>
    db.select({ userId: users.id, username: users.username, hero: profiles.hero, kg: sql<number>`max(${sets.kg})`.as('kg') })
      .from(sets)
      .innerJoin(users, eq(users.id, sets.userId))
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(sets.exerciseId, exerciseId), eq(sets.done, true), gte(sets.reps, MIN_REPS)))
      .groupBy(users.id, users.username, profiles.hero)
      .orderBy(desc(sql`max(${sets.kg})`));

  r.get('/leaderboard/:exerciseId', async (c) => {
    const e = EXERCISES[c.req.param('exerciseId')];
    if (!e) throw new HTTPException(404, { message: 'Unknown exercise' });
    const me = c.get('userId');
    const rows = (await bests(e.id)).map((row, i) => {
      const rank = rankFor(e, Number(row.kg));
      return { position: i + 1, username: row.username, hero: row.hero, kg: Number(row.kg), rankLabel: rank.label, rankColor: rank.tier.color, you: row.userId === me };
    });
    const top = rows.slice(0, 50);
    const mine = rows.find((x) => x.you);
    return c.json({ total: rows.length, rows: top, me: mine && !top.includes(mine) ? mine : null });
  });

  async function summary(userId: string) {
    const since = new Date(Date.now() - WEEK_MS);
    const [week] = await db
      .select({
        workouts: sql<number>`count(distinct ${workouts.id})`,
        sets: sql<number>`count(${sets.id}) filter (where ${sets.done})`,
        volume: sql<number>`coalesce(sum(${sets.kg} * ${sets.reps}) filter (where ${sets.done}), 0)`,
      })
      .from(workouts)
      .leftJoin(sets, eq(sets.workoutId, workouts.id))
      .where(and(eq(workouts.userId, userId), gte(workouts.finishedAt, since)));
    const best = await db
      .select({ exerciseId: sets.exerciseId, kg: sql<number>`max(${sets.kg})` })
      .from(sets)
      .where(and(eq(sets.userId, userId), eq(sets.done, true), gte(sets.reps, MIN_REPS)))
      .groupBy(sets.exerciseId);
    return {
      week: { workouts: Number(week?.workouts ?? 0), sets: Number(week?.sets ?? 0), volume: Math.round(Number(week?.volume ?? 0)) },
      best: Object.fromEntries(best.map((b) => [b.exerciseId, Number(b.kg)])) as Record<string, number>,
    };
  }

  /** You vs another user: last 7 days plus every lift you've both logged. */
  r.get('/duel/:username', async (c) => {
    const [them] = await db.select({ id: users.id, username: users.username, hero: profiles.hero })
      .from(users).innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.username, c.req.param('username').toLowerCase()));
    if (!them) throw new HTTPException(404, { message: 'No player with that username' });
    const [a, b] = await Promise.all([summary(c.get('userId')), summary(them.id)]);
    const rows = [
      { label: 'Workouts', you: a.week.workouts, them: b.week.workouts },
      { label: 'Sets', you: a.week.sets, them: b.week.sets },
      { label: 'Volume (kg)', you: a.week.volume, them: b.week.volume },
    ];
    const lifts = Object.keys(a.best).filter((id) => id in b.best && id in EXERCISES).map((id) => {
      const e = EXERCISES[id];
      const youRank = rankFor(e, a.best[id]), themRank = rankFor(e, b.best[id]);
      return { id, name: e.name, you: a.best[id], them: b.best[id], youRank: youRank.label, youColor: youRank.tier.color, themRank: themRank.label, themColor: themRank.tier.color };
    });
    const score = [...rows, ...lifts].reduce((s, x) => ({ you: s.you + (x.you > x.them ? 1 : 0), them: s.them + (x.them > x.you ? 1 : 0) }), { you: 0, them: 0 });
    return c.json({ rival: { username: them.username, hero: them.hero }, rows, lifts, score });
  });

  /** Find players to duel. */
  r.get('/players', async (c) => {
    const q = (c.req.query('q') ?? '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (q.length < 2) return c.json([]);
    const found = await db.select({ username: users.username, hero: profiles.hero })
      .from(users).innerJoin(profiles, eq(profiles.userId, users.id))
      .where(sql`${users.username} like ${q + '%'}`).limit(10);
    return c.json(found);
  });

  return r;
}
