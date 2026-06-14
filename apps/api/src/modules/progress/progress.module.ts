import { Module } from '@nestjs/common'
import { ProgressController } from './progress.controller'
import { ProgressService } from './progress.service'
import { PrismaUserProgressRepository } from '../../infrastructure/repositories/prisma-user-progress.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository'

@Module({
  controllers: [ProgressController],
  providers: [ProgressService, PrismaUserProgressRepository, PrismaUserRepository],
})
export class ProgressModule {}
