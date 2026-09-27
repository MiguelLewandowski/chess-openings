import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_CARDS } from './cards'
import { DEFAULT_ENRICH, Enricher } from './enrich'
import { UsageTracker, type Effort } from './author/claude'
import { processChapter, type ChapterReport } from './pipeline'
import { readRepertoireText } from './pgn/lines'
import { loadPgnSource, readChapters } from './pgn/read'
import { writePgn, type ChapterOutput } from './pgn/write'
import { renderReport } from './report'
import { createEngine, createExplorer, packageDir, repoRoot, userCwd } from './setup'

const HELP = `
Gera o rascunho anotado de um repertório a partir de um estudo da Lichess.

Uso:
  pnpm lessons:generate --source <url-do-estudo | arquivo.pgn | repertorio.txt> [opções]

Opções:
  --out <arquivo.pgn>       onde gravar o PGN (padrão: out/lesson-author/<nome>.pgn)
  --chapters 1,3            só estes capítulos (1 = primeiro)
  --model <id>              modelo que escreve (padrão: claude-opus-5)
  --review-model <id>       modelo da revisão independente (padrão: o mesmo)
  --effort <nível>          low | medium | high | xhigh | max (padrão: high)
  --fix-rounds <n>          rodadas de correção com o verificador (padrão: 2)
  --no-review               pula a revisão independente
  --review-fix-rounds <n>   vezes que a revisão volta para correção antes da revisão final (padrão: 1)
  --max-critical <n>        cartões de posição crítica por capítulo (padrão: 2)
  --max-traps <n>           cartões de armadilha por capítulo (padrão: 2)
  --stockfish <caminho>     executável do Stockfish (ou STOCKFISH_PATH)
  --depth <n>               profundidade do Stockfish (padrão: 20)
  --style <arquivo.md>      exemplos de estilo (padrão: tools/lesson-author/style/exemplos.md)
  --dry-run                 faz tudo menos chamar a IA: dossiês, cartões e estimativa de custo

Variáveis de ambiente: ANTHROPIC_API_KEY, LICHESS_TOKEN (explorer), STOCKFISH_PATH.
`

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      source: { type: 'string' },
      out: { type: 'string' },
      chapters: { type: 'string' },
      model: { type: 'string', default: 'claude-opus-5' },
      'review-model': { type: 'string' },
      effort: { type: 'string', default: 'high' },
      'fix-rounds': { type: 'string', default: '2' },
      'no-review': { type: 'boolean', default: false },
      'review-fix-rounds': { type: 'string', default: '1' },
      'max-critical': { type: 'string', default: String(DEFAULT_CARDS.maxCritical) },
      'max-traps': { type: 'string', default: String(DEFAULT_CARDS.maxTraps) },
      stockfish: { type: 'string' },
      depth: { type: 'string', default: '20' },
      style: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  if (values.help || !values.source) {
    console.log(HELP)
    process.exit(values.help ? 0 : 1)
  }

  const log = (message: string) => console.error(message)
  const dryRun = values['dry-run']
  if (!dryRun && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error('Defina ANTHROPIC_API_KEY (ou rode com --dry-run para simular sem IA).')
  }

  const lichessToken = process.env.LICHESS_TOKEN
  const engine = createEngine({ stockfish: values.stockfish, depth: Number(values.depth), log })
  const explorer = createExplorer(log)

  const source = /lichess\.org/.test(values.source) ? values.source : path.resolve(userCwd, values.source)
  log(`Lendo ${source}...`)
  // A .txt is a repertoire typed as plain lines (see pgn/lines.ts); anything else is PGN.
  const allChapters = source.toLowerCase().endsWith('.txt')
    ? readRepertoireText(await readFile(source, 'utf8')).chapters
    : readChapters(await loadPgnSource(source, lichessToken))
  const wanted = values.chapters?.split(',').map((n) => Number(n.trim()) - 1)
  const chapters = wanted ? allChapters.filter((c) => wanted.includes(c.index)) : allChapters
  if (chapters.length === 0) throw new Error('Nenhum capítulo encontrado.')

  const stylePath = values.style ? path.resolve(userCwd, values.style) : path.join(packageDir, 'style', 'exemplos.md')
  const styleExamples = await readFile(stylePath, 'utf8').catch(() => '')

  const usage = new UsageTracker()
  const deps = {
    enricher: new Enricher(engine, explorer, DEFAULT_ENRICH),
    engine,
    explorerAvailable: explorer.available,
    claude: dryRun
      ? null
      : {
          client: new Anthropic(),
          config: { model: values.model, reviewModel: values['review-model'] ?? values.model, effort: values.effort as Effort },
          usage,
        },
    styleExamples,
    cardOptions: { ...DEFAULT_CARDS, maxCritical: Number(values['max-critical']), maxTraps: Number(values['max-traps']) },
    fixRounds: Number(values['fix-rounds']),
    review: !values['no-review'],
    reviewFixRounds: Number(values['review-fix-rounds']),
    log,
  }

  const baseName = slug(chapters[0].studyName ?? (chapters[0].title.split(':')[0] || 'estudo'))
  const outPath = values.out ? path.resolve(userCwd, values.out) : path.join(repoRoot, 'out', 'lesson-author', `${baseName}.pgn`)
  await mkdir(path.dirname(outPath), { recursive: true })

  const outputs: ChapterOutput[] = []
  const reports: ChapterReport[] = []
  const dossiers: Record<string, unknown> = {}
  try {
    for (const chapter of chapters) {
      const result = await processChapter(chapter, deps)
      outputs.push(...result.outputs)
      reports.push(result.report)
      dossiers[chapter.title] = JSON.parse(result.dossier)
      // Saved after every chapter: if a later one fails (e.g. out of API credits), what was
      // already paid for is kept.
      await writeFile(outPath, writePgn(outputs))
    }
  } finally {
    await engine.close()
  }
  const reportPath = outPath.replace(/\.pgn$/, '.relatorio.md')
  await writeFile(
    reportPath,
    renderReport({
      source,
      output: outPath,
      model: dryRun ? null : values.model,
      engine: engine.name,
      explorer: explorer.available,
      chapters: reports,
      usage: dryRun ? null : usage,
    }),
  )
  const dossierPath = outPath.replace(/\.pgn$/, '.dossie.json')
  await writeFile(dossierPath, JSON.stringify(dossiers, null, 1))

  log(`\nPGN: ${outPath}\nRelatório: ${reportPath}\nDossiê (o que a IA recebe): ${dossierPath}`)
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `Erro: ${error.message}` : error)
  process.exit(1)
})
