import { applySM2, calcStreak } from '../entities/UserProgress'
import type { SM2Result } from '../entities/UserProgress'
import { practiceQuality, practiceXp, type PracticeAttempt } from '../entities/PracticeScore'
import type { IUserProgressRepository } from '../repositories/IUserProgressRepository'
import type { IUserRepository } from '../repositories/IUserRepository'

export interface CompleteExerciseInput {
  userId: string
  exerciseId: string
  attempt: PracticeAttempt
}

export interface CompleteExerciseResult {
  quality: number
  xpEarned: number
  sm2Result: SM2Result
  newStreak: number
}

export class CompleteExercise {
  constructor(
    private readonly progressRepo: IUserProgressRepository,
    private readonly userRepo: IUserRepository
  ) {}

  // Returns computed values only — the caller is responsible for persisting them
  // atomically (e.g., inside a database transaction).
  async execute({ userId, exerciseId, attempt }: CompleteExerciseInput): Promise<CompleteExerciseResult> {
    const [existing, user] = await Promise.all([
      this.progressRepo.findByUserAndExercise(userId, exerciseId),
      this.userRepo.findStreak(userId),
    ])

    const quality = practiceQuality(attempt)
    const base = existing ?? { easinessFactor: 2.5, interval: 0, repetitions: 0 }
    const sm2Result = applySM2(base, quality)
    const newStreak = calcStreak(user?.lastStudyDate ?? null, user?.streak ?? 0)

    return { quality, xpEarned: practiceXp(quality), sm2Result, newStreak }
  }
}
