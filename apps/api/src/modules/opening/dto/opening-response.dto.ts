import { ApiProperty } from '@nestjs/swagger'
import { OPENING_STYLES, type OpeningStyle } from '@chess-openings/domain'

export class LessonSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() title: string
  @ApiProperty() order: number
}

export class OpeningResponseDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() slug: string
  @ApiProperty({ nullable: true }) description: string | null
  @ApiProperty({ type: [String] }) styleTags: string[]
  @ApiProperty({ description: 'Tutorial: listed like an opening, but its lessons are never reviewed.' }) isTutorial: boolean
  @ApiProperty({ nullable: true, description: 'Slug of the family this opening is a path of; null for an opening without paths.', example: 'abertura-do-bispo' })
  family: string | null

  @ApiProperty({ nullable: true, enum: OPENING_STYLES, description: 'Which path of the family; null for an opening without paths.' })
  style: OpeningStyle | null

  @ApiProperty({ type: [LessonSummaryDto] }) lessons: LessonSummaryDto[]
}
