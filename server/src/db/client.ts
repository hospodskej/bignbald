import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * DATABASE_URL set  -> real PostgreSQL (production, or your own Postgres).
 * Not set           -> embedded Postgres (PGlite) stored in ./data, nothing to install.
 * ':memory:'        -> throwaway database for tests.
 */
export async function connect(url = process.env.DATABASE_URL): Promise<Db> {
  if (url && url !== ':memory:') {
    const db = drizzlePg(new pg.Pool({ connectionString: url }), { schema });
    await migratePg(db, { migrationsFolder });
    return db as unknown as Db;
  }
  const client = url === ':memory:' ? new PGlite() : new PGlite(process.env.PGLITE_DIR ?? './data');
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder });
  return db as unknown as Db;
}
