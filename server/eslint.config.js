import { configApp } from '@adonisjs/eslint-config'

export default [
  // app/shared is copied from the app (see scripts/sync_shared.mjs); schema.ts is generated.
  { ignores: ['app/shared/**', 'database/schema.ts'] },
  ...configApp(),
  // Tests read nicer as `(await client.get(...)).assertStatus(200)`.
  { files: ['tests/**'], rules: { '@unicorn/no-await-expression-member': 'off' } },
]
