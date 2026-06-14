import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ProgressService } from './progress.service'
import { CompleteExerciseDto } from './dto/complete-exercise.dto'
import { DueReviewDto } from './dto/due-review.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string }
}

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post(':exerciseId')
  @ApiOperation({
    summary: 'Record exercise completion',
    description: 'Updates SM-2 spaced repetition state for the authenticated user.',
  })
  @ApiParam({ name: 'exerciseId', description: 'Exercise CUID identifier' })
  @ApiResponse({ status: 201, description: 'Progress recorded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  complete(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: CompleteExerciseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.complete(req.user.userId, exerciseId, dto.quality)
  }

  @Get('reviews/due')
  @ApiOperation({
    summary: 'List exercises due for review',
    description: 'Returns PRACTICE exercises whose SM-2 nextReview date has passed.',
  })
  @ApiResponse({ status: 200, description: 'Due reviews.', type: [DueReviewDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  dueReviews(@Request() req: AuthenticatedRequest) {
    return this.progressService.findDueReviews(req.user.userId)
  }

  @Get('openings/:openingId/completed-lessons')
  @ApiOperation({
    summary: 'List completed lesson ids for an opening',
    description: 'Returns lesson ids the user has practised at least once within the opening.',
  })
  @ApiParam({ name: 'openingId', description: 'Opening CUID identifier' })
  @ApiResponse({ status: 200, description: 'Completed lesson ids.', type: [String] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  completedLessons(
    @Param('openingId') openingId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.findCompletedLessonIds(req.user.userId, openingId)
  }
}
