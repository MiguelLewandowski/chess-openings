import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Min, Max } from 'class-validator'

// The client reports what happened in the run; the domain turns it into the SM-2 quality and
// the XP, so the scoring rule lives in one place. The upper bound only rejects nonsense.
export class CompleteExerciseDto {
  @ApiProperty({ description: 'Legal moves that were not the line.', minimum: 0, example: 1 })
  @IsInt()
  @Min(0)
  @Max(500)
  mistakes: number

  @ApiProperty({ description: 'Hints that showed only which piece to move.', minimum: 0, example: 0 })
  @IsInt()
  @Min(0)
  @Max(500)
  pieceHints: number

  @ApiProperty({ description: 'Hints that showed the whole move.', minimum: 0, example: 0 })
  @IsInt()
  @Min(0)
  @Max(500)
  revealedMoves: number
}

export class ExerciseCompletionDto {
  @ApiProperty({ description: 'SM-2 quality derived from the run, 0 (forgotten) to 5 (perfect).', example: 4 })
  quality: number

  @ApiProperty({ description: 'XP added to the user.', example: 8 })
  xpEarned: number

  @ApiProperty({ description: 'Days until the next review.', example: 6 })
  intervalDays: number

  @ApiProperty({ description: 'Next review date (ISO 8601).', example: '2026-10-03T12:00:00.000Z' })
  nextReview: string
}
