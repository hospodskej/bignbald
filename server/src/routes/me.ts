import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { type AuthEnv, requireAuth } from '../auth';
import type { Db } from '../db/client';
import { profiles, sets, users, weightLogs, workouts } from '../db/schema';
import { profile as profileSchema, weight, workout } from '../validation';

/** Everything about the signed-in user: profile, body weight, workouts. */
export function meRoutes(db: Db) {
  const r = new Hono<AuthEnv>();
  r.use('*', requireAuth);

  r.get('/', async (c) => {
    const id = c.get('userId');
    const [u] = await db.select({ id: users.id, email: users.email, username: users.username }).from(users).where(eq(users.id, id));
    if (!u) throw new HTTPException(401, { message: 'Account no longer exists' });
    const [p] = await db.select().from(profiles).where(eq(profiles.userId, id));
    return c.json({ user: u, profile: p?.data ?? null });
  });

  r.put('/profile', async (c) => {
    const p = profileSchema.parse(await c.req.json());
    const userId = c.get('userId');
    await db.insert(profiles).values({ userId, hero: p.hero, data: p })
      .onConflictDoUpdate({ target: profiles.userId, set: { hero: p.hero, data: p, updatedAt: new Date() } });
    return c.json({ ok: true });
  });

  r.get('/weights', async (c) => {
    const rows = await db.select({ date: weightLogs.date, kg: weightLogs.kg }).from(weightLogs)
      .where(eq(weightLogs.userId, c.get('userId'))).orderBy(asc(weightLogs.date));
    return c.json(rows);
  });

  r.put('/weights', async (c) => {
    const w = weight.parse(await c.req.json());
    const userId = c.get('userId');
    await db.insert(weightLogs).values({ userId, ...w }).onConflictDoUpdate({ target: [weightLogs.userId, weightLogs.date], set: { kg: w.kg } });
    return c.json({ ok: true });
  });

  /** Upload a finished workout. Safe to retry: the same id is only stored once. */
  r.post('/workouts', async (c) => {
    const w = workout.parse(await c.req.json());
    const userId = c.get('userId');
    const [existing] = await db.select({ userId: workouts.userId }).from(workouts).where(eq(workouts.id, w.id));
    if (existing) {
      if (existing.userId !== userId) throw new HTTPException(409, { message: 'Workout id clash' });
      return c.json({ ok: true, duplicate: true });
    }
    await db.transaction(async (tx) => {
      await tx.insert(workouts).values({ id: w.id, userId, hero: w.hero, dayId: w.dayId, startedAt: new Date(w.startedAt), finishedAt: new Date(w.finishedAt) });
      const rows = w.entries.flatMap((e) => e.sets.map((s, position) => ({ workoutId: w.id, userId, exerciseId: e.exerciseId, slot: e.slot, position, ...s })));
      if (rows.length) await tx.insert(sets).values(rows);
    });
    return c.json({ ok: true }, 201);
  });

  /** All workouts in the app's shape, newest first (used after logging in on a new phone). */
  r.get('/workouts', async (c) => {
    const userId = c.get('userId');
    const list = await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.finishedAt)).limit(500);
    const allSets = list.length
      ? await db.select().from(sets).where(and(eq(sets.userId, userId), inArray(sets.workoutId, list.map((w) => w.id)))).orderBy(asc(sets.slot), asc(sets.position))
      : [];
    return c.json(
      list.map((w) => {
        const mine = allSets.filter((s) => s.workoutId === w.id);
        const slots = [...new Set(mine.map((s) => s.slot))];
        return {
          id: w.id, hero: w.hero, dayId: w.dayId, startedAt: w.startedAt.getTime(), finishedAt: w.finishedAt.getTime(),
          entries: slots.map((slot) => {
            const ss = mine.filter((s) => s.slot === slot);
            return { slot, exerciseId: ss[0].exerciseId, sets: ss.map((s) => ({ kg: String(s.kg), reps: String(s.reps), done: s.done })) };
          }),
        };
      }),
    );
  });

  r.delete('/workouts', async (c) => {
    await db.delete(workouts).where(eq(workouts.userId, c.get('userId')));
    return c.json({ ok: true });
  });

  return r;
}
