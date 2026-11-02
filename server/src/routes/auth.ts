import { eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { randomUUID } from 'node:crypto';

import { hashPassword, issueToken, rateLimit, verifyPassword } from '../auth';
import type { Db } from '../db/client';
import { profiles, users } from '../db/schema';
import { login, signup } from '../validation';

export function authRoutes(db: Db) {
  const r = new Hono();
  r.use('*', rateLimit(20, 60_000));

  r.post('/signup', async (c) => {
    const body = signup.parse(await c.req.json());
    const taken = await db.select({ email: users.email, username: users.username }).from(users)
      .where(or(eq(users.email, body.email), eq(users.username, body.username)));
    if (taken.some((t) => t.email === body.email)) throw new HTTPException(409, { message: 'That email already has an account' });
    if (taken.length) throw new HTTPException(409, { message: 'That username is taken' });

    const id = randomUUID();
    await db.insert(users).values({ id, email: body.email, username: body.username, passwordHash: await hashPassword(body.password) });
    await db.insert(profiles).values({ userId: id, hero: body.profile.hero, data: body.profile });
    return c.json({ token: await issueToken(id), user: { id, email: body.email, username: body.username } }, 201);
  });

  r.post('/login', async (c) => {
    const body = login.parse(await c.req.json());
    const [user] = await db.select().from(users).where(eq(users.email, body.email));
    // Same message either way, so nobody can probe which emails exist.
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HTTPException(401, { message: 'Wrong email or password' });
    }
    const [p] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    return c.json({ token: await issueToken(user.id), user: { id: user.id, email: user.email, username: user.username }, profile: p?.data ?? null });
  });

  return r;
}
