import { execSync } from 'child_process'
import { resolve } from 'path'
import { testDatabaseUrl } from './test-database'

// Runs once before the suite: brings the test database to the current schema (creating it
// on the first run), so a fresh clone or CI job needs no manual step.
export default function globalSetup(): void {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'inherit',
  })
}
