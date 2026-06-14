import { ApiProperty } from '@nestjs/swagger'

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
  @ApiProperty({ type: [LessonSummaryDto] }) lessons: LessonSummaryDto[]
}
