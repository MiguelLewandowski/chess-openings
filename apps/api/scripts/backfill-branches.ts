// Computes the branch of every lesson already in the database, with the same rule the import
// uses (branchOf over the main line of each lesson's theory). Re-importing would do the same,
// but it replaces the lessons and wipes the students' progress on them; this only writes
// Lesson.branch, so it is safe to run again.
//
//   pnpm lessons:branches            (writes)
//   pnpm lessons:branches --dry-run  (only lists what would change)
import { parseArgs } from 'node:util'
import { branchOf, mainLine } from '@chess-openings/domain'
import { PrismaService } from '../src/infrastructure/prisma.service'

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean', default: false } } })
  const dryRun = values['dry-run']
  const prisma = new PrismaService()

  try {
    const openings = await prisma.opening.findMany({
      select: {
        name: true,
        lessons: {
          select: {
            id: true,
            title: true,
            branch: true,
            exercises: {
              where: { type: 'THEORY', cardKind: null },
              select: { initialFen: true, moves: { select: { id: true, parentId: true, san: true, fen: true } } },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    let changed = 0
    for (const opening of openings) {
      const lines = opening.lessons.map((lesson) => {
        const theory = lesson.exercises[0]
        return { initialFen: theory?.initialFen ?? null, sans: theory ? mainLine(theory.moves).map((m) => m.san) : [] }
      })
      const branches = branchOf(lines)
      console.log(`${opening.name}: ${new Set(branches).size} ramo(s)`)

      for (const [i, lesson] of opening.lessons.entries()) {
        const branch = branches[i]
        console.log(`  ${lesson.title} — ${branch ?? 'sem ramo'}`)
        if (branch === lesson.branch) continue
        changed += 1
        if (!dryRun) await prisma.lesson.update({ where: { id: lesson.id }, data: { branch } })
      }
    }
    console.log(`\n${changed} lição(ões) ${dryRun ? 'mudariam' : 'atualizada(s)'}.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
