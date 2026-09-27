import type Anthropic from '@anthropic-ai/sdk'
import { mineCriticalPositions, mineTraps, type Card, type CardOptions } from './cards'
import { sanToPt } from './chess/notation'
import type { Chapter } from './chess/types'
import { Enricher, type NodeDossier } from './enrich'
import { AUTHOR_SYSTEM_PROMPT, REVIEWER_SYSTEM_PROMPT, renderDossier } from './author/prompt'
import { ChapterConversation, reviewChapter, type ClaudeConfig, type UsageTracker } from './author/claude'
import type { ChapterAnnotation, ReviewResult } from './author/schema'
import { allNodes, mainline } from './pgn/read'
import type { ChapterOutput, NoteOutput } from './pgn/write'
import type { Engine } from './sources/engine'
import { verifyAnnotation, type Issue } from './verify'

export interface PipelineDeps {
  enricher: Enricher
  engine: Engine
  explorerAvailable: boolean
  claude: { client: Anthropic; config: ClaudeConfig; usage: UsageTracker } | null // null = dry run
  styleExamples: string
  cardOptions: CardOptions
  fixRounds: number
  review: boolean
  // How many times the independent review's findings go back to the author to fix before
  // the final review, whose remaining errors are only marked.
  reviewFixRounds: number
  log: (message: string) => void
}

export interface ChapterReport {
  title: string
  nodes: number
  cards: Card[]
  dossierChars: number
  rounds: { label: string; issues: number }[]
  unresolved: Issue[]
  review: ReviewResult['issues']
  flagged: number
}

export interface ChapterResult {
  outputs: ChapterOutput[]
  report: ChapterReport
  dossier: string
}

export async function processChapter(chapter: Chapter, deps: PipelineDeps): Promise<ChapterResult> {
  const { log } = deps
  log(`\n▸ ${chapter.title} (aluno de ${chapter.studentColor === 'w' ? 'brancas' : 'pretas'})`)

  const dossiers = await deps.enricher.chapter(chapter, (done, total) => {
    if (done === total || done % 10 === 0) log(`  posições analisadas: ${done}/${total}`)
  })
  const byId = new Map(dossiers.map((d) => [d.node.id, d]))
  const main = mainline(chapter).map((n) => byId.get(n.id)!)

  const cards: Card[] = deps.explorerAvailable
    ? [
        ...mineCriticalPositions(chapter, main, deps.cardOptions),
        ...(await mineTraps(chapter, main, deps.engine, deps.cardOptions)),
      ]
    : []
  log(`  cartões: ${cards.length}${deps.explorerAvailable ? '' : ' (sem LICHESS_TOKEN não há dados de amadores para achá-los)'}`)

  const cardDossiers: NodeDossier[] = []
  for (const card of cards) {
    for (const node of allNodes(card.roots)) cardDossiers.push(await deps.enricher.node(node, card.studentColor, false))
  }

  const dossier = renderDossier(chapter, dossiers, cards, cardDossiers)
  const dossierMap = new Map([...dossiers, ...cardDossiers].map((d) => [d.node.id, d]))
  const lineSans = new Set([...allNodes(chapter.roots), ...cards.flatMap((c) => allNodes(c.roots))].map((n) => n.san))
  const verifyCtx = { dossiers: [...dossiers, ...cardDossiers], cards, lineSans, lastMainline: main[main.length - 1] }

  const report: ChapterReport = {
    title: chapter.title,
    nodes: dossiers.length,
    cards,
    dossierChars: dossier.length,
    rounds: [],
    unresolved: [],
    review: [],
    flagged: 0,
  }

  if (!deps.claude) {
    return { outputs: buildOutputs(chapter, cards, dossierMap, null, [], [], report), report, dossier }
  }

  const { client, config, usage } = deps.claude
  const system = deps.styleExamples
    ? `${AUTHOR_SYSTEM_PROMPT}\n\nExemplos de comentários do próprio autor (siga o estilo e o nível de detalhe):\n${deps.styleExamples}`
    : AUTHOR_SYSTEM_PROMPT

  const conversation = new ChapterConversation(client, config, system, dossier, usage)
  log(`  escrevendo com ${config.model}...`)
  let annotation = await conversation.write()
  let issues = verifyAnnotation(annotation, verifyCtx)
  report.rounds.push({ label: '1ª escrita', issues: issues.length })
  log(`  verificação: ${issues.length} problema(s)`)

  // The deterministic verifier's findings go back until it is satisfied (or out of rounds).
  const fixUntilVerified = async (stage: string) => {
    for (let round = 1; round <= deps.fixRounds && issues.length > 0; round++) {
      annotation = await conversation.fix(issues.map((i) => `[${i.nodeId}] ${i.message}`))
      issues = verifyAnnotation(annotation, verifyCtx)
      report.rounds.push({ label: `${stage}correção ${round}`, issues: issues.length })
      log(`  ${stage}correção ${round}: ${issues.length} problema(s) restante(s)`)
    }
  }
  await fixUntilVerified('')

  if (deps.review) {
    // The reviewer catches what code cannot (strategy, questions that give answers away,
    // miscounted material). Its findings, warnings included, go back to the author; the
    // last review only marks what is still wrong.
    for (let cycle = 1; ; cycle++) {
      log(`  revisão independente ${cycle} com ${config.reviewModel}...`)
      const review = await reviewChapter(client, config, REVIEWER_SYSTEM_PROMPT, dossier, annotation, usage)
      report.review = review.issues
      const errors = review.issues.filter((i) => i.severity === 'error').length
      log(`  revisão ${cycle}: ${errors} erro(s), ${review.issues.length - errors} aviso(s)`)
      if (review.issues.length === 0 || cycle > deps.reviewFixRounds) break

      annotation = await conversation.fix(
        review.issues.map((i) => `[${i.nodeId}] (revisor, ${i.severity === 'error' ? 'erro' : 'aviso'}) ${i.problem}`),
      )
      issues = verifyAnnotation(annotation, verifyCtx)
      report.rounds.push({ label: `correção da revisão ${cycle}`, issues: issues.length })
      log(`  correção da revisão ${cycle}: ${issues.length} problema(s) no verificador`)
      await fixUntilVerified(`revisão ${cycle}, `)
    }
  }
  report.unresolved = issues

  const reviewErrors = report.review.filter((i) => i.severity === 'error').map((i) => ({ nodeId: i.nodeId, message: i.problem }))
  return { outputs: buildOutputs(chapter, cards, dossierMap, annotation, issues, reviewErrors, report), report, dossier }
}

