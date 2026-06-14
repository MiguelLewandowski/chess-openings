import type { IPgnParser, ParsedChapter, ParsedNode } from '../services/IPgnParser'
import type { IEngineService, EngineEvaluation } from '../services/IEngineService'
import type { ICoachService, CoachInsight, CoachRequest } from '../services/ICoachService'
import type { IContentRepository } from '../repositories/IContentRepository'
import type { IngestStudyData, IngestLessonData, IngestExerciseData, IngestMoveNode } from '../entities/StudyContent'

export interface IngestOptions {
  openingName?: string
  chapterLimit?: number
  specificChapter?: number
  styleTags?: string[]
}

export class IngestStudy {
  constructor(
    private readonly pgnParser: IPgnParser,
    private readonly engineService: IEngineService,
    private readonly coachService: ICoachService,
    private readonly contentRepo: IContentRepository,
  ) {}

  async execute(pgnString: string, options: IngestOptions = {}): Promise<{ id: string; name: string }> {
    const chapters = applyFilters(this.pgnParser.parseStudy(pgnString), options)
    if (chapters.length === 0) throw new Error('No chapters found after filtering.')

    const { fensToEvaluate, coachRequests } = extractRequests(chapters)
    const [evaluations, insights] = await Promise.all([
      this.engineService.getEvaluationsBatch(fensToEvaluate, 20),
      this.coachService.generateExplanationsBatch(coachRequests, 10),
    ])

    return this.contentRepo.upsertStudy(buildStudyData(chapters, evaluations, insights, options))
  }
}

function applyFilters(chapters: ParsedChapter[], options: IngestOptions): ParsedChapter[] {
  if (options.specificChapter !== undefined && options.specificChapter > 0) {
    const index = options.specificChapter - 1
    return index < chapters.length ? [chapters[index]] : []
  }
  if (options.chapterLimit !== undefined && options.chapterLimit > 0) {
    return chapters.slice(0, options.chapterLimit)
  }
  return chapters
}

function extractRequests(chapters: ParsedChapter[]) {
  const fensToEvaluate: string[] = []
  const coachRequests: CoachRequest[] = []

  for (const chapter of chapters) {
    fensToEvaluate.push(chapter.initialFen)
    const lessonColor: 'WHITE' | 'BLACK' = chapter.rootNodes[0]?.player === 'BLACK' ? 'BLACK' : 'WHITE'
    traverseNodes(chapter.rootNodes, fensToEvaluate, coachRequests, lessonColor)
  }

  return { fensToEvaluate, coachRequests }
}

function traverseNodes(
  nodes: ParsedNode[],
  fens: string[],
  requests: CoachRequest[],
  lessonColor: 'WHITE' | 'BLACK'
): void {
  for (const node of nodes) {
    fens.push(node.fen)
    if (node.isMainLine) requests.push(buildCoachRequest(node, lessonColor))
    traverseNodes(node.children, fens, requests, lessonColor)
  }
}

function buildCoachRequest(node: ParsedNode, lessonColor: 'WHITE' | 'BLACK'): CoachRequest {
  return {
    id: node.id,
    san: node.san,
    cpChangeTheme: 'Development',
    originalComment: node.originalComment,
    isOpponentResponse: node.player !== lessonColor,
    playerColor: lessonColor,
    tacticalContext: { pieceMoved: node.pieceMoved, capturedPiece: node.capturedPiece, isCheck: node.isCheck },
  }
}

function buildStudyData(
  chapters: ParsedChapter[],
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
  options: IngestOptions
): IngestStudyData {
  const openingName = options.openingName || chapters[0].title || 'Unknown Opening'
  return {
    openingName,
    openingSlug: slugify(openingName),
    styleTags: options.styleTags ?? [],
    lessons: chapters.map((chapter, i) => buildLesson(chapter, i, evaluations, insights)),
  }
}

function buildLesson(
  chapter: ParsedChapter,
  index: number,
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>
): IngestLessonData {
  return {
    title: chapter.title,
    order: index + 1,
    initialFen: chapter.initialFen,
    exercises: [
      buildExercise(chapter, evaluations, insights, false),
      buildExercise(chapter, evaluations, insights, true),
    ],
  }
}

function buildExercise(
  chapter: ParsedChapter,
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
  isPractice: boolean
): IngestExerciseData {
  return {
    title: `${chapter.title} - ${isPractice ? 'Practice' : 'Theory'}`,
    type: isPractice ? 'PRACTICE' : 'THEORY',
    initialFen: chapter.initialFen,
    moves: buildMoveNodes(chapter.rootNodes, evaluations, insights, isPractice),
  }
}

function buildMoveNodes(
  nodes: ParsedNode[],
  evaluations: Record<string, EngineEvaluation | null>,
  insights: Record<string, CoachInsight>,
  isPractice: boolean
): IngestMoveNode[] {
  return nodes
    .filter(node => !isPractice || node.isMainLine)
    .map(node => ({
      san: node.san,
      fen: node.fen,
      isOpponentResponse: node.player === 'BLACK',
      absoluteCp: evaluations[node.fen]?.cp ?? null,
      complexity: evaluations[node.fen]?.complexity ?? null,
      coachInsights: !isPractice ? (insights[node.id] ?? null) : null,
      visualMarkers: node.visualMarkers,
      children: buildMoveNodes(node.children, evaluations, insights, isPractice),
    }))
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
