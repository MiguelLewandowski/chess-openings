import { applySM2, calcStreak } from '../entities/UserProgress'
import type { IUserProgressRepository } from '../repositories/IUserProgressRepository'
import type { IUserRepository } from '../repositories/IUserRepository'

export interface CompleteExerciseInput {
  userId: string
  exerciseId: string
  quality: number
}

export class CompleteExercise {
  constructor(
    private readonly progressRepo: IUserProgressRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute({ userId, exerciseId, quality }: CompleteExerciseInput): Promise<void> {
    const [existing, user] = await Promise.all([
      this.progressRepo.findByUserAndExercise(userId, exerciseId),
      this.userRepo.findStreak(userId),
    ])

    const base = existing ?? { easinessFactor: 2.5, interval: 0, repetitions: 0 }
    const updated = applySM2(base, quality)
    const newStreak = calcStreak(user?.lastStudyDate ?? null, user?.streak ?? 0)

    await Promise.all([
      this.progressRepo.upsert(userId, exerciseId, updated),
      this.userRepo.updateProgress(userId, newStreak, 10),
    ])
  }
}
