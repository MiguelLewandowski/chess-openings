import { Module } from '@nestjs/common'
import { OpeningController } from './opening.controller'
import { OpeningService } from './opening.service'
import { PrismaOpeningChoiceRepository } from '../../infrastructure/repositories/prisma-opening-choice.repository'

@Module({
  controllers: [OpeningController],
  providers: [OpeningService, PrismaOpeningChoiceRepository],
})
export class OpeningModule {}
