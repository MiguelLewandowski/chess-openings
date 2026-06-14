import { Injectable } from '@nestjs/common'
import { IngestStudy } from '@chess-openings/domain'
import { PgnParserService } from '../../infrastructure/services/pgn-parser.service'
import { EngineService } from '../../infrastructure/services/engine.service'
import { CoachService } from '../../infrastructure/services/coach.service'
import { LichessImporterService } from '../../infrastructure/services/lichess-importer.service'
import { PrismaContentRepository } from '../../infrastructure/repositories/prisma-content.repository'
import type { IngestStudyDto } from './dto/ingest-study.dto'

@Injectable()
export class IngestorService {
  constructor(
    private readonly pgnParser: PgnParserService,
    private readonly engineService: EngineService,
    private readonly coachService: CoachService,
    private readonly lichessImporter: LichessImporterService,
    private readonly contentRepo: PrismaContentRepository,
  ) {}

  async ingestStudy(dto: IngestStudyDto): Promise<{ id: string; name: string }> {
    const pgn = await this.lichessImporter.getStudyPgn(dto.url)

    const useCase = new IngestStudy(
      this.pgnParser,
      this.engineService,
      this.coachService,
      this.contentRepo,
    )

    return useCase.execute(pgn, {
      openingName: dto.openingName,
      chapterLimit: dto.chapterLimit,
      specificChapter: dto.specificChapter,
      styleTags: dto.styleTags,
    })
  }
}
