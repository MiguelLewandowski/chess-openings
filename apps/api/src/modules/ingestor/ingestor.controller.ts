import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { IngestorService } from './ingestor.service'
import { IngestStudyDto } from './dto/ingest-study.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@ApiTags('ingestor')
@Controller('ingestor')
export class IngestorController {
  constructor(private readonly ingestorService: IngestorService) {}

  @Post('study')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Import a Lichess study',
    description: 'Fetches PGN from Lichess, enriches with engine evaluations and AI coach narration, then persists to the database.',
  })
  @ApiResponse({ status: 201, description: 'Study imported successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid Lichess URL or study not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  ingestStudy(@Body() dto: IngestStudyDto) {
    return this.ingestorService.ingestStudy(dto)
  }
}
