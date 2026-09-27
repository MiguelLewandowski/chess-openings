import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'

describe('ProgressController (e2e)', () => {
  let ctx: TestContext
  let app: INestApplication
  let token: string
  let exerciseId: string

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

    const opening = await ctx.prisma.opening.create({
      data: {
        name: 'Italian Game',
        slug: 'italian-game',
        styleTags: [],
        lessons: {
          create: {
            title: 'Giuoco Piano',
            order: 1,
            exercises: { create: { title: 'Practice', type: 'PRACTICE' } },
          },
        },
      },
      include: { lessons: { include: { exercises: true } } },
    })
    exerciseId = opening.lessons[0].exercises[0].id
  })

  afterAll(() => app.close())

  it('POST /api/progress/:id without token → 401', async () => {
    const res = await request(app.getHttpServer()).post(`/api/progress/${exerciseId}`).send({ quality: 5 })
    expect(res.status).toBe(401)
  })

  it('POST /api/progress/:id with quality=5 → 201 + creates UserProgress', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/progress/${exerciseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quality: 5 })

    expect(res.status).toBe(201)

    const progress = await ctx.prisma.userProgress.findFirst({ where: { exerciseId } })
    expect(progress).not.toBeNull()
    expect(progress?.repetitions).toBe(1)
  })

  it('Second completion grows the SM-2 interval', async () => {
    const http = app.getHttpServer()
    const auth = `Bearer ${token}`

    await request(http).post(`/api/progress/${exerciseId}`).set('Authorization', auth).send({ quality: 5 })
    const afterFirst = await ctx.prisma.userProgress.findFirst({ where: { exerciseId } })

    await request(http).post(`/api/progress/${exerciseId}`).set('Authorization', auth).send({ quality: 5 })
    const afterSecond = await ctx.prisma.userProgress.findFirst({ where: { exerciseId } })

    expect(afterSecond!.interval).toBeGreaterThan(afterFirst!.interval)
    expect(afterSecond!.repetitions).toBe(2)
  })

  it('GET /api/progress/profile without token → 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/progress/profile')
    expect(res.status).toBe(401)
  })

  it('GET /api/progress/profile reflects XP, streak and lesson progress after a completion', async () => {
    const http = app.getHttpServer()
    const auth = `Bearer ${token}`

    await request(http).post(`/api/progress/${exerciseId}`).set('Authorization', auth).send({ quality: 5 })
    const res = await request(http).get('/api/progress/profile').set('Authorization', auth)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      email: 'student@example.com',
      xp: 10,
      streak: 1,
      lessonsCompleted: 1,
      totalLessons: 1,
      reviews: { due: 0, scheduled: 1, mastered: 0 },
      openings: [{ slug: 'italian-game', completedLessons: 1, totalLessons: 1 }],
    })
    expect(res.body.reviews.nextReview).not.toBeNull()
    expect(res.body.level).toEqual({ level: 1, xpIntoLevel: 10, xpForNextLevel: 100 })
    expect(res.body.lastRunLength).toBe(1)
    // Every lesson is done, so the last one studied comes back as a review.
    expect(res.body.continueLesson).toMatchObject({ openingSlug: 'italian-game', hasProgress: true, remainingLessons: 0 })
  })

  it('GET /api/progress/profile points a new user to the first lesson, showing its final position', async () => {
    const practice = await ctx.prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } })
    const e4 = await ctx.prisma.move.create({ data: { san: 'e4', fen: 'fen-after-e4', exerciseId } })
    await ctx.prisma.move.create({ data: { san: 'e5', fen: 'fen-after-e5', exerciseId, parentId: e4.id } })

    const res = await request(app.getHttpServer()).get('/api/progress/profile').set('Authorization', `Bearer ${token}`)

    expect(res.body.openings[0].firstMoves).toBe('1.e4 e5')
    expect(res.body.continueLesson).toMatchObject({
      lessonId: practice.lessonId,
      fen: 'fen-after-e5',
      hasProgress: false,
      remainingLessons: 1,
    })
  })

  it('GET /api/progress/profile leaves THEORY exercises out of the review stats', async () => {
    const practice = await ctx.prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } })
    const theory = await ctx.prisma.exercise.create({
      data: { title: 'Theory', type: 'THEORY', lessonId: practice.lessonId },
    })
    const http = app.getHttpServer()
    const auth = `Bearer ${token}`

    await request(http).post(`/api/progress/${theory.id}`).set('Authorization', auth).send({ quality: 5 })
    const res = await request(http).get('/api/progress/profile').set('Authorization', auth)

    expect(res.body.lessonsCompleted).toBe(1)
    expect(res.body.reviews).toMatchObject({ scheduled: 0, mastered: 0, nextReview: null })
  })

  it('GET /api/progress/profile reports a broken streak as 0', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000)
    await ctx.prisma.user.update({
      where: { email: 'student@example.com' },
      data: { streak: 5, lastStudyDate: threeDaysAgo },
    })

    const res = await request(app.getHttpServer()).get('/api/progress/profile').set('Authorization', `Bearer ${token}`)

    expect(res.body.streak).toBe(0)
  })

  it('A failed completion still completes the lesson, so the trail never locks again', async () => {
    const http = app.getHttpServer()
    const auth = `Bearer ${token}`
    const practice = await ctx.prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId }, include: { lesson: true } })

    await request(http).post(`/api/progress/${exerciseId}`).set('Authorization', auth).send({ quality: 0 })
    const res = await request(http)
      .get(`/api/progress/openings/${practice.lesson.openingId}/completed-lessons`)
      .set('Authorization', auth)

    expect(res.body).toEqual([practice.lessonId])
  })

  it('A card does not complete its lesson but comes back in the due reviews', async () => {
    const http = app.getHttpServer()
    const auth = `Bearer ${token}`
    const practice = await ctx.prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId }, include: { lesson: true } })
    const card = await ctx.prisma.exercise.create({
      data: { title: 'Crítica: após 1...e5', type: 'PRACTICE', cardKind: 'CRITICAL', lessonId: practice.lessonId },
    })

    await request(http).post(`/api/progress/${card.id}`).set('Authorization', auth).send({ quality: 5 })
    const completed = await request(http)
      .get(`/api/progress/openings/${practice.lesson.openingId}/completed-lessons`)
      .set('Authorization', auth)
    expect(completed.body).toEqual([])

    await ctx.prisma.userProgress.updateMany({ where: { exerciseId: card.id }, data: { nextReview: new Date(Date.now() - 60_000) } })
    const due = await request(http).get('/api/progress/reviews/due').set('Authorization', auth)
    expect(due.body).toHaveLength(1)
    expect(due.body[0].exercise).toMatchObject({ id: card.id, cardKind: 'CRITICAL', title: 'Crítica: após 1...e5' })
  })
})
