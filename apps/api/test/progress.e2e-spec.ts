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
})
