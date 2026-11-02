import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const migrations = { naturalSort: true, paths: ['database/migrations'] }
const schemaGeneration = { enabled: true, rulesPaths: ['./database/schema_rules.js'] }

/**
 * Development: SQLite file in tmp/ (nothing to install, works on Windows).
 * Tests: a separate SQLite file, reset on every run.
 * Production: PostgreSQL, set DB_CONNECTION=pg and DATABASE_URL.
 */
const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION', 'sqlite'),

  connections: {
    // The `sqlite3` driver ships prebuilt binaries that work on every Node version
    // (Node-API), so installing never needs Python or C++ build tools.
    sqlite: {
      client: 'sqlite3',
      connection: { filename: app.tmpPath(app.inTest ? 'test.sqlite3' : 'db.sqlite3') },
      useNullAsDefault: true,
      migrations,
      schemaGeneration,
    },

    pg: {
      client: 'pg',
      connection: env.get('DATABASE_URL'),
      migrations,
      schemaGeneration,
      debug: app.inDev,
    },
  },
})

export default dbConfig
