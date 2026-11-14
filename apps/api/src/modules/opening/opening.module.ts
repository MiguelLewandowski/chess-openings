import { Module } from '@nestjs/common'
import { OpeningController } from './opening.controller'
import { OpeningService } from './opening.service'
import { PrismaOpeningChoiceRepository } from '../../infrastructure/repositories/prisma-opening-choice.repository'
import { ProgressModule } from '../progress/progress.module'

@Module({
  imports: [ProgressModule],
  controllers: [OpeningController],
  providers: [OpeningService, PrismaOpeningChoiceRepository],
})
export class OpeningModule {}
