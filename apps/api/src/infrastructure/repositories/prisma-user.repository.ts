import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { IUserRepository, UserStreak } from '@chess-openings/domain'

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStreak(userId: string): Promise<UserStreak | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastStudyDate: true },
    })
  }

  async updateProgress(userId: string, streak: number, xpIncrement: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { streak, lastStudyDate: new Date(), xp: { increment: xpIncrement } },
    })
  }
}
