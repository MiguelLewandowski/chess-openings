import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'

export interface ExpectedMove {
  id: string
  san: string
  fen: string
  coachInsights: unknown
}

@Injectable()
export class MoveService {
  constructor(private readonly prisma: PrismaService) {}

  async findExpectedResponse(fen: string): Promise<ExpectedMove | null> {
    const node = await this.prisma.move.findFirst({
      where: { fen },
      include: { children: { take: 1, orderBy: { id: 'asc' } } },
    })

    const next = node?.children[0]
    if (!next) return null

    return { id: next.id, san: next.san, fen: next.fen, coachInsights: next.coachInsights }
  }
}
