import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { WsAdapter } from '@nestjs/platform-ws'
import { ThrottlerGuard } from '@nestjs/throttler'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/infrastructure/prisma.service'

export interface TestContext {
  app: INestApplication
  prisma: PrismaService
}

export async function createTestApp(): Promise<TestContext> {
  // The suite hits /auth/login and /auth/register far more than 5 times a minute from a
  // single address. Rate limiting is production behaviour, not what these tests assert.
  // overrideGuard(ThrottlerGuard) does not work here: the guard is registered under the
  // APP_GUARD token, which the override never matches, so the prototype is stubbed instead.
  jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true)

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

  const app = moduleRef.createNestApplication()
  app.useWebSocketAdapter(new WsAdapter(app))
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  const prisma = app.get(PrismaService)
  return { app, prisma }
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  // Last line of defence: whatever the configuration says, never truncate a database that
  // is not a test one. Running the suite against the dev database once wiped real data.
  const [{ current_database: database }] = await prisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`
  if (!database.endsWith('_test')) {
    throw new Error(`Refusing to reset "${database}": the e2e suite only runs against a *_test database.`)
  }

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "UserProgress", "Move", "Exercise", "Lesson", "Opening", "User" RESTART IDENTITY CASCADE',
  )
}
