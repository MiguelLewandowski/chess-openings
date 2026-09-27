import { ApiProperty } from '@nestjs/swagger'

class ReviewOpeningDto {
  @ApiProperty() name: string
  @ApiProperty() slug: string
}

class ReviewLessonDto {
  @ApiProperty() id: string
  @ApiProperty() title: string
  @ApiProperty() order: number
  @ApiProperty({ type: ReviewOpeningDto }) opening: ReviewOpeningDto
}

class ReviewExerciseDto {
  @ApiProperty() id: string
  @ApiProperty() title: string
  @ApiProperty({ enum: ['CRITICAL', 'TRAP'], nullable: true, description: 'Set for the short drills attached to a lesson.' })
  cardKind: 'CRITICAL' | 'TRAP' | null
  @ApiProperty({ type: ReviewLessonDto }) lesson: ReviewLessonDto
}

export class DueReviewDto {
  @ApiProperty({ type: String, format: 'date-time' }) nextReview: string
  @ApiProperty({ type: ReviewExerciseDto }) exercise: ReviewExerciseDto
}
