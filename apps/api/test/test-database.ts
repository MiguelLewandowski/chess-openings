import { resolve } from 'path'
import { config } from 'dotenv'

// Locally DATABASE_URL lives in the repository-root .env (the same file the Prisma CLI reads);
// in CI it comes from the job environment and dotenv leaves it untouched.
config({ path: resolve(__dirname, '../../../.env') })

// The suite truncates every table it touches, so it must never run against the database the
// developer works in. The test database is derived from DATABASE_URL by suffixing its name,
// which keeps CI and local setups working without a second variable to configure.
export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL is not set; the e2e suite derives its test database from it.')

  const url = new URL(base)
  const name = url.pathname.slice(1)
  if (!name.endsWith('_test')) url.pathname = `/${name}_test`
  return url.toString()
}
