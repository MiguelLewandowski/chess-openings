import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { ContentNotReviewedError, IngestStudy, type ICoachService, type IEngineService } from '@chess-openings/domain'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'
import { PgnParserService } from '../src/infrastructure/services/pgn-parser.service'
import { PrismaContentRepository } from '../src/infrastructure/repositories/prisma-content.repository'

// The shape lesson-author writes and Lichess exports back: a lesson of a Black repertoire
// followed by one of its cards (a chapter named "<lesson> | Crítica: ...", starting from a
// FEN, with the question before the first move).
const REVIEWED_STUDY = `[Event "Defesa Siciliana: Linha principal"]
[StudyName "Defesa Siciliana"]
[ChapterName "Linha principal"]
[Orientation "black"]

1. e4 {As brancas ocupam o centro.} 1... c5 {Contestamos d4 pelo flanco.} 2. Nf3 d6 *

[Event "Defesa Siciliana: Linha principal | Crítica: após 2.Cf3"]
[StudyName "Defesa Siciliana"]
[ChapterName "Linha principal | Crítica: após 2.Cf3"]
[Orientation "black"]
[SetUp "1"]
[FEN "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"]

{As brancas desenvolveram o cavalo. Como preparamos o desenvolvimento das nossas peças?} 2... d6 {Abre a diagonal do bispo de c8 e controla e5.} *
`

// No network in tests: no engine data and no coach (the comments are used as they are).
const engine: IEngineService = { getEvaluationsBatch: async () => ({}) }
const coach: ICoachService = { generateExplanationsBatch: async () => ({}) }

describe('Study ingestion (e2e)', () => {
  let ctx: TestContext
  let app: INestApplication
  let useCase: IngestStudy

  beforeAll(async () => {
    ctx = await createTestApp()
    app = ctx.app
    useCase = new IngestStudy(new PgnParserService(), engine, coach, app.get(PrismaContentRepository))
  })

  beforeEach(() => resetDatabase(ctx.prisma))
  afterAll(() => app.close())

  async function studentToken(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: 'securepass123', name: 'Student' })
    return res.body.token
  }

  it('imports a reviewed Black repertoire with its card, served by the lesson endpoint', async () => {
    const opening = await useCase.execute(REVIEWED_STUDY, { useAuthorComments: true })
    expect(opening.name).toBe('Defesa Siciliana')

    const lesson = await ctx.prisma.lesson.findFirstOrThrow({ where: { openingId: opening.id } })
    const res = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson.id}`)
      .set('Authorization', `Bearer ${await studentToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Linha principal')
    const [theory, practice, card] = res.body.exercises
    expect([theory.type, practice.type, card.type]).toEqual(['THEORY', 'PRACTICE', 'PRACTICE'])
    expect([theory.cardKind, practice.cardKind, card.cardKind]).toEqual([null, null, 'CRITICAL'])

    // Black repertoire: 1.e4 is the opponent's move, 1...c5 the student's.
    const e4 = theory.moves.find((m: { san: string }) => m.san === 'e4')
    const c5 = theory.moves.find((m: { san: string }) => m.san === 'c5')
    expect(e4.isOpponentResponse).toBe(true)
    expect(c5.isOpponentResponse).toBe(false)
    expect(c5.coachInsights.comment).toBe('Contestamos d4 pelo flanco.')

    expect(card.title).toBe('Crítica: após 2.Cf3')
    expect(card.description).toBe('As brancas desenvolveram o cavalo. Como preparamos o desenvolvimento das nossas peças?')
    expect(card.initialFen).toContain('2p5/4P3/5N2')
    expect(card.moves[0]).toMatchObject({ san: 'd6', isOpponentResponse: false })
    expect(card.moves[0].coachInsights.comment).toBe('Abre a diagonal do bispo de c8 e controla e5.')
    // The main practice keeps its comments hidden.
    expect(practice.moves.every((m: { coachInsights: unknown }) => m.coachInsights === null)).toBe(true)
  })

  it('replaces the lessons when the same opening is imported again', async () => {
    const first = await useCase.execute(REVIEWED_STUDY, { useAuthorComments: true })
    const second = await useCase.execute(REVIEWED_STUDY, { useAuthorComments: true })

    expect(second.id).toBe(first.id)
    expect(await ctx.prisma.lesson.count({ where: { openingId: first.id } })).toBe(1)
    expect(await ctx.prisma.exercise.count()).toBe(3)
  })

  it('refuses a study that still has [REVISAR] markers and writes nothing', async () => {
    const unreviewed = REVIEWED_STUDY.replace('{Contestamos d4 pelo flanco.}', '{[REVISAR: casa errada] Contestamos d4.}')

    await expect(useCase.execute(unreviewed, { useAuthorComments: true })).rejects.toBeInstanceOf(ContentNotReviewedError)
    expect(await ctx.prisma.opening.count()).toBe(0)
  })
})
