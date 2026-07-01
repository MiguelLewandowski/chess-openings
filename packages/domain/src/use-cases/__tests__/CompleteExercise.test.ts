import { describe, it, expect, vi } from 'vitest'
import { CompleteExercise } from '../CompleteExercise'
import type { IUserProgressRepository } from '../../repositories/IUserProgressRepository'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { SM2State } from '../../entities/UserProgress'

function makeRepos(options?: { existing?: SM2State | null; lastStudyDate?: Date | null }) {
  const progressRepo: IUserProgressRepository = {
    findByUserAndExercise: vi.fn().mockResolvedValue(options?.existing ?? null),
    upsert: vi.fn().mockResolvedValue(undefined),
  }
  const userRepo: IUserRepository = {
    findStreak: vi.fn().mockResolvedValue({
      streak: 3,
      lastStudyDate: options?.lastStudyDate ?? null,
    }),
    updateProgress: vi.fn().mockResolvedValue(undefined),
  }
  return { progressRepo, userRepo }
}

describe('CompleteExercise', () => {
  it('should return sm2Result and newStreak without writing', async () => {
    const { progressRepo, userRepo } = makeRepos()
    const useCase = new CompleteExercise(progressRepo, userRepo)

    const result = await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(result).toHaveProperty('sm2Result')
    expect(result).toHaveProperty('newStreak')
    expect(progressRepo.upsert).not.toHaveBeenCalled()
    expect(userRepo.updateProgress).not.toHaveBeenCalled()
  })

  it('should apply default SM2 state when no previous progress exists', async () => {
    const { progressRepo, userRepo } = makeRepos({ existing: null })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    const { sm2Result } = await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(sm2Result).toMatchObject({ repetitions: 1, interval: 1 })
  })

  it('should carry over existing SM2 state when progress already exists', async () => {
    const existing: SM2State = { easinessFactor: 2.5, interval: 6, repetitions: 2 }
    const { progressRepo, userRepo } = makeRepos({ existing })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    const { sm2Result } = await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(sm2Result).toMatchObject({ repetitions: 3, interval: 15 })
  })

  it('should reset streak to 1 when user has no previous study date', async () => {
    const { progressRepo, userRepo } = makeRepos({ lastStudyDate: null })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    const { newStreak } = await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(newStreak).toBe(1)
  })

  it('should increment streak when last study was yesterday', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { progressRepo, userRepo } = makeRepos({ lastStudyDate: yesterday })
    // override streak to 3 so we can verify increment
    ;(userRepo.findStreak as ReturnType<typeof vi.fn>).mockResolvedValue({ streak: 3, lastStudyDate: yesterday })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    const { newStreak } = await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(newStreak).toBe(4)
  })
})
