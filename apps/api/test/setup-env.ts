import { testDatabaseUrl } from './test-database'

// Set before any spec imports AppModule, so PrismaClient connects to the test database.
process.env.DATABASE_URL = testDatabaseUrl()
