import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma.service'

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  // The API is only useful with its database, so "healthy" includes a round trip to it:
  // a deploy whose DATABASE_URL is wrong fails the platform healthcheck instead of going live.
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      throw new ServiceUnavailableException('Database unreachable.')
    }
    return { status: 'ok' }
  }
}
