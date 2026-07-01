import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'
import { PrismaUserProgressRepository } from '../../infrastructure/repositories/prisma-user-progress.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository'
import { CompleteExercise } from '@chess-openings/domain'

@Injectable()
export class ProgressService {
  private readonly completeExercise: CompleteExercise

  constructor(
    private readonly prisma: PrismaService,
    progressRepo: PrismaUserProgressRepository,
    userRepo: PrismaUserRepository,
  ) {
    this.completeExercise = new CompleteExercise(progressRepo, userRepo)
  }

  async complete(userId: string, exerciseId: string, quality: number): Promise<void> {
    const { sm2Result, newStreak } = await this.completeExercise.execute({ userId, exerciseId, quality })

    await this.prisma.$transaction([
      this.prisma.userProgress.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: { userId, exerciseId, ...sm2Result },
        update: { ...sm2Result },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { streak: newStreak, lastStudyDate: new Date(), xp: { increment: 10 } },
      }),
    ])
  }

  findDueReviews(userId: string) {
    return this.prisma.userProgress.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        repetitions: { gt: 0 },
        exercise: { type: 'PRACTICE' },
      },
      select: {
        nextReview: true,
        exercise: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
                opening: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { nextReview: 'asc' },
    })
  }

  async findCompletedLessonIds(userId: string, openingId: string): Promise<string[]> {
    const rows = await this.prisma.userProgress.findMany({
      where: {
        userId,
        repetitions: { gt: 0 },
        exercise: { lesson: { openingId } },
      },
      select: { exercise: { select: { lessonId: true } } },
    })
    return [...new Set(rows.map((r) => r.exercise.lessonId))]
  }
}
