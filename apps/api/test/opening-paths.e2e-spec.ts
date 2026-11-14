import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import type { OpeningStyle } from '@chess-openings/domain'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'

const PERFECT_RUN = { mistakes: 0, pieceHints: 0, revealedMoves: 0 }
const STYLE_NAMES: Record<OpeningStyle, string> = { POSITIONAL: 'Posicional', BALANCED: 'Equilibrado', TACTICAL: 'Tático' }

describe('Opening paths (e2e)', () => {
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

  // A path of the "Abertura do Bispo" family, with one lesson and its practice.
  async function createPath(style: OpeningStyle, lessonTitle = `Linha ${STYLE_NAMES[style]}`) {
    const opening = await ctx.prisma.opening.create({
      data: {
        name: `Abertura do Bispo — ${STYLE_NAMES[style]}`,
        slug: `abertura-do-bispo-${STYLE_NAMES[style].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`,
        styleTags: [],
        family: 'abertura-do-bispo',
        style,
        lessons: { create: { title: lessonTitle, order: 1, exercises: { create: { title: 'Practice', type: 'PRACTICE' } } } },
      },
      include: { lessons: { include: { exercises: true } } },
    })
    return { id: opening.id, exerciseId: opening.lessons[0].exercises[0].id, lessonId: opening.lessons[0].id }
  }

  async function createPlainOpening() {
    const opening = await ctx.prisma.opening.create({
      data: {
        name: 'Abertura Inglesa',
        slug: 'abertura-inglesa',
        styleTags: [],
        lessons: { create: { title: 'Simétrica', order: 1, exercises: { create: { title: 'Practice', type: 'PRACTICE' } } } },
      },
      include: { lessons: { include: { exercises: true } } },
    })
    return { id: opening.id, exerciseId: opening.lessons[0].exercises[0].id }
  }

  const choose = (style: string, family = 'abertura-do-bispo') =>
    request(http()).put(`/api/openings/${family}/choice`).set('Authorization', auth()).send({ style })

  describe('catalog', () => {
    it('groups the paths of a family into one entry, showing the calmest path, and keeps a plain opening as it was', async () => {
      const tactical = await createPath('TACTICAL')
      const positional = await createPath('POSITIONAL')
      await createPlainOpening()

      const res = await request(http()).get('/api/openings')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
      const bySlug = (slug: string) => res.body.find((o: { slug: string }) => o.slug === slug)
      const family = bySlug('abertura-do-bispo')
      const plain = bySlug('abertura-inglesa')
      expect(family).toMatchObject({
        id: positional.id,
        name: 'Abertura do Bispo',
        slug: 'abertura-do-bispo',
        family: 'abertura-do-bispo',
        style: 'POSITIONAL',
        chosenStyle: null,
        lessons: [{ title: 'Linha Posicional' }],
      })
      expect(family.paths.map((p: { style: string; id: string }) => [p.style, p.id])).toEqual([
        ['POSITIONAL', positional.id],
        ['TACTICAL', tactical.id],
      ])
      expect(plain).toMatchObject({ slug: 'abertura-inglesa', family: null, style: null, paths: [], chosenStyle: null })
    })

    it('shows the logged-in student the path they chose', async () => {
      const tactical = await createPath('TACTICAL')
      await createPath('POSITIONAL')
      await choose('TACTICAL').expect(200)

      const res = await request(http()).get('/api/openings').set('Authorization', auth())

      expect(res.body[0]).toMatchObject({
        id: tactical.id,
        slug: 'abertura-do-bispo',
        style: 'TACTICAL',
        chosenStyle: 'TACTICAL',
        lessons: [{ title: 'Linha Tático' }],
      })
    })

    it('ignores a bad token instead of refusing the public catalog', async () => {
      await createPath('TACTICAL')
      const res = await request(http()).get('/api/openings').set('Authorization', 'Bearer not-a-token')
      expect(res.status).toBe(200)
      expect(res.body[0].chosenStyle).toBeNull()
    })
  })

  describe('GET /api/openings/:slug', () => {
    it('accepts the family slug, with the student choice', async () => {
      await createPath('POSITIONAL')
      const balanced = await createPath('BALANCED')

      const anonymous = await request(http()).get('/api/openings/abertura-do-bispo')
      expect(anonymous.status).toBe(200)
      expect(anonymous.body).toMatchObject({ name: 'Abertura do Bispo', style: 'POSITIONAL', chosenStyle: null })

      await choose('BALANCED').expect(200)
      const chosen = await request(http()).get('/api/openings/abertura-do-bispo').set('Authorization', auth())
      expect(chosen.body).toMatchObject({ id: balanced.id, style: 'BALANCED', chosenStyle: 'BALANCED' })
      expect(chosen.body.paths).toHaveLength(2)
    })

    it('still serves a path by its own slug', async () => {
      const tactical = await createPath('TACTICAL')
      const res = await request(http()).get('/api/openings/abertura-do-bispo-tatico')
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: tactical.id, name: 'Abertura do Bispo — Tático', style: 'TACTICAL' })
    })
  })

  describe('PUT /api/openings/:family/choice', () => {
    it('without token → 401', async () => {
      await createPath('TACTICAL')
      const res = await request(http()).put('/api/openings/abertura-do-bispo/choice').send({ style: 'TACTICAL' })
      expect(res.status).toBe(401)
    })

    it('with an unknown style → 400', async () => {
      await createPath('TACTICAL')
      expect((await choose('SOLIDO')).status).toBe(400)
      expect((await request(http()).put('/api/openings/abertura-do-bispo/choice').set('Authorization', auth()).send({})).status).toBe(400)
    })

    it('for a family that does not exist → 404', async () => {
      expect((await choose('TACTICAL', 'inexistente')).status).toBe(404)
    })

    it('for a path the family does not have → 400', async () => {
      await createPath('TACTICAL')
      const res = await choose('BALANCED')
      expect(res.status).toBe(400)
      expect(await ctx.prisma.userOpeningChoice.count()).toBe(0)
    })

    it('saves the choice, and choosing again switches it', async () => {
      await createPath('TACTICAL')
      await createPath('POSITIONAL')

      const first = await choose('TACTICAL')
      expect(first.status).toBe(200)
      expect(first.body).toEqual({ family: 'abertura-do-bispo', style: 'TACTICAL' })

      await choose('POSITIONAL').expect(200)
      const saved = await ctx.prisma.userOpeningChoice.findMany()
      expect(saved.map((c) => [c.family, c.style])).toEqual([['abertura-do-bispo', 'POSITIONAL']])
    })
  })

  describe('due reviews', () => {
    async function completeAndMakeDue(exerciseIds: string[]) {
      for (const id of exerciseIds) {
        await request(http()).post(`/api/progress/${id}`).set('Authorization', auth()).send(PERFECT_RUN).expect(201)
      }
      await ctx.prisma.userProgress.updateMany({ data: { nextReview: new Date(Date.now() - 60_000) } })
    }
    const dueIds = async () => {
      const res = await request(http()).get('/api/progress/reviews/due').set('Authorization', auth())
      return res.body.map((r: { exercise: { id: string } }) => r.exercise.id)
    }

    it('bring back only the active path of each family, and a plain opening as before', async () => {
      const tactical = await createPath('TACTICAL')
      const positional = await createPath('POSITIONAL')
      const plain = await createPlainOpening()
      await completeAndMakeDue([tactical.exerciseId, positional.exerciseId, plain.exerciseId])

      // No choice yet: no path of the family is reviewed.
      expect(await dueIds()).toEqual([plain.exerciseId])

      await choose('TACTICAL').expect(200)
      expect((await dueIds()).sort()).toEqual([tactical.exerciseId, plain.exerciseId].sort())

      // Switching pauses the tactical progress instead of deleting it.
      await choose('POSITIONAL').expect(200)
      expect((await dueIds()).sort()).toEqual([positional.exerciseId, plain.exerciseId].sort())
      expect(await ctx.prisma.userProgress.count()).toBe(3)
    })

    it('count in the profile the same reviews as the queue', async () => {
      const tactical = await createPath('TACTICAL')
      const positional = await createPath('POSITIONAL')
      await completeAndMakeDue([tactical.exerciseId, positional.exerciseId])
      await choose('TACTICAL').expect(200)

      const profile = await request(http()).get('/api/progress/profile').set('Authorization', auth())
      expect(profile.body.reviews).toMatchObject({ due: 1, scheduled: 1 })
    })
  })
})
