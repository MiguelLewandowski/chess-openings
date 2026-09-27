import { describe, it, expect, vi } from 'vitest'
import { ContentNotReviewedError, IngestStudy, groupLessons } from '../IngestStudy'
import type { IPgnParser, ParsedChapter, ParsedNode } from '../../services/IPgnParser'
import type { IEngineService } from '../../services/IEngineService'
import type { ICoachService } from '../../services/ICoachService'
import type { IContentRepository } from '../../repositories/IContentRepository'
import type { IngestStudyData } from '../../entities/StudyContent'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function node(id: string, san: string, player: 'WHITE' | 'BLACK', comment = '', children: ParsedNode[] = []): ParsedNode {
  return {
    id,
    san,
    fen: `fen-${id}`,
    player,
    originalComment: comment,
    visualMarkers: null,
    children,
    isMainLine: true,
    pieceMoved: 'p',
    isCheck: false,
  }
}

function chapter(title: string, studentColor: 'WHITE' | 'BLACK', rootNodes: ParsedNode[], intro = ''): ParsedChapter {
  return { title, studyName: 'Inglesa', studentColor, intro, initialFen: START, rootNodes }
}

function setup(chapters: ParsedChapter[]) {
  const parser: IPgnParser = { parseStudy: vi.fn().mockReturnValue(chapters) }
  const engine: IEngineService = { getEvaluationsBatch: vi.fn().mockResolvedValue({}) }
  const coach: ICoachService = {
    generateExplanationsBatch: vi.fn().mockImplementation(async (requests: { id: string }[]) =>
      Object.fromEntries(requests.map((r) => [r.id, { comment: `coach ${r.id}`, theme: 'Development' }])),
    ),
  }
  let saved: IngestStudyData | undefined
  const repo: IContentRepository = {
    upsertStudy: vi.fn().mockImplementation(async (data: IngestStudyData) => {
      saved = data
      return { id: 'op-1', name: data.openingName }
    }),
  }
  return { useCase: new IngestStudy(parser, engine, coach, repo), coach, saved: () => saved! }
}

describe('groupLessons', () => {
  it('should attach card chapters to the lesson with the same title', () => {
    const groups = groupLessons([
      chapter('Linha principal', 'WHITE', []),
      chapter('Linha principal | Crítica: após 2...Cf6', 'WHITE', []),
      chapter('Linha principal | Armadilha: 4...Bg4?', 'WHITE', []),
      chapter('Simétrica', 'WHITE', []),
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0].cards.map((c) => [c.kind, c.title])).toEqual([
      ['CRITICAL', 'Crítica: após 2...Cf6'],
      ['TRAP', 'Armadilha: 4...Bg4?'],
    ])
  })

  it('should keep a card whose lesson is missing as a lesson of its own', () => {
    const groups = groupLessons([chapter('Outra | Crítica: após 1...e5', 'WHITE', [])])
    expect(groups).toHaveLength(1)
    expect(groups[0].cards).toHaveLength(0)
  })
})

describe('IngestStudy', () => {
  it('should mark the opponent moves by the chapter orientation (Black repertoire)', async () => {
    const { useCase, saved } = setup([
      chapter('Defesa', 'BLACK', [node('n1', 'e4', 'WHITE', '', [node('n2', 'c5', 'BLACK')])]),
    ])
    await useCase.execute('pgn', { useAuthorComments: true })

    const practice = saved().lessons[0].exercises.find((e) => e.type === 'PRACTICE')!
    expect(practice.moves[0].isOpponentResponse).toBe(true) // 1.e4 is White's, the opponent
    expect(practice.moves[0].children[0].isOpponentResponse).toBe(false)
  })

  it('should store the author comments as they are when asked, without calling the coach', async () => {
    const { useCase, coach, saved } = setup([chapter('Linha', 'WHITE', [node('n1', 'c4', 'WHITE', 'Controla d5.')])])
    await useCase.execute('pgn', { useAuthorComments: true })

    expect(coach.generateExplanationsBatch).toHaveBeenCalledWith([], 10)
    const theory = saved().lessons[0].exercises.find((e) => e.type === 'THEORY')!
    expect(theory.moves[0].coachInsights?.comment).toBe('Controla d5.')
    expect(saved().openingName).toBe('Inglesa')
  })

  it('should turn card chapters into commented practice exercises of their lesson', async () => {
    const { useCase, saved } = setup([
      chapter('Linha', 'WHITE', [node('n1', 'c4', 'WHITE')]),
      chapter('Linha | Crítica: após 1...e5', 'WHITE', [node('k1', 'Nc3', 'WHITE', 'Controla d5.')], 'Como seguimos?'),
    ])
    await useCase.execute('pgn', { useAuthorComments: true })

    const exercises = saved().lessons[0].exercises
    expect(saved().lessons).toHaveLength(1)
    expect(exercises.map((e) => [e.type, e.cardKind])).toEqual([
      ['THEORY', null],
      ['PRACTICE', null],
      ['PRACTICE', 'CRITICAL'],
    ])
    expect(exercises[2].description).toBe('Como seguimos?')
    expect(exercises[2].moves[0].coachInsights?.comment).toBe('Controla d5.')
    expect(exercises[1].moves[0].coachInsights).toBeNull() // main practice hides comments
  })

  it('should refuse a study that still has review markers', async () => {
    const { useCase } = setup([
      chapter('Linha', 'WHITE', [node('n1', 'c4', 'WHITE', '[REVISAR: casa errada] Controla d6.')]),
    ])
    await expect(useCase.execute('pgn')).rejects.toBeInstanceOf(ContentNotReviewedError)
  })

  it('should filter by lesson, counting a lesson and its cards as one', async () => {
    const { useCase, saved } = setup([
      chapter('A', 'WHITE', [node('a1', 'c4', 'WHITE')]),
      chapter('A | Crítica: após 1...e5', 'WHITE', [node('a2', 'Nc3', 'WHITE')]),
      chapter('B', 'WHITE', [node('b1', 'c4', 'WHITE')]),
    ])
    await useCase.execute('pgn', { specificChapter: 2, useAuthorComments: true })
    expect(saved().lessons.map((l) => l.title)).toEqual(['B'])
  })
})
