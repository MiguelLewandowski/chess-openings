import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { IOpeningChoiceRepository, OpeningStyle } from '@chess-openings/domain'

@Injectable()
export class PrismaOpeningChoiceRepository implements IOpeningChoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFamilyStyles(family: string): Promise<OpeningStyle[]> {
    const paths = await this.prisma.opening.findMany({ where: { family }, select: { style: true } })
    return paths.flatMap((path) => (path.style ? [path.style] : []))
  }

  async saveChoice(userId: string, family: string, style: OpeningStyle): Promise<void> {
    await this.prisma.userOpeningChoice.upsert({
      where: { userId_family: { userId, family } },
      create: { userId, family, style },
      update: { style },
    })
  }
}
