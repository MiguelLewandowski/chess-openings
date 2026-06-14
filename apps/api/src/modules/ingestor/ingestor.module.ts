import { Module } from '@nestjs/common'
import { IngestorController } from './ingestor.controller'
import { IngestorService } from './ingestor.service'
import { PgnParserService } from '../../infrastructure/services/pgn-parser.service'
import { EngineService } from '../../infrastructure/services/engine.service'
import { CoachService } from '../../infrastructure/services/coach.service'
import { LichessImporterService } from '../../infrastructure/services/lichess-importer.service'
import { PrismaContentRepository } from '../../infrastructure/repositories/prisma-content.repository'

@Module({
  controllers: [IngestorController],
  providers: [
    IngestorService,
    PgnParserService,
    EngineService,
    CoachService,
    LichessImporterService,
    PrismaContentRepository,
  ],
})
export class IngestorModule {}
