import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma.service'
import type { IContentRepository, IngestStudyData, IngestMoveNode } from '@chess-openings/domain'

@Injectable()
export class PrismaContentRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One transaction: a re-import replaces the opening's lessons, and a failure halfway
  // must not leave the opening with none. The generous timeout covers the one-insert-per-
  // move writes of a large study.
  async upsertStudy(data: IngestStudyData): Promise<{ id: string; name: string }> {
    return this.prisma.$transaction(
      async (tx) => {
        const opening = await tx.opening.upsert({
          where: { slug: data.openingSlug },
          create: { name: data.openingName, slug: data.openingSlug, description: 'Auto-imported', styleTags: data.styleTags },
          update: { name: data.openingName, styleTags: data.styleTags },
        })

        // Re-importing an opening (e.g. after reviewing it on Lichess) replaces its lessons
        // instead of appending a second copy. Cascades remove their exercises, moves and the
        // students' progress on them.
        await tx.lesson.deleteMany({ where: { openingId: opening.id } })

        for (const lessonData of data.lessons) {
          const lesson = await tx.lesson.create({
            data: { title: lessonData.title, order: lessonData.order, openingId: opening.id },
          })

          for (const ex of lessonData.exercises) {
            const exercise = await tx.exercise.create({
              data: {
                title: ex.title,
                type: ex.type,
                cardKind: ex.cardKind,
                description: ex.description,
                lessonId: lesson.id,
                initialFen: ex.initialFen,
              },
            })
            await this.insertMoves(tx, ex.moves, exercise.id, null)
          }
        }

        return { id: opening.id, name: opening.name }
      },
      { timeout: 120_000 },
    )
  }

  private async insertMoves(
    tx: Prisma.TransactionClient,
    nodes: IngestMoveNode[],
    exerciseId: string,
    parentId: string | null,
  ): Promise<void> {
    for (const node of nodes) {
      const created = await tx.move.create({
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
        await this.insertMoves(tx, node.children, exerciseId, created.id)
      }
    }
  }
}
