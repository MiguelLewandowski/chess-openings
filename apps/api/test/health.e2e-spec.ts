import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { createTestApp } from './setup-app'

describe('HealthController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = (await createTestApp()).app
  })

  afterAll(() => app.close())

  it('GET /api/health → 200 when the database responds', async () => {
    const res = await request(app.getHttpServer()).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
