import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'
import { PrismaUserProgressRepository } from '../../infrastructure/repositories/prisma-user-progress.repository'
import { PrismaUserRepository } from '../../infrastructure/repositories/prisma-user.repository'
import {
  CompleteExercise,
  MATURE_INTERVAL_DAYS,
  currentStreak,
  formatMoveList,
  levelFromXp,
  mainLine,
  type ContinueLesson,
  type ExerciseCompletion,
  type LineNode,
  type PracticeAttempt,
  type UserProfile,
} from '@chess-openings/domain'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// Plies of the first lesson shown on each opening card ("1.c4 e5 2.Nc3 Nf6").
const OPENING_PREVIEW_PLIES = 4

interface ProfileOpening {
  name: string
  slug: string
  lessons: { id: string; title: string; exercises: { initialFen: string | null; moves: LineNode[] }[] }[]
}

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

  async complete(userId: string, exerciseId: string, attempt: PracticeAttempt): Promise<ExerciseCompletion> {
    const { quality, xpEarned, sm2Result, newStreak } = await this.completeExercise.execute({ userId, exerciseId, attempt })

    await this.prisma.$transaction([
      this.prisma.userProgress.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: { userId, exerciseId, ...sm2Result },
        update: { ...sm2Result },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { streak: newStreak, lastStudyDate: new Date(), xp: { increment: xpEarned } },
      }),
    ])

    return {
      quality,
      xpEarned,
      intervalDays: sm2Result.interval,
      nextReview: sm2Result.nextReview.toISOString(),
    }
  }

  findDueReviews(userId: string) {
    return this.prisma.userProgress.findMany({
      where: {
        userId,
        nextReview: { lte: new Date() },
        // No repetitions filter: a lapsed card (SM-2 resets repetitions to 0 on
        // a failure) must still resurface once its 1-day interval elapses. Rows
        // only exist after a real attempt, so there are no untouched cards to leak.
        exercise: { type: 'PRACTICE' },
      },
      select: {
        nextReview: true,
        exercise: {
          select: {
            id: true,
            title: true,
            cardKind: true,
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

  async findProfile(userId: string): Promise<UserProfile> {
    const [user, openings, progress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, styleArchetype: true, createdAt: true, xp: true, streak: true, lastStudyDate: true },
      }),
      this.prisma.opening.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          styleTags: true,
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
              // Practice exercises hold only the main line, so this stays small.
              exercises: {
                where: { type: 'PRACTICE', cardKind: null },
                select: { initialFen: true, moves: { select: { id: true, parentId: true, san: true, fen: true } } },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.userProgress.findMany({
        where: { userId },
        select: {
          interval: true,
          nextReview: true,
          updatedAt: true,
          exercise: { select: { type: true, lessonId: true, cardKind: true } },
        },
      }),
    ])
    if (!user) throw new UnauthorizedException('User not found.')

    // Same rule as findCompletedLessonIds.
    const completedLessonIds = new Set(
      progress.filter((p) => p.exercise.cardKind === null).map((p) => p.exercise.lessonId),
    )

    // Completing a THEORY exercise also writes an SM-2 row, but only PRACTICE exercises are
    // ever brought back for review, so the review stats count those alone.
    const now = new Date()
    const practice = progress.filter((p) => p.exercise.type === 'PRACTICE')
    const upcoming = practice
      .map((p) => p.nextReview)
      .filter((date) => date > now)
      .sort((a, b) => a.getTime() - b.getTime())

    const openingProgress = openings.map((opening) => {
      const firstPractice = opening.lessons[0]?.exercises[0]
      const firstMoves = firstPractice
        ? formatMoveList(mainLine(firstPractice.moves).slice(0, OPENING_PREVIEW_PLIES).map((m) => m.san), firstPractice.initialFen)
        : ''

      return {
        id: opening.id,
        name: opening.name,
        slug: opening.slug,
        styleTags: opening.styleTags,
        firstMoves,
        completedLessons: opening.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length,
        totalLessons: opening.lessons.length,
      }
    })

    return {
      name: user.name,
      email: user.email,
      styleArchetype: user.styleArchetype,
      memberSince: user.createdAt.toISOString(),
      xp: user.xp,
      level: levelFromXp(user.xp),
      streak: currentStreak(user.lastStudyDate, user.streak),
      lastRunLength: user.streak,
      lastStudyDate: user.lastStudyDate?.toISOString() ?? null,
      lessonsCompleted: openingProgress.reduce((sum, o) => sum + o.completedLessons, 0),
      totalLessons: openingProgress.reduce((sum, o) => sum + o.totalLessons, 0),
      reviews: {
        due: practice.filter((p) => p.nextReview <= now).length,
        scheduled: practice.length,
        mastered: practice.filter((p) => p.interval >= MATURE_INTERVAL_DAYS).length,
        nextReview: upcoming[0]?.toISOString() ?? null,
      },
      continueLesson: this.pickContinueLesson(openings, progress, completedLessonIds),
      openings: openingProgress,
    }
  }

  // The first unfinished lesson of the opening the user touched most recently; for a user
  // with no progress, the first lesson of the catalog. When every lesson of that opening is
  // done, the most recently studied lesson is offered again as a review.
  private pickContinueLesson(
    openings: ProfileOpening[],
    progress: { updatedAt: Date; exercise: { lessonId: string } }[],
    completedLessonIds: Set<string>,
  ): ContinueLesson | null {
    const latest = progress.reduce<(typeof progress)[number] | null>(
      (acc, p) => (!acc || p.updatedAt > acc.updatedAt ? p : acc),
      null,
    )

    const opening = latest
      ? openings.find((o) => o.lessons.some((l) => l.id === latest.exercise.lessonId))
      : openings.find((o) => o.lessons.length > 0)
    if (!opening) return null

    const lesson =
      opening.lessons.find((l) => !completedLessonIds.has(l.id)) ??
      opening.lessons.find((l) => l.id === latest?.exercise.lessonId) ??
      opening.lessons[0]

    const practiceExercise = lesson.exercises[0]
    const line = practiceExercise ? mainLine(practiceExercise.moves) : []
    const touchedLessonIds = new Set(progress.map((p) => p.exercise.lessonId))

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      openingName: opening.name,
      openingSlug: opening.slug,
      fen: line[line.length - 1]?.fen ?? practiceExercise?.initialFen ?? STARTING_FEN,
      hasProgress: touchedLessonIds.has(lesson.id),
      remainingLessons: opening.lessons.filter((l) => !completedLessonIds.has(l.id)).length,
    }
  }

  // A lesson is completed once its theory or its main practice was finished at least once
  // (a progress row is written only on completion). This deliberately ignores the SM-2
  // state: failing a later review resets repetitions, and that must send the exercise back
  // to review, not lock the rest of the trail again. Cards do not complete a lesson.
  async findCompletedLessonIds(userId: string, openingId: string): Promise<string[]> {
    const rows = await this.prisma.userProgress.findMany({
      where: {
        userId,
        exercise: { lesson: { openingId }, cardKind: null },
      },
      select: { exercise: { select: { lessonId: true } } },
    })
    return [...new Set(rows.map((r) => r.exercise.lessonId))]
  }
}
