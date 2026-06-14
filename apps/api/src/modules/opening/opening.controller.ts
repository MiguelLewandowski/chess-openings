import { Controller, Get, Delete, Param, HttpCode, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { OpeningService } from './opening.service'
import { OpeningResponseDto } from './dto/opening-response.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

@ApiTags('openings')
@Controller('openings')
export class OpeningController {
  constructor(private readonly openingService: OpeningService) {}

  @Get()
  @ApiOperation({ summary: 'List all openings', description: 'Returns all chess openings with their lessons.' })
  @ApiResponse({ status: 200, description: 'List of openings with lessons.', type: [OpeningResponseDto] })
  findAll() {
    return this.openingService.findAll()
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get opening by slug', description: 'Returns a single opening with full lesson list.' })
  @ApiParam({ name: 'slug', description: 'URL-friendly opening identifier, e.g. "italian-game"' })
  @ApiResponse({ status: 200, description: 'Opening found.', type: OpeningResponseDto })
  @ApiResponse({ status: 404, description: 'Opening not found.' })
  findOne(@Param('slug') slug: string) {
    return this.openingService.findBySlug(slug)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an opening (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Opening CUID identifier' })
  @ApiResponse({ status: 204, description: 'Opening deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required.' })
  @ApiResponse({ status: 404, description: 'Opening not found.' })
  remove(@Param('id') id: string) {
    return this.openingService.delete(id)
  }
}
