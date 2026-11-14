import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { AUTHOR_SYSTEM_PROMPT, REVIEWER_SYSTEM_PROMPT } from './author/prompt'
import { ChapterAnnotation, ReviewResult } from './author/schema'
import type { Chapter } from './chess/types'
import { buildOutputs, prepareChapter, type ChapterResult, type PrepareDeps } from './pipeline'
import { verifyAnnotation, type Issue } from './verify'

// Agent mode: the author and the reviewer are Claude Code agents instead of paid API calls.
// The command writes each chapter's dossier to a folder; an agent writes the annotation JSON
// beside it; the next run checks it with the same verifier the API mode uses, writes what is
// still wrong for the agent to fix, and builds the PGN. The verifier, not the agent, decides
// when a chapter is done, and whatever is not done reaches the PGN marked [REVISAR.

export type AgentState =
  | 'pendente' // no annotation yet
  | 'json-invalido' // the annotation does not parse or does not match the schema
  | 'com-problemas' // the verifier found issues
  | 'aguardando-revisao' // verified; no review newer than the annotation
  | 'revisao-com-erros' // the latest review found errors
  | 'pronto'

export interface AgentStatus {
  file: string // the chapter's file prefix, e.g. "cap03"
  title: string
  state: AgentState
  issues: Issue[]
  reviewErrors: number
  warnings: number
}

export interface AgentFiles {
  prefix: string
  dossier: string
  annotation: string
  review: string
  problems: string
}

export function agentFiles(dir: string, chapter: Chapter): AgentFiles {
  const prefix = `cap${String(chapter.index + 1).padStart(2, '0')}`
  const at = (suffix: string) => path.join(dir, `${prefix}.${suffix}`)
  return {
    prefix,
    dossier: at('dossie.json'),
    annotation: at('anotacao.json'),
    review: at('revisao.json'),
    problems: at('problemas.md'),
  }
}

const EMPTY: ChapterAnnotation = { notes: [], whyNot: [], cards: [], plan: '' }

export async function processChapterWithAgent(
  chapter: Chapter,
  deps: PrepareDeps,
  dir: string,
): Promise<{ result: ChapterResult; status: AgentStatus }> {
  const prepared = await prepareChapter(chapter, deps)
  const { cards, dossier, dossierMap, verifyCtx, report } = prepared
  const files = agentFiles(dir, chapter)
  await writeFile(files.dossier, dossier)

  const status: AgentStatus = { file: files.prefix, title: chapter.title, state: 'pendente', issues: [], reviewErrors: 0, warnings: 0 }
  const read = await readJson(files.annotation, ChapterAnnotation)

  let annotation: ChapterAnnotation | null = null
  let reviewIssues: Issue[] = []
  let formatError: string | null = null
  if (read.kind === 'invalid') {
    status.state = 'json-invalido'
    formatError = read.error
  } else if (read.kind === 'ok') {
    annotation = read.value
    status.issues = verifyAnnotation(annotation, verifyCtx)
    status.state = status.issues.length > 0 ? 'com-problemas' : 'aguardando-revisao'
    if (status.issues.length === 0 && (await isNewer(files.review, files.annotation))) {
      const review = await readJson(files.review, ReviewResult)
      if (review.kind === 'ok') {
        report.review = review.value.issues
        reviewIssues = review.value.issues.filter((i) => i.severity === 'error').map((i) => ({ nodeId: i.nodeId, message: i.problem }))
        status.reviewErrors = reviewIssues.length
        status.warnings = review.value.issues.length - reviewIssues.length
        status.state = reviewIssues.length > 0 ? 'revisao-com-erros' : 'pronto'
      }
    }
  }
  report.rounds.push({ label: 'agente', issues: status.issues.length })

  // Without a usable annotation every node is flagged ("falta a nota..."), so the importer
  // refuses the chapter instead of letting an uncommented one through.
  const flagged = annotation ? status.issues : verifyAnnotation(EMPTY, verifyCtx)
  report.unresolved = flagged
  await writeFile(files.problems, renderProblems(status, formatError, report.review))

  return {
    result: { outputs: buildOutputs(chapter, cards, dossierMap, annotation, flagged, reviewIssues, report), report, dossier },
    status,
  }
}

