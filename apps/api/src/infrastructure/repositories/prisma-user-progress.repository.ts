import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { IUserProgressRepository, SM2Result, SM2State } from '@chess-openings/domain'

@Injectable()
export class PrismaUserProgressRepository implements IUserProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserAndExercise(userId: string, exerciseId: string): Promise<SM2State | null> {
    return this.prisma.userProgress.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
      select: { easinessFactor: true, interval: true, repetitions: true },
    })
  }

  async upsert(userId: string, exerciseId: string, data: SM2Result): Promise<void> {
    await this.prisma.userProgress.upsert({
      where: { userId_exerciseId: { userId, exerciseId } },
      create: { userId, exerciseId, ...data },
      update: { ...data },
    })
  }
}
