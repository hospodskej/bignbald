import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import type { Db } from './db/client';
import { authRoutes } from './routes/auth';
import { competeRoutes } from './routes/compete';
import { meRoutes } from './routes/me';

export function createApp(db: Db) {
  const app = new Hono();
  app.use('*', cors({ origin: (o) => o ?? '*', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] }));

  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/auth', authRoutes(db));
  app.route('/me', meRoutes(db));
  app.route('/', competeRoutes(db));

  // Errors always come back as { error: "human readable message" }.
  app.onError((err, c) => {
    if (err instanceof ZodError) return c.json({ error: err.issues[0]?.message ?? 'Invalid input' }, 400);
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    if (err instanceof SyntaxError) return c.json({ error: 'Invalid JSON' }, 400);
    console.error(err);
    return c.json({ error: 'Something went wrong' }, 500);
  });
  app.notFound((c) => c.json({ error: 'Not found' }, 404));
  return app;
}
