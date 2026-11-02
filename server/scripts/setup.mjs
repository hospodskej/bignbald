// One-time setup after cloning: creates .env with a fresh secret key and builds the database.
// Usage: npm run setup
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'

if (!existsSync('node_modules/@poppinss/ts-exec') || !existsSync('node_modules/sqlite3')) {
  console.error('Packages are missing. Run "npm install" first (and check it finished without errors).')
  process.exit(1)
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env')
  console.log('Created .env')
}
// Also covers a .env left behind by an earlier setup that stopped halfway.
if (!/^APP_KEY=\S+/m.test(readFileSync('.env', 'utf8'))) {
  run('node ace generate:key')
}
run('node scripts/sync_shared.mjs')
run('node ace codegen')
run('node ace migration:run')
console.log('\nReady. Start the API with: npm run dev')
