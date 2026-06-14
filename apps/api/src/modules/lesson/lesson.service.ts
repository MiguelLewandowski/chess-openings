import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'
import type { LessonDetail } from '@chess-openings/domain'

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<LessonDetail> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        opening: {
          include: {
            lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
          },
        },
        exercises: {
          include: {
            moves: {
              select: {
                id: true, san: true, fen: true, parentId: true,
                isOpponentResponse: true, coachInsights: true, visualMarkers: true,
              },
              orderBy: { id: 'asc' },
            },
          },
          orderBy: { type: 'asc' },
        },
      },
    })

    if (!lesson) throw new NotFoundException(`Lesson '${id}' not found.`)
    return lesson as unknown as LessonDetail
  }
}
