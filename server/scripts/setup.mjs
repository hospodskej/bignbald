// One-time setup after cloning: creates .env with a fresh secret key and builds the database.
// Usage: npm run setup
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'

if (!existsSync('node_modules/@poppinss/ts-exec') || !existsSync('node_modules/sqlite3')) {
  console.error('Packages are missing. Run "npm install" first (and check it finished without errors).')
  process.exit(1)
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env')
  run('node ace generate:key')
  console.log('Created .env')
} else {
  console.log('.env already exists, keeping it')
}
run('node scripts/sync_shared.mjs')
run('node ace migration:run')
console.log('\nReady. Start the API with: npm run dev')
