import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import type { OpeningStyle } from '@chess-openings/domain'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'

const PERFECT_RUN = { mistakes: 0, pieceHints: 0, revealedMoves: 0 }

interface TrackBody {
  branches: { branch: string | null; lessons: { id: string; title: string; branch: string | null; state: string }[] }[]
  nextLessonId: string | null
}

describe('Opening track (e2e)', () => {
  let ctx: TestContext
  let app: INestApplication
  let token: string

  beforeAll(async () => {
    ctx = await createTestApp()
    app = ctx.app
  })

  beforeEach(async () => {
    await resetDatabase(ctx.prisma)
    const register = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: 'securepass123', name: 'Student' })
    token = register.body.token
  })

  afterAll(() => app.close())

  const http = () => app.getHttpServer()
  const auth = () => `Bearer ${token}`

  // Lessons as [title, branch]; each with its practice exercise.
  async function createOpening(slug: string, lessons: [string, string | null][], path?: { family: string; style: OpeningStyle }) {
    const opening = await ctx.prisma.opening.create({
      data: {
        name: slug,
        slug,
        styleTags: [],
        family: path?.family ?? null,
        style: path?.style ?? null,
        lessons: {
          create: lessons.map(([title, branch], i) => ({
            title,
            order: i + 1,
            branch,
            exercises: { create: { title: `${title} - Practice`, type: 'PRACTICE' as const } },
          })),
        },
      },
      include: { lessons: { include: { exercises: true }, orderBy: { order: 'asc' } } },
    })
    return {
      id: opening.id,
      lesson: (title: string) => opening.lessons.find((l) => l.title === title)!,
    }
  }

  const complete = (exerciseId: string) =>
    request(http()).post(`/api/progress/${exerciseId}`).set('Authorization', auth()).send(PERFECT_RUN).expect(201)

  const shape = (track: TrackBody) => track.branches.map((b) => [b.branch, b.lessons.map((l) => `${l.title}:${l.state}`)])

  const BISHOP: [string, string | null][] = [
    ['Gambito Lewis', '2...Bc5'],
    ['Urusov', '2...Cf6'],
    ['Quatro Cavalos', '2...Cc6'],
    ['Armadilha: 3...d6?', '2...Cf6'],
  ]

  it('groups the trail by branch and opens the first lesson of each branch for a visitor', async () => {
    await createOpening('abertura-do-bispo', BISHOP)

    const res = await request(http()).get('/api/openings/abertura-do-bispo')

    expect(res.status).toBe(200)
    expect(shape(res.body.track)).toEqual([
      ['2...Bc5', ['Gambito Lewis:OPEN']],
      ['2...Cf6', ['Urusov:OPEN', 'Armadilha: 3...d6?:LOCKED']],
      ['2...Cc6', ['Quatro Cavalos:OPEN']],
    ])
    expect(res.body.lessons.map((l: { branch: string | null }) => l.branch)).toEqual(['2...Bc5', '2...Cf6', '2...Cc6', '2...Cf6'])
    expect(res.body.track.nextLessonId).toBe(res.body.lessons[0].id)
  })

  it('unlocks the next lesson of the branch the student completed', async () => {
    const opening = await createOpening('abertura-do-bispo', BISHOP)
    await complete(opening.lesson('Urusov').exercises[0].id)

    const res = await request(http()).get('/api/openings/abertura-do-bispo').set('Authorization', auth())

    expect(shape(res.body.track)[1]).toEqual(['2...Cf6', ['Urusov:DONE', 'Armadilha: 3...d6?:OPEN']])
    expect(res.body.track.nextLessonId).toBe(opening.lesson('Gambito Lewis').id)
  })

  it('keeps an opening imported before branches as a single sequential branch', async () => {
    const opening = await createOpening('abertura-inglesa', [['Simétrica', null], ['Reversa', null], ['Agincourt', null]])
    await complete(opening.lesson('Simétrica').exercises[0].id)

    const res = await request(http()).get('/api/openings/abertura-inglesa').set('Authorization', auth())

    expect(shape(res.body.track)).toEqual([[null, ['Simétrica:DONE', 'Reversa:OPEN', 'Agincourt:LOCKED']]])
    expect(res.body.track.nextLessonId).toBe(opening.lesson('Reversa').id)
  })

  it('serves the branches of the sister lessons on the lesson page, to point to the next one of the branch', async () => {
    const opening = await createOpening('abertura-do-bispo', BISHOP)

    const res = await request(http()).get(`/api/lessons/${opening.lesson('Urusov').id}`).set('Authorization', auth())

    expect(res.status).toBe(200)
    expect(res.body.opening.lessons.map((l: { title: string; branch: string }) => [l.title, l.branch])).toEqual(BISHOP)
  })

  it('points the profile to the lesson the trail suggests, finishing a branch before the next', async () => {
    const opening = await createOpening('abertura-do-bispo', BISHOP)
    await complete(opening.lesson('Gambito Lewis').exercises[0].id)
    await complete(opening.lesson('Urusov').exercises[0].id)

    const trail = await request(http()).get('/api/openings/abertura-do-bispo').set('Authorization', auth())
    const profile = await request(http()).get('/api/progress/profile').set('Authorization', auth())

    expect(trail.body.track.nextLessonId).toBe(opening.lesson('Armadilha: 3...d6?').id)
    expect(profile.body.continueLesson).toMatchObject({ lessonId: opening.lesson('Armadilha: 3...d6?').id, remainingLessons: 2 })
  })

  it('serves the trail of the chosen path on the family slug', async () => {
    const family = 'abertura-do-bispo'
    await createOpening('abertura-do-bispo-posicional', [['Calma', '2...Cf6']], { family, style: 'POSITIONAL' })
    await createOpening('abertura-do-bispo-tatico', BISHOP, { family, style: 'TACTICAL' })
    await request(http()).put(`/api/openings/${family}/choice`).set('Authorization', auth()).send({ style: 'TACTICAL' }).expect(200)

    const res = await request(http()).get(`/api/openings/${family}`).set('Authorization', auth())

    expect(res.body.style).toBe('TACTICAL')
    expect(res.body.track.branches.map((b: { branch: string }) => b.branch)).toEqual(['2...Bc5', '2...Cf6', '2...Cc6'])
  })
})
