export interface UserStreak {
  streak: number
  lastStudyDate: Date | null
}

export interface IUserRepository {
  findStreak(userId: string): Promise<UserStreak | null>
  updateProgress(userId: string, streak: number, xpIncrement: number): Promise<void>
}
