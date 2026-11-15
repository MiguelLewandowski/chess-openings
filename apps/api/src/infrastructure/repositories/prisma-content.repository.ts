import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma.service'
import type { IContentRepository, IngestStudyData, IngestMoveNode } from '@chess-openings/domain'

@Injectable()
export class PrismaContentRepository implements IContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // One transaction: a re-import replaces the opening's lessons, and a failure halfway
  // must not leave the opening with none.
  async upsertStudy(data: IngestStudyData): Promise<{ id: string; name: string }> {
    return this.prisma.$transaction(
      async (tx) => {
        // A path of a family is found by family and style, so each path keeps its own lessons
        // and a re-import of one never touches its sisters.
        const opening = await tx.opening.upsert({
          where:
            data.family && data.style
              ? { family_style: { family: data.family, style: data.style } }
              : { slug: data.openingSlug },
          create: {
            name: data.openingName,
            slug: data.openingSlug,
            description: 'Auto-imported',
            styleTags: data.styleTags,
            isTutorial: data.isTutorial,
            family: data.family,
            style: data.style,
          },
          update: {
            name: data.openingName,
            slug: data.openingSlug,
            styleTags: data.styleTags,
            isTutorial: data.isTutorial,
            family: data.family,
            style: data.style,
          },
        })

        // Re-importing an opening (e.g. after reviewing it on Lichess) replaces its lessons
        // instead of appending a second copy. Cascades remove their exercises, moves and the
        // students' progress on them.
        await tx.lesson.deleteMany({ where: { openingId: opening.id } })

        // Ids are made here so the whole study goes in three bulk inserts. One insert per move
        // is a round trip each, and against a remote database (production) a study of 15
        // lessons outlived the transaction timeout.
        const nextId = orderedIds()
        const lessons: Prisma.LessonCreateManyInput[] = []
        const exercises: Prisma.ExerciseCreateManyInput[] = []
        const moves: Prisma.MoveCreateManyInput[] = []
        for (const lessonData of data.lessons) {
          const lessonId = nextId()
          lessons.push({ id: lessonId, title: lessonData.title, order: lessonData.order, branch: lessonData.branch, openingId: opening.id })
          for (const ex of lessonData.exercises) {
            const exerciseId = nextId()
            exercises.push({
              id: exerciseId,
              title: ex.title,
              type: ex.type,
              cardKind: ex.cardKind,
              description: ex.description,
              lessonId,
              initialFen: ex.initialFen,
            })
            collectMoves(ex.moves, exerciseId, null, moves, nextId)
          }
        }
        await tx.lesson.createMany({ data: lessons })
        await tx.exercise.createMany({ data: exercises })
        // Parents come before their children in the list, so each row's parent already exists.
        await tx.move.createMany({ data: moves })

        return { id: opening.id, name: opening.name }
      },
      { timeout: 120_000 },
    )
  }
}
function collectMoves(
  nodes: IngestMoveNode[],
  exerciseId: string,
  parentId: string | null,
  out: Prisma.MoveCreateManyInput[],
  nextId: () => string,
): void {
  for (const node of nodes) {
    const id = nextId()
    out.push({
      id,
      san: node.san,
      fen: node.fen,
      absoluteCp: node.absoluteCp ?? null,
      complexity: node.complexity ?? 'BAIXA',
      isOpponentResponse: node.isOpponentResponse,
      coachInsights: node.coachInsights ? JSON.parse(JSON.stringify(node.coachInsights)) : undefined,
      visualMarkers: node.visualMarkers ? JSON.parse(JSON.stringify(node.visualMarkers)) : undefined,
      exerciseId,
      parentId,
    })
    collectMoves(node.children, exerciseId, id, out, nextId)
  }
}

// The lesson endpoint orders exercises and sibling moves by id (the main line is the first
// child), which works because cuids grow in creation order. Ids made here keep that: one
// timestamp per import plus a counter, so they sort in the order they are handed out.
export function orderedIds(): () => string {
  const stamp = Date.now().toString(36).padStart(9, '0')
  const salt = randomBytes(4).toString('hex')
  let seq = 0
  return () => `c${stamp}${(seq++).toString(36).padStart(6, '0')}${salt}`
}
