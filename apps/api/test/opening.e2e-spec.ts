import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'

describe('OpeningController (e2e)', () => {
  let ctx: TestContext
  let app: INestApplication

  beforeAll(async () => {
    ctx = await createTestApp()
    app = ctx.app
  })

  beforeEach(() => resetDatabase(ctx.prisma))
  afterAll(() => app.close())

  it('GET /api/openings → 200 + array', async () => {
    await ctx.prisma.opening.create({
      data: { name: 'Italian Game', slug: 'italian-game', styleTags: ['open'] },
    })

    const res = await request(app.getHttpServer()).get('/api/openings')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({ slug: 'italian-game' })
  })

  it('GET /api/openings/:slug with invalid slug → 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/openings/does-not-exist')
    expect(res.status).toBe(404)
  })

  describe('DELETE /api/openings/:id (admin gate)', () => {
    const http = () => app.getHttpServer()

    async function createOpening(): Promise<string> {
      const opening = await ctx.prisma.opening.create({
        data: { name: 'Italian Game', slug: 'italian-game', styleTags: [] },
      })
      return opening.id
    }

    async function tokenFor(role: 'STUDENT' | 'ADMIN'): Promise<string> {
      const email = `${role.toLowerCase()}@example.com`
      await request(http()).post('/api/auth/register').send({ email, password: 'securepass123', name: role })
      if (role === 'ADMIN') {
        await ctx.prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
      }
      const login = await request(http()).post('/api/auth/login').send({ email, password: 'securepass123' })
      return login.body.token
    }

    it('without token → 401', async () => {
      const id = await createOpening()
      const res = await request(http()).delete(`/api/openings/${id}`)
      expect(res.status).toBe(401)
    })

    it('as STUDENT → 403', async () => {
      const id = await createOpening()
      const token = await tokenFor('STUDENT')
      const res = await request(http()).delete(`/api/openings/${id}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(403)
    })

    it('as ADMIN → 204 and removes the opening', async () => {
      const id = await createOpening()
      const token = await tokenFor('ADMIN')
      const res = await request(http()).delete(`/api/openings/${id}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(204)
      expect(await ctx.prisma.opening.findUnique({ where: { id } })).toBeNull()
    })
  })
})
