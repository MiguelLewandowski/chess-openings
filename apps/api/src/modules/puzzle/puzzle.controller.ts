import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { PuzzleService } from './puzzle.service'

@ApiTags('puzzles')
@Controller('puzzles')
export class PuzzleController {
  constructor(private readonly puzzleService: PuzzleService) {}

  @Get()
  @ApiOperation({
    summary: 'List opening puzzles for a training session',
    description: 'Filters puzzles by the given opening names (comma-separated). Falls back to random opening puzzles.',
  })
  @ApiQuery({ name: 'openings', required: false, description: 'Comma-separated opening names' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'maxRating', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of puzzles.' })
  list(
    @Query('openings') openings?: string,
    @Query('limit') limit?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    const openingNames = openings ? openings.split(',').filter(Boolean) : []
    return this.puzzleService.findForSession(
      openingNames,
      limit ? Number(limit) : undefined,
      maxRating ? Number(maxRating) : undefined,
    )
  }
}
