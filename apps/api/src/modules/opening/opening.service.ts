import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'
import type { OpeningSummary } from '@chess-openings/domain'

@Injectable()
export class OpeningService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OpeningSummary[]> {
    return this.prisma.opening.findMany({
      include: {
        lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findBySlug(slug: string): Promise<OpeningSummary> {
    const opening = await this.prisma.opening.findUnique({
      where: { slug },
      include: {
        lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
      },
    })

    if (!opening) throw new NotFoundException(`Opening '${slug}' not found.`)
    return opening
  }

  async delete(id: string): Promise<void> {
    const opening = await this.prisma.opening.findUnique({ where: { id } })
    if (!opening) throw new NotFoundException(`Opening '${id}' not found.`)
    await this.prisma.opening.delete({ where: { id } })
  }
}
