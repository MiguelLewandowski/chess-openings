import { Body, Controller, Get, Delete, Param, HttpCode, Put, Request, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { OpeningService } from './opening.service'
import { OpeningResponseDto } from './dto/opening-response.dto'
import { ChooseOpeningStyleDto, OpeningChoiceDto } from './dto/choose-opening-style.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string }
}

interface MaybeAuthenticatedRequest extends Request {
  user: { userId: string } | null
}

@ApiTags('openings')
@Controller('openings')
export class OpeningController {
  constructor(private readonly openingService: OpeningService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all openings',
    description:
      'Returns all chess openings with their lessons. The paths of a family come as one entry; with a token, it shows the path the student chose.',
  })
  @ApiResponse({ status: 200, description: 'List of openings with lessons.', type: [OpeningResponseDto] })
  findAll(@Request() req: MaybeAuthenticatedRequest) {
    return this.openingService.findAll(req.user?.userId)
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get opening by slug',
    description: 'Returns a single opening with full lesson list. A family slug returns the family entry (see the catalog).',
  })
  @ApiParam({ name: 'slug', description: 'URL-friendly opening or family identifier, e.g. "italian-game"' })
  @ApiResponse({ status: 200, description: 'Opening found.', type: OpeningResponseDto })
  @ApiResponse({ status: 404, description: 'Opening not found.' })
  findOne(@Param('slug') slug: string, @Request() req: MaybeAuthenticatedRequest) {
    return this.openingService.findBySlug(slug, req.user?.userId)
  }

  @Put(':family/choice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Choose the path of an opening family',
    description: 'Saves (or switches) the path the student follows. Only that path comes back in the due reviews; the others keep their progress.',
  })
  @ApiParam({ name: 'family', description: 'Family slug, e.g. "abertura-do-bispo"' })
  @ApiResponse({ status: 200, description: 'Choice saved.', type: OpeningChoiceDto })
  @ApiResponse({ status: 400, description: 'Unknown style, or a path the family does not have.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'No family with this slug.' })
  choose(@Param('family') family: string, @Body() dto: ChooseOpeningStyleDto, @Request() req: AuthenticatedRequest) {
    return this.openingService.choose(req.user.userId, family, dto.style)
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
