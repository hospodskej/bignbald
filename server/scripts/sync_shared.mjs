// Copies the app's game data (exercises, ranks, heroes, muscles) into the server,
// so both use the exact same rules. Runs automatically before dev, build and test.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const files = ['exercises', 'ranks', 'heroes', 'muscles']
mkdirSync('app/shared', { recursive: true })
for (const f of files) {
  // Node-style imports need the file extension on the server.
  const src = readFileSync(`../src/data/${f}.ts`, 'utf8').replace(
    /from '\.\/([a-z_]+)'/g,
    "from './$1.ts'"
  )
  writeFileSync(
    `app/shared/${f}.ts`,
    `// GENERATED from src/data/${f}.ts by scripts/sync_shared.mjs. Edit the original.\n${src}`
  )
}
console.log(`Synced ${files.length} shared files from the app`)
