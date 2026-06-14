import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { createTestApp, resetDatabase, type TestContext } from './setup-app'

describe('AuthController (e2e)', () => {
  let ctx: TestContext
  let app: INestApplication

  beforeAll(async () => {
    ctx = await createTestApp()
    app = ctx.app
  })

  beforeEach(() => resetDatabase(ctx.prisma))
  afterAll(() => app.close())

  const credentials = { email: 'student@example.com', password: 'securepass123', name: 'Student' }

  it('POST /api/auth/register → 201 + token + user', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(201)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user).toMatchObject({ email: credentials.email, name: credentials.name, xp: 0, streak: 0 })
  })

  it('POST /api/auth/register with duplicate email → 409', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(credentials)
    const res = await request(app.getHttpServer()).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(409)
  })

  it('POST /api/auth/login with valid credentials → 200 + token', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(credentials)
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })

    expect(res.status).toBe(200)
    expect(res.body.token).toEqual(expect.any(String))
  })

  it('POST /api/auth/login with wrong password → 401', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(credentials)
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrongpass' })

    expect(res.status).toBe(401)
  })

  it('GET /api/auth/me without token → 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
