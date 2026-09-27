import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ProgressService } from './progress.service'
import { CompleteExerciseDto, ExerciseCompletionDto } from './dto/complete-exercise.dto'
import { DueReviewDto } from './dto/due-review.dto'
import { UserProfileDto } from './dto/user-profile.dto'
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
    description: 'Scores the practice run (mistakes and hints), updates the SM-2 state and adds the XP it earned.',
  })
  @ApiParam({ name: 'exerciseId', description: 'Exercise CUID identifier' })
  @ApiResponse({ status: 201, description: 'Progress recorded.', type: ExerciseCompletionDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  complete(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: CompleteExerciseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.progressService.complete(req.user.userId, exerciseId, dto)
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

  @Get('profile')
  @ApiOperation({
    summary: 'Get the gamified profile of the authenticated user',
    description: 'XP, effective streak, study style and aggregates of the SM-2 progress.',
  })
  @ApiResponse({ status: 200, description: 'User profile.', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  profile(@Request() req: AuthenticatedRequest) {
    return this.progressService.findProfile(req.user.userId)
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