type ReadResult<T> = { kind: 'missing' } | { kind: 'invalid'; error: string } | { kind: 'ok'; value: T }

async function readJson<T extends z.ZodType>(file: string, schema: T): Promise<ReadResult<z.infer<T>>> {
  let text: string
  try {
    text = await readFile(file, 'utf8')
  } catch {
    return { kind: 'missing' }
  }
  try {
    const parsed = schema.safeParse(JSON.parse(text))
    if (parsed.success) return { kind: 'ok', value: parsed.data }
    return { kind: 'invalid', error: z.prettifyError(parsed.error) }
  } catch (error) {
    return { kind: 'invalid', error: error instanceof Error ? error.message : String(error) }
  }
}

async function isNewer(file: string, than: string): Promise<boolean> {
  try {
    const [a, b] = await Promise.all([stat(file), stat(than)])
    return a.mtimeMs > b.mtimeMs
  } catch {
    return false
  }
}

const STATE_TEXT: Record<AgentState, string> = {
  pendente: 'ainda sem anotação: escreva o arquivo .anotacao.json',
  'json-invalido': 'o .anotacao.json não segue o formato: corrija e rode de novo',
  'com-problemas': 'o verificador encontrou problemas: corrija-os (devolva o arquivo inteiro) e rode de novo',
  'aguardando-revisao': 'passou no verificador: falta a revisão independente (.revisao.json)',
  'revisao-com-erros': 'a revisão encontrou erros: o autor corrige e o revisor revisa de novo',
  pronto: 'pronto: passou no verificador e na revisão',
}

function renderProblems(status: AgentStatus, formatError: string | null, review: ReviewResult['issues']): string {
  const lines = [`# ${status.file} — ${status.title}`, '', `Estado: **${status.state}** (${STATE_TEXT[status.state]})`, '']
  if (formatError) lines.push('## Erro de formato', '', '```', formatError, '```', '')
  if (status.issues.length > 0) {
    lines.push('## Problemas do verificador', '')
    for (const issue of status.issues) lines.push(`- [${issue.nodeId}] ${issue.message}`)
    lines.push('')
  }
  if (review.length > 0) {
    lines.push('## Revisão independente', '')
    for (const issue of review) lines.push(`- [${issue.nodeId}] (${issue.severity === 'error' ? 'erro' : 'aviso'}) ${issue.problem}`)
    lines.push('')
  }
  return lines.join('\n')
}

// The same rules the API author gets (one source of truth: author/prompt.ts), plus the file
// format, so the agent's output is checked exactly like the model's.
export function renderAuthorInstructions(styleExamples: string): string {
  return [
    '# Instruções do autor (geradas pelo lessons:generate --agente; não edite)',
    '',
    AUTHOR_SYSTEM_PROMPT,
    '',
    styleExamples ? `## Exemplos de comentários do próprio autor (siga o estilo e o nível de detalhe)\n\n${styleExamples}` : '',
    '## Formato do arquivo capNN.anotacao.json',
    '',
    'Um único objeto JSON (sem texto fora dele) que valide contra este JSON Schema:',
    '',
    '```json',
    JSON.stringify(z.toJSONSchema(ChapterAnnotation), null, 1),
    '```',
    '',
    '- `nodeId` e `cardId`: os ids exatos do capNN.dossie.json (`nos[].id`, `cartoes[].cardId` e os `nos` de cada cartão).',
    '- `claims[].piece`: peça em notação portuguesa + casa ("Cf3"), casa pura para peão ("e4"), `null` em claims de avaliação.',
    '- `claims[].verdict`: só em claims "evaluation"; `null` nas outras.',
    '- `whyNot`: sempre `[]`.',
  ].join('\n')
}

export function renderReviewerInstructions(): string {
  return [
    '# Instruções do revisor (geradas pelo lessons:generate --agente; não edite)',
    '',
    REVIEWER_SYSTEM_PROMPT,
    '',
    '## Formato do arquivo capNN.revisao.json',
    '',
    '```json',
    JSON.stringify(z.toJSONSchema(ReviewResult), null, 1),
    '```',
    '',
    '- `nodeId`: o id do nó do dossiê, o `cardId` de um cartão, ou "plan" para o plano.',
    '- Sem problemas: `{"issues": []}`.',
  ].join('\n')
}
