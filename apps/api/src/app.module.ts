import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { OpeningModule } from './modules/opening/opening.module'
import { LessonModule } from './modules/lesson/lesson.module'
import { ProgressModule } from './modules/progress/progress.module'
import { IngestorModule } from './modules/ingestor/ingestor.module'
import { AuthModule } from './modules/auth/auth.module'
import { MoveModule } from './modules/move/move.module'
import { PuzzleModule } from './modules/puzzle/puzzle.module'
import { LiveModule } from './modules/live/live.module'
import { PrismaModule } from './infrastructure/prisma.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    OpeningModule,
    LessonModule,
    ProgressModule,
    IngestorModule,
    AuthModule,
    MoveModule,
    PuzzleModule,
    LiveModule,
  ],
})
export class AppModule {}
