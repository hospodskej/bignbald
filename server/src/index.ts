import { serve } from '@hono/node-server';

import { createApp } from './app';
import { connect } from './db/client';

const port = Number(process.env.PORT ?? 3000);
const db = await connect();
serve({ fetch: createApp(db).fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`Big N Bald API on http://localhost:${port}  (database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'embedded, ./data'})`);
});
