import type { IPgnParser, ParsedChapter, ParsedNode } from '../services/IPgnParser'
import type { IEngineService, EngineEvaluation } from '../services/IEngineService'
import type { ICoachService, CoachInsight, CoachRequest } from '../services/ICoachService'
import type { IContentRepository } from '../repositories/IContentRepository'
import type { CardKind, IngestStudyData, IngestLessonData, IngestExerciseData, IngestMoveNode } from '../entities/StudyContent'

export interface IngestOptions {
  openingName?: string
  chapterLimit?: number
  specificChapter?: number
  styleTags?: string[]
  // The study's comments were written or reviewed by a person: store them as they are
  // instead of having the coach model rewrite them.
  useAuthorComments?: boolean
}

// Left in a comment by the lesson-authoring pipeline for everything a person still has to
// check. Content with it must never reach students.
export const REVIEW_MARKER = '[REVISAR'

export class ContentNotReviewedError extends Error {
  constructor(readonly pending: string[]) {
    super(`O estudo ainda tem ${pending.length} trecho(s) marcado(s) com ${REVIEW_MARKER}. Revise-os antes de importar.`)
  }
}

// A lesson and the card chapters that belong to it.
export interface LessonChapters {
  lesson: ParsedChapter
  cards: { chapter: ParsedChapter; kind: CardKind; title: string }[]
}

export class IngestStudy {
  constructor(
    private readonly pgnParser: IPgnParser,
    private readonly engineService: IEngineService,
    private readonly coachService: ICoachService,
    private readonly contentRepo: IContentRepository,
  ) {}

  async execute(pgnString: string, options: IngestOptions = {}): Promise<{ id: string; name: string }> {
    const parsed = this.pgnParser.parseStudy(pgnString)
    const pending = findReviewMarkers(parsed)
    if (pending.length > 0) throw new ContentNotReviewedError(pending)

    const groups = applyFilters(groupLessons(parsed), options)
    if (groups.length === 0) throw new Error('No chapters found after filtering.')

    const allChapters = groups.flatMap((g) => [g.lesson, ...g.cards.map((c) => c.chapter)])
    const fensToEvaluate = allChapters.flatMap((c) => [c.initialFen, ...collectFens(c.rootNodes)])
    const coachRequests = options.useAuthorComments ? [] : groups.flatMap((g) => coachRequestsFor(g.lesson))

    const [evaluations, coachInsights] = await Promise.all([
      this.engineService.getEvaluationsBatch(fensToEvaluate, 20),
      this.coachService.generateExplanationsBatch(coachRequests, 10),
    ])

    const insights = { ...authorInsights(allChapters), ...coachInsights }
    return this.contentRepo.upsertStudy(buildStudyData(groups, evaluations, insights, options))
  }
}

// Cards are exported as chapters named "<lesson title> | Crítica: ..." or
// "<lesson title> | Armadilha: ...". They attach to the lesson with that title; anything
// else (including a card whose lesson is missing) is a lesson of its own.
export function groupLessons(chapters: ParsedChapter[]): LessonChapters[] {
  const groups: LessonChapters[] = []
  const byTitle = new Map<string, LessonChapters>()

  for (const chapter of chapters) {
    const separator = chapter.title.lastIndexOf(' | ')
    const lessonTitle = separator >= 0 ? chapter.title.slice(0, separator) : null
    const cardTitle = separator >= 0 ? chapter.title.slice(separator + 3) : ''
    const kind = cardKindOf(cardTitle)
    const owner = lessonTitle ? byTitle.get(lessonTitle) : undefined

    if (owner && kind) {
      owner.cards.push({ chapter, kind, title: cardTitle })
      continue
    }
    const group: LessonChapters = { lesson: chapter, cards: [] }
    groups.push(group)
    byTitle.set(chapter.title, group)
  }
  return groups
}

function cardKindOf(title: string): CardKind | null {
  if (/^cr[ií]tica\b/i.test(title)) return 'CRITICAL'
  if (/^armadilha\b/i.test(title)) return 'TRAP'
  return null
}

export function findReviewMarkers(chapters: ParsedChapter[]): string[] {
  const found: string[] = []
  const visit = (chapter: ParsedChapter, nodes: ParsedNode[]) => {
    for (const node of nodes) {
      if (node.originalComment.includes(REVIEW_MARKER)) found.push(`${chapter.title}: ${node.san}`)
      visit(chapter, node.children)
    }
  }
  for (const chapter of chapters) {
    if (chapter.intro.includes(REVIEW_MARKER)) found.push(`${chapter.title}: pergunta do cartão`)
    visit(chapter, chapter.rootNodes)
  }
  return found
}

