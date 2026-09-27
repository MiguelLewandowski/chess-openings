import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { HealthService } from './health.service'

@ApiTags('health')
@Controller('health')
// Polled by the hosting platform from a single address; rate limiting it would turn a
// healthy API into a failed healthcheck.
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check', description: 'Returns ok when the API and its database respond.' })
  @ApiResponse({ status: 200, description: 'Healthy.' })
  @ApiResponse({ status: 503, description: 'Database unreachable.' })
  check() {
    return this.healthService.check()
  }
}
