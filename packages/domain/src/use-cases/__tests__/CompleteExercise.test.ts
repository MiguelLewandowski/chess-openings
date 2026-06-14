import { describe, it, expect, vi } from 'vitest'
import { CompleteExercise } from '../CompleteExercise'
import type { IUserProgressRepository } from '../../repositories/IUserProgressRepository'
import type { IUserRepository } from '../../repositories/IUserRepository'
import type { SM2State } from '../../entities/UserProgress'

function makeRepos(options?: { existing?: SM2State | null }) {
  const progressRepo: IUserProgressRepository = {
    findByUserAndExercise: vi.fn().mockResolvedValue(options?.existing ?? null),
    upsert: vi.fn().mockResolvedValue(undefined),
  }
  const userRepo: IUserRepository = {
    findStreak: vi.fn().mockResolvedValue({ streak: 3, lastStudyDate: null }),
    updateProgress: vi.fn().mockResolvedValue(undefined),
  }
  return { progressRepo, userRepo }
}

describe('CompleteExercise', () => {
  it('should upsert progress and update user on success', async () => {
    const { progressRepo, userRepo } = makeRepos()
    const useCase = new CompleteExercise(progressRepo, userRepo)

    await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(progressRepo.upsert).toHaveBeenCalledOnce()
    expect(userRepo.updateProgress).toHaveBeenCalledOnce()
  })

  it('should apply default SM2 state when no previous progress exists', async () => {
    const { progressRepo, userRepo } = makeRepos({ existing: null })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(progressRepo.upsert).toHaveBeenCalledWith(
      'user-1',
      'ex-1',
      expect.objectContaining({ repetitions: 1, interval: 1 })
    )
  })

  it('should carry over existing SM2 state when progress already exists', async () => {
    const existing: SM2State = { easinessFactor: 2.5, interval: 6, repetitions: 2 }
    const { progressRepo, userRepo } = makeRepos({ existing })
    const useCase = new CompleteExercise(progressRepo, userRepo)

    await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(progressRepo.upsert).toHaveBeenCalledWith(
      'user-1',
      'ex-1',
      expect.objectContaining({ repetitions: 3, interval: 15 })
    )
  })

  it('should reset streak to 1 when user has no previous study date', async () => {
    const { progressRepo, userRepo } = makeRepos()
    const useCase = new CompleteExercise(progressRepo, userRepo)

    await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 5 })

    expect(userRepo.updateProgress).toHaveBeenCalledWith('user-1', 1, 10)
  })

  it('should always grant 10 xp per completion', async () => {
    const { progressRepo, userRepo } = makeRepos()
    const useCase = new CompleteExercise(progressRepo, userRepo)

    await useCase.execute({ userId: 'user-1', exerciseId: 'ex-1', quality: 3 })

    const [, , xp] = (userRepo.updateProgress as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(xp).toBe(10)
  })
})
