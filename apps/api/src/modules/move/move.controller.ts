import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { MoveService } from './move.service'

@ApiTags('moves')
@Controller('moves')
export class MoveController {
  constructor(private readonly moveService: MoveService) {}

  @Get('expected')
  @ApiOperation({
    summary: 'Get the expected response move for a position',
    description: 'Given a FEN, returns the first child move in the variation tree (or null if none).',
  })
  @ApiQuery({ name: 'fen', description: 'FEN of the current position' })
  @ApiResponse({ status: 200, description: 'The expected next move, or null.' })
  expected(@Query('fen') fen: string) {
    return this.moveService.findExpectedResponse(fen)
  }
}