function applyFilters(groups: LessonChapters[], options: IngestOptions): LessonChapters[] {
  if (options.specificChapter !== undefined && options.specificChapter > 0) {
    const index = options.specificChapter - 1
    return index < groups.length ? [groups[index]] : []
  }
  if (options.chapterLimit !== undefined && options.chapterLimit > 0) {
    return groups.slice(0, options.chapterLimit)
  }
  return groups
}

function collectFens(nodes: ParsedNode[]): string[] {
  return nodes.flatMap((node) => [node.fen, ...collectFens(node.children)])
}

function coachRequestsFor(chapter: ParsedChapter): CoachRequest[] {
  const requests: CoachRequest[] = []
  const visit = (nodes: ParsedNode[]) => {
    for (const node of nodes) {
      if (node.isMainLine) requests.push(buildCoachRequest(node, chapter.studentColor))
      visit(node.children)
    }
  }
  visit(chapter.rootNodes)
  return requests
}

function buildCoachRequest(node: ParsedNode, studentColor: 'WHITE' | 'BLACK'): CoachRequest {
  return {
    id: node.id,
    san: node.san,
    cpChangeTheme: 'Development',
    originalComment: node.originalComment,
    isOpponentResponse: node.player !== studentColor,
    playerColor: studentColor,
    tacticalContext: { pieceMoved: node.pieceMoved, capturedPiece: node.capturedPiece, isCheck: node.isCheck },
  }
}

// The study's own comments, used as they are. Coach output, when there is any, overrides
// them for the nodes it covered.
function authorInsights(chapters: ParsedChapter[]): Record<string, CoachInsight> {
  const insights: Record<string, CoachInsight> = {}
  const visit = (nodes: ParsedNode[]) => {
    for (const node of nodes) {
      if (node.originalComment) insights[node.id] = { comment: node.originalComment, theme: 'Autor' }
      visit(node.children)
    }
  }
  for (const chapter of chapters) visit(chapter.rootNodes)
  return insights
}

function buildStudyData(
  groups: LessonChapters[],
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
  options: IngestOptions,
): IngestStudyData {
  const first = groups[0].lesson
  const openingName = options.openingName || first.studyName || first.title || 'Unknown Opening'
  return {
    openingName,
    openingSlug: slugify(openingName),
    styleTags: options.styleTags ?? [],
    lessons: groups.map((group, i) => buildLesson(group, i, evaluations, insights)),
  }
}

function buildLesson(
  group: LessonChapters,
  index: number,
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
): IngestLessonData {
  const { lesson } = group
  return {
    title: lesson.title,
    order: index + 1,
    initialFen: lesson.initialFen,
    exercises: [
      buildExercise(lesson, `${lesson.title} - Theory`, 'THEORY', null, evaluations, insights),
      buildExercise(lesson, `${lesson.title} - Practice`, 'PRACTICE', null, evaluations, insights),
      ...group.cards.map((card) => buildExercise(card.chapter, card.title, 'PRACTICE', card.kind, evaluations, insights)),
    ],
  }
}

function buildExercise(
  chapter: ParsedChapter,
  title: string,
  type: 'THEORY' | 'PRACTICE',
  cardKind: CardKind | null,
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
): IngestExerciseData {
  // The main practice replays the line without comments (they would give the moves away);
  // a card keeps them, since each one is shown only after the move it explains.
  const withComments = type === 'THEORY' || cardKind !== null
  return {
    title,
    type,
    cardKind,
    description: cardKind ? chapter.intro || null : null,
    initialFen: chapter.initialFen,
    moves: buildMoveNodes(chapter.rootNodes, chapter.studentColor, evaluations, insights, type === 'PRACTICE', withComments),
  }
}

function buildMoveNodes(
  nodes: ParsedNode[],
  studentColor: 'WHITE' | 'BLACK',
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
  mainLineOnly: boolean,
  withComments: boolean,
): IngestMoveNode[] {
  return nodes
    .filter((node) => !mainLineOnly || node.isMainLine)
    .map((node) => ({
      san: node.san,
      fen: node.fen,
      isOpponentResponse: node.player !== studentColor,
      absoluteCp: evaluations[node.fen]?.cp ?? null,
      complexity: evaluations[node.fen]?.complexity ?? null,
      coachInsights: withComments ? (insights[node.id] ?? null) : null,
      visualMarkers: node.visualMarkers,
      children: buildMoveNodes(node.children, studentColor, evaluations, insights, mainLineOnly, withComments),
    }))
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
