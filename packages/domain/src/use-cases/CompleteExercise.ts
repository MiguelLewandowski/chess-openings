import { applySM2, calcStreak } from '../entities/UserProgress'
import type { SM2Result } from '../entities/UserProgress'
import type { IUserProgressRepository } from '../repositories/IUserProgressRepository'
import type { IUserRepository } from '../repositories/IUserRepository'

export interface CompleteExerciseInput {
  userId: string
  exerciseId: string
  quality: number
}

export interface CompleteExerciseResult {
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
  async execute({ userId, exerciseId, quality }: CompleteExerciseInput): Promise<CompleteExerciseResult> {
    const [existing, user] = await Promise.all([
      this.progressRepo.findByUserAndExercise(userId, exerciseId),
      this.userRepo.findStreak(userId),
    ])

    const base = existing ?? { easinessFactor: 2.5, interval: 0, repetitions: 0 }
    const sm2Result = applySM2(base, quality)
    const newStreak = calcStreak(user?.lastStudyDate ?? null, user?.streak ?? 0)

    return { sm2Result, newStreak }
  }
}
