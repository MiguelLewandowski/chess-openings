import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { OpeningModule } from './modules/opening/opening.module'
import { LessonModule } from './modules/lesson/lesson.module'
import { ProgressModule } from './modules/progress/progress.module'
import { IngestorModule } from './modules/ingestor/ingestor.module'
import { AuthModule } from './modules/auth/auth.module'
import { MoveModule } from './modules/move/move.module'
import { PuzzleModule } from './modules/puzzle/puzzle.module'
import { LiveModule } from './modules/live/live.module'
import { HealthModule } from './modules/health/health.module'
import { PrismaModule } from './infrastructure/prisma.module'

@Module({
  imports: [
    // Baseline limit for every route; the expensive/abusable ones tighten it with
    // @Throttle on the handler (auth) or skip it entirely where a burst is legitimate.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
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
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
