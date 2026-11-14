// Imports reviewed PGN files (e.g. the lesson-author output) straight into the database the
// DATABASE_URL points at, through the same use case as the admin import screen. The screen only
// takes a Lichess study URL; this takes local files.
//
//   pnpm lessons:import out/lesson-author/bispo-cap1.revisado.pgn out/lesson-author/bispo-cap14.revisado.pgn
//   pnpm lessons:import content/primeiros-passos.pgn --tutorial
//   pnpm lessons:import out/lesson-author/bispo.pgn --check   (only checks the format, no database)
//   pnpm lessons:import out/lesson-author/bispo-tatico.pgn --familia "Abertura do Bispo" --estilo tatico
//
// Re-importing an opening replaces all of its lessons (and the students' progress on them), so
// every chapter of an opening must go in the same call. A path of a family is an opening of its
// own: re-importing it replaces only that path.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  ContentNotReviewedError,
  IngestStudy,
  OPENING_STYLE_LABELS,
  parseOpeningStyle,
  type IContentRepository,
  type IngestMoveNode,
  type IngestOptions,
  type IngestStudyData,
} from '@chess-openings/domain'
import { PrismaService } from '../src/infrastructure/prisma.service'
import { PgnParserService } from '../src/infrastructure/services/pgn-parser.service'
import { EngineService } from '../src/infrastructure/services/engine.service'
import { CoachService } from '../src/infrastructure/services/coach.service'
import { PrismaContentRepository } from '../src/infrastructure/repositories/prisma-content.repository'

const USAGE = `Uso: pnpm lessons:import <arquivo.pgn>... [--tutorial] [--nome "Nome da abertura"]
                          [--familia "Nome da abertura" --estilo posicional|equilibrado|tatico] [--check]

  --tutorial   conteúdo de tutorial: aparece no catálogo, mas fica fora das revisões
  --nome       nome da abertura (padrão: o StudyName do PGN)
  --familia    importa um caminho de uma abertura com vários estilos; vai junto com --estilo e
               dá o nome "<família> — <Estilo>" (ignora --nome)
  --estilo     o caminho: posicional, equilibrado ou tatico
  --check      só confere o formato com o importador de verdade, sem banco e sem rede: lista
               lições, exercícios e cartões e aponta cartão solto, lição ou cartão vazio,
               cartão sem pergunta e marcas [REVISAR

Todos os capítulos de uma abertura vão na mesma chamada: reimportar substitui as lições.`

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      tutorial: { type: 'boolean', default: false },
      nome: { type: 'string' },
      familia: { type: 'string' },
      estilo: { type: 'string' },
      check: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help || positionals.length === 0) {
    console.log(USAGE)
    process.exit(values.help ? 0 : 1)
  }

  const style = values.estilo === undefined ? undefined : parseOpeningStyle(values.estilo)
  if (style === null) {
    console.error(`Estilo desconhecido: "${values.estilo}". Use posicional, equilibrado ou tatico.`)
    process.exit(1)
  }
  if (Boolean(values.familia) !== Boolean(style)) {
    console.error('--familia e --estilo vão juntos: um caminho precisa dos dois.')
    process.exit(1)
  }

  const pgn = positionals.map((file) => readFileSync(resolve(file), 'utf8').trim()).join('\n\n')
  const options: IngestOptions = {
    useAuthorComments: true,
    tutorial: values.tutorial,
    openingName: values.nome,
    family: values.familia,
    style,
  }
  if (values.check) process.exit(await checkFormat(pgn, options))

  // Say where the data is going before writing anything: the same command imports locally
  // and into production, depending only on DATABASE_URL.
  const target = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null
  console.log(`Banco: ${target ? `${target.hostname}:${target.port}${target.pathname}` : '(DATABASE_URL do .env)'}`)

  const prisma = new PrismaService()
  await prisma.$connect()
  try {
    const useCase = new IngestStudy(new PgnParserService(), new EngineService(), new CoachService(), new PrismaContentRepository(prisma))
    const { id, name } = await useCase.execute(pgn, options)

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

const countMoves = (nodes: IngestMoveNode[]): number => nodes.reduce((n, node) => n + 1 + countMoves(node.children), 0)

// Runs the real IngestStudy (same parser, same grouping of cards into lessons) against a
// repository that only captures what would be saved, with no engine or coach calls.
async function checkFormat(pgn: string, options: IngestOptions): Promise<number> {
  const captured: IngestStudyData[] = []
  const repo: IContentRepository = {
    upsertStudy: async (data) => {
      captured.push(data)
      return { id: 'check', name: data.openingName }
    },
  }
  const noEngine = { getEvaluationsBatch: async () => ({}) }
  const noCoach = { generateExplanationsBatch: async () => ({}) }
  try {
    await new IngestStudy(new PgnParserService(), noEngine, noCoach, repo).execute(pgn, options)
  } catch (error) {
    if (error instanceof ContentNotReviewedError) {
      console.error(`FORMATO: ${error.message}\n${error.pending.slice(0, 30).map((p) => `  - ${p}`).join('\n')}`)
      return 1
    }
    throw error
  }
  const [data] = captured

  const problems: string[] = []
  const path = data.family && data.style ? `, família ${data.family}, caminho ${OPENING_STYLE_LABELS[data.style]}` : ''
  console.log(`${data.openingName} (slug ${data.openingSlug}${path}): ${data.lessons.length} lição(ões)`)
  for (const lesson of data.lessons) {
    const [theory, ...rest] = lesson.exercises
    const cards = rest.filter((e) => e.cardKind)
    const branch = lesson.branch ? ` [ramo ${lesson.branch}]` : ''
    console.log(`  ${lesson.order}. ${lesson.title}${branch} — ${countMoves(theory.moves)} lances, ${cards.length} cartão(ões)`)
    // A card or practice title as a lesson means it did not find the lesson it belongs to.
    if (/ \| (cr[ií]tica|armadilha|pr[aá]tica)\b/i.test(lesson.title)) problems.push(`cartão sem lição de mesmo título: "${lesson.title}"`)
    if (countMoves(theory.moves) === 0) problems.push(`lição sem lances: "${lesson.title}"`)
    for (const card of cards) {
      if (!card.description?.trim()) problems.push(`cartão sem pergunta: "${lesson.title} | ${card.title}"`)
      if (countMoves(card.moves) === 0) problems.push(`cartão sem lances: "${lesson.title} | ${card.title}"`)
    }
  }
  if (problems.length > 0) {
    console.error(`\nFORMATO: ${problems.length} problema(s)\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    return 1
  }
  console.log('\nFormato OK: o app importa este PGN como está.')
  return 0
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
