import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/infrastructure/prisma.service'

export interface TestContext {
  app: INestApplication
  prisma: PrismaService
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()

  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  const prisma = app.get(PrismaService)
  return { app, prisma }
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "UserProgress", "Move", "Exercise", "Lesson", "Opening", "User" RESTART IDENTITY CASCADE',
  )
}
