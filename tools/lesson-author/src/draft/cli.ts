import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { Chess } from 'chess.js'
import { sanFromPt } from '../chess/notation'
import type { Color } from '../chess/types'
import { readRepertoireText, tokenize } from '../pgn/lines'
import { allNodes } from '../pgn/read'
import { ratingBuckets } from '../sources/explorer'
import { cache, createEngine, createExplorer, packageDir, resolveUserPath } from '../setup'
import { DEFAULT_DRAFT, positionKey, RepertoireBuilder } from './build'
import { splitChapters } from './chapters'
import { loadOpeningNames } from './names'
import { renderRepertoire } from './render'

const HELP = `
Gera o rascunho de um repertório (.txt) a partir de dados: o que se joga de verdade na
faixa de rating escolhida (explorer da Lichess) e a engine para os nossos lances, incluindo
as linhas de punição quando o adversário erra. Nenhuma IA escolhe lances.

Uso:
  pnpm lessons:draft --inicio "1.e4 e5 2.Bc4" --cor brancas --nome "Abertura do Bispo" [opções]

Opções:
  --inicio <lances>        lances que definem a abertura (obrigatório)
  --cor brancas|pretas     lado do aluno (padrão: quem joga o último lance de --inicio)
  --nome <texto>           nome da abertura (padrão: o próprio --inicio)
  --licoes <n>             quantos capítulos (lições) buscar (padrão: 15)
  --rating <de-até>        faixa dos adversários no explorer (padrão: 1000-1600)
  --base <arquivo.txt>     repertório já aprovado: os nossos lances dele têm prioridade
  --ate-lance <n>          até que lance da partida as linhas vão (padrão: 10)
  --min-freq <0-1>         frequência mínima de uma resposta do adversário (padrão: 0.05)
  --max-respostas <n>      respostas do adversário por posição (padrão: 4)
  --min-alcance <0-1>      corta linhas que menos desta fração das partidas alcançam (padrão: 0.003)
  --erro-cp <n>            quanto (em centésimos de peão) um lance precisa perder para virar
                           linha de punição (padrão: 100 = um peão)
  --stockfish <caminho>    executável do Stockfish (ou STOCKFISH_PATH)
  --depth <n>              profundidade do Stockfish (padrão: 18)
  --out <arquivo.txt>      onde gravar (padrão: tools/lesson-author/repertorios/<nome>.txt)

Precisa de LICHESS_TOKEN (o explorer exige token). Stockfish local é muito recomendado.
`

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      inicio: { type: 'string' },
      cor: { type: 'string' },
      nome: { type: 'string' },
      licoes: { type: 'string', default: '15' },
      rating: { type: 'string', default: '1000-1600' },
      base: { type: 'string' },
      'ate-lance': { type: 'string', default: '10' },
      'min-freq': { type: 'string', default: String(DEFAULT_DRAFT.minShare) },
      'max-respostas': { type: 'string', default: String(DEFAULT_DRAFT.maxReplies) },
      'min-alcance': { type: 'string', default: String(DEFAULT_DRAFT.minReach) },
      'erro-cp': { type: 'string', default: String(DEFAULT_DRAFT.mistakeCp) },
      stockfish: { type: 'string' },
      depth: { type: 'string', default: '18' },
      out: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help || !values.inicio) {
    console.log(HELP)
    process.exit(values.help ? 0 : 1)
  }

  const log = (message: string) => console.error(message)
  if (!process.env.LICHESS_TOKEN) throw new Error('Defina LICHESS_TOKEN: sem o explorer não há como saber o que se joga.')

  const start = parseStart(values.inicio)
  const student: Color = values.cor ? parseColor(values.cor) : start.lastColor
  const name = values.nome ?? values.inicio
  const buckets = ratingBuckets(values.rating)
  const ratingLabel = `${buckets[0]}–${buckets[buckets.length - 1] + 199}`
  const base = values.base ? await loadBase(resolveUserPath(values.base), student) : new Map<string, string>()

  const engine = createEngine({ stockfish: values.stockfish, depth: Number(values.depth), log })
  const explorer = createExplorer(log, buckets)
  const options = {
    ...DEFAULT_DRAFT,
    maxPlies: Number(values['ate-lance']) * 2,
    minShare: Number(values['min-freq']),
    maxReplies: Number(values['max-respostas']),
    minReach: Number(values['min-alcance']),
    mistakeCp: Number(values['erro-cp']),
  }

  log(`Montando o repertório de ${name} (${student === 'w' ? 'brancas' : 'pretas'}), adversários de ${ratingLabel}...`)
  const builder = new RepertoireBuilder(engine, explorer, student, base, options, ({ positions }) => {
    if (positions % 20 === 0) log(`  posições analisadas: ${positions}`)
  })
  let roots
  try {
    roots = await builder.build(start.sans)
  } finally {
    await engine.close()
  }

  const names = await loadOpeningNames(cache)
  const chapters = splitChapters(roots, start.sans.length, Number(values.licoes), names, ratingLabel)
  const text = renderRepertoire({
    name,
    student,
    chapters,
    settings: [
      `início: ${values.inicio} | adversários: ${ratingLabel} (Lichess, blitz/rápidas/clássicas)`,
      `respostas com ≥ ${Math.round(options.minShare * 100)}% das partidas, até ${options.maxReplies} por posição, até o lance ${values['ate-lance']}`,
      base.size > 0 ? `base: ${values.base} (${base.size} posições com lance nosso definido)` : 'sem repertório base',
      `gerado em ${new Date().toISOString().slice(0, 10)}`,
    ],
  })

  const out = values.out
    ? resolveUserPath(values.out)
    : path.join(packageDir, 'repertorios', `${slug(name)}.txt`)
  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, text)

  // The file must be something the generator accepts; fail here rather than later.
  const check = readRepertoireText(text)
  const lines = chapters.reduce((s, c) => s + c.lines.length, 0)
  const traps = chapters.reduce((s, c) => s + c.lines.filter((l) => l.note).length, 0)
  log(`\n${check.chapters.length} capítulos, ${lines} linhas (${traps} de punição a erros do adversário).`)
  log(`Rascunho: ${out}`)
}

function parseStart(text: string): { sans: string[]; lastColor: Color } {
  const chess = new Chess()
  const sans: string[] = []
  for (const { move: token } of tokenize(text)) {
    let move
    for (const candidate of [sanFromPt(token), token]) {
      try {
        move = chess.move(candidate)
        break
      } catch {
        // try the other notation
      }
    }
    if (!move) throw new Error(`"${token}" não é um lance legal em --inicio`)
    sans.push(move.san)
  }
  if (sans.length === 0) throw new Error('--inicio precisa de pelo menos um lance')
  return { sans, lastColor: sans.length % 2 === 1 ? 'w' : 'b' }
}

function parseColor(value: string): Color {
  const v = value.trim().toLowerCase()
  if (['brancas', 'white', 'w'].includes(v)) return 'w'
  if (['pretas', 'black', 'b'].includes(v)) return 'b'
  throw new Error(`--cor "${value}" inválida (use brancas ou pretas)`)
}

// Our moves in a reviewed repertoire, by position, so the draft keeps the chosen system.
async function loadBase(file: string, student: Color): Promise<Map<string, string>> {
  const base = new Map<string, string>()
  for (const chapter of readRepertoireText(await readFile(file, 'utf8')).chapters) {
    for (const node of allNodes(chapter.roots)) {
      if (node.color === student && !base.has(positionKey(node.fenBefore))) base.set(positionKey(node.fenBefore), node.san)
    }
  }
  return base
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
