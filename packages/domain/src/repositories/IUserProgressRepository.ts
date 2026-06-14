import type { SM2Result, SM2State } from '../entities/UserProgress'

export interface IUserProgressRepository {
  findByUserAndExercise(userId: string, exerciseId: string): Promise<SM2State | null>
  upsert(userId: string, exerciseId: string, data: SM2Result): Promise<void>
}
