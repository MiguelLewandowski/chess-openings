import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { IContentRepository, IngestStudyData, IngestMoveNode } from '@chess-openings/domain'

@Injectable()
export class PrismaContentRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertStudy(data: IngestStudyData): Promise<{ id: string; name: string }> {
    const opening = await this.prisma.opening.upsert({
      where: { slug: data.openingSlug },
      create: { name: data.openingName, slug: data.openingSlug, description: 'Auto-imported', styleTags: data.styleTags },
      update: { name: data.openingName, styleTags: data.styleTags },
    })

    for (const lessonData of data.lessons) {
      const lesson = await this.prisma.lesson.create({
        data: { title: lessonData.title, order: lessonData.order, openingId: opening.id },
      })

      for (const ex of lessonData.exercises) {
        const exercise = await this.prisma.exercise.create({
          data: { title: ex.title, type: ex.type, lessonId: lesson.id, initialFen: ex.initialFen },
        })
        await this.insertMoves(ex.moves, exercise.id, null)
      }
    }

    return { id: opening.id, name: opening.name }
  }

  private async insertMoves(nodes: IngestMoveNode[], exerciseId: string, parentId: string | null): Promise<void> {
    for (const node of nodes) {
      const created = await this.prisma.move.create({
        data: {
          san: node.san,
          fen: node.fen,
          absoluteCp: node.absoluteCp ?? null,
          complexity: node.complexity ?? 'BAIXA',
          isOpponentResponse: node.isOpponentResponse,
          coachInsights: node.coachInsights ? JSON.parse(JSON.stringify(node.coachInsights)) : undefined,
          visualMarkers: node.visualMarkers ? JSON.parse(JSON.stringify(node.visualMarkers)) : undefined,
          exerciseId,
          parentId,
        },
      })
      if (node.children.length > 0) {
        await this.insertMoves(node.children, exerciseId, created.id)
      }
    }
  }
}
