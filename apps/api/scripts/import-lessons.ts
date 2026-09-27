// Imports reviewed PGN files (e.g. the lesson-author output) straight into the database the
// DATABASE_URL points at, through the same use case as the admin import screen. The screen only
// takes a Lichess study URL; this takes local files.
//
//   pnpm lessons:import out/lesson-author/bispo-cap1.revisado.pgn out/lesson-author/bispo-cap14.revisado.pgn
//   pnpm lessons:import content/primeiros-passos.pgn --tutorial
//
// Re-importing an opening replaces all of its lessons (and the students' progress on them), so
// every chapter of an opening must go in the same call.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { ContentNotReviewedError, IngestStudy } from '@chess-openings/domain'
import { PrismaService } from '../src/infrastructure/prisma.service'
import { PgnParserService } from '../src/infrastructure/services/pgn-parser.service'
import { EngineService } from '../src/infrastructure/services/engine.service'
import { CoachService } from '../src/infrastructure/services/coach.service'
import { PrismaContentRepository } from '../src/infrastructure/repositories/prisma-content.repository'

const USAGE = `Uso: pnpm lessons:import <arquivo.pgn>... [--tutorial] [--nome "Nome da abertura"]

  --tutorial   conteúdo de tutorial: aparece no catálogo, mas fica fora das revisões
  --nome       nome da abertura (padrão: o StudyName do PGN)

Todos os capítulos de uma abertura vão na mesma chamada: reimportar substitui as lições.`

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      tutorial: { type: 'boolean', default: false },
      nome: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help || positionals.length === 0) {
    console.log(USAGE)
    process.exit(values.help ? 0 : 1)
  }

  // Say where the data is going before writing anything: the same command imports locally
  // and into production, depending only on DATABASE_URL.
  const target = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null
  console.log(`Banco: ${target ? `${target.hostname}:${target.port}${target.pathname}` : '(DATABASE_URL do .env)'}`)

  const pgn = positionals.map((file) => readFileSync(resolve(file), 'utf8').trim()).join('\n\n')
  const prisma = new PrismaService()
  await prisma.$connect()
  try {
    const useCase = new IngestStudy(new PgnParserService(), new EngineService(), new CoachService(), new PrismaContentRepository(prisma))
    const { id, name } = await useCase.execute(pgn, {
      useAuthorComments: true,
      tutorial: values.tutorial,
      openingName: values.nome,
    })

    const lessons = await prisma.lesson.findMany({
      where: { openingId: id },
      orderBy: { order: 'asc' },
      select: { title: true, _count: { select: { exercises: true } } },
    })
    console.log(`\n${name}${values.tutorial ? ' (tutorial)' : ''}: ${lessons.length} lição(ões)`)
    for (const lesson of lessons) console.log(`  ${lesson.title} — ${lesson._count.exercises} exercício(s)`)
  } catch (error) {
    if (error instanceof ContentNotReviewedError) {
      console.error(`\n${error.message}\n${error.pending.map((p) => `  - ${p}`).join('\n')}`)
      process.exit(1)
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
