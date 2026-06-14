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
  @ApiProperty({ type: ReviewLessonDto }) lesson: ReviewLessonDto
}

export class DueReviewDto {
  @ApiProperty({ type: String, format: 'date-time' }) nextReview: string
  @ApiProperty({ type: ReviewExerciseDto }) exercise: ReviewExerciseDto
}