function buildOutputs(
  chapter: Chapter,
  cards: Card[],
  dossiers: Map<string, NodeDossier>,
  annotation: ChapterAnnotation | null,
  issues: Issue[],
  reviewErrors: Issue[],
  report: ChapterReport,
): ChapterOutput[] {
  const flags = new Map<string, string[]>()
  for (const issue of [...issues, ...reviewErrors]) flags.set(issue.nodeId, [...(flags.get(issue.nodeId) ?? []), issue.message])
  const flag = (id: string, text: string) => {
    const messages = flags.get(id)
    if (!messages) return text
    report.flagged += 1
    return `[REVISAR: ${messages.join('; ')}] ${text}`.trim()
  }

  const notes = new Map<string, NoteOutput>()
  const allLessonAndCardNodes = [...allNodes(chapter.roots), ...cards.flatMap((c) => allNodes(c.roots))]
  for (const node of allLessonAndCardNodes) {
    const note = annotation?.notes.find((n) => n.nodeId === node.id)
    const why = annotation?.whyNot.find((w) => w.nodeId === node.id)
    const alt = why ? dossiers.get(why.nodeId)?.alternatives.find((a) => a.id === why.alternativeId) : undefined
    const whyText = why && alt ? `Por que não ${sanToPt(alt.san)}? ${why.text}` : ''
    const text = [note?.comment ?? node.authorComment, whyText].filter(Boolean).join(' ')
    notes.set(node.id, {
      text: flag(node.id, text),
      arrows: note ? note.arrows.map((a) => `${a.color}${a.from}${a.to}`) : node.authorArrows,
      highlights: note ? note.highlights.map((h) => `${h.color}${h.square}`) : node.authorHighlights,
    })
  }

  const lesson: ChapterOutput = {
    title: chapter.title,
    studyName: chapter.studyName,
    studentColor: chapter.studentColor,
    initialFen: chapter.initialFen,
    roots: chapter.roots,
    notes,
    trailingComment: annotation?.plan ? flag('plan', `Plano: ${annotation.plan}`) : undefined,
  }

  const cardOutputs = cards.map<ChapterOutput>((card) => ({
    title: `${chapter.title} | ${card.title}`,
    studyName: chapter.studyName,
    studentColor: card.studentColor,
    initialFen: card.initialFen,
    roots: card.roots,
    notes,
    preComment: flag(card.id, annotation?.cards.find((c) => c.cardId === card.id)?.prompt ?? '(pergunta a ser escrita)'),
  }))

  return [lesson, ...cardOutputs]
}
