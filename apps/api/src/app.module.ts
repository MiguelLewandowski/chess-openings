import { Module } from '@nestjs/common'
import { OpeningModule } from './modules/opening/opening.module'
import { LessonModule } from './modules/lesson/lesson.module'
import { ProgressModule } from './modules/progress/progress.module'
import { IngestorModule } from './modules/ingestor/ingestor.module'
import { AuthModule } from './modules/auth/auth.module'
import { MoveModule } from './modules/move/move.module'
import { PuzzleModule } from './modules/puzzle/puzzle.module'
import { PrismaModule } from './infrastructure/prisma.module'

@Module({
  imports: [
    PrismaModule,
    OpeningModule,
    LessonModule,
    ProgressModule,
    IngestorModule,
    AuthModule,
    MoveModule,
    PuzzleModule,
  ],
})
export class AppModule {}
