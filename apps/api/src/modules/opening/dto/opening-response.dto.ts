import { ApiProperty } from '@nestjs/swagger'
import { OPENING_STYLES, type LessonState, type OpeningStyle } from '@chess-openings/domain'

export class LessonSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() title: string
  @ApiProperty() order: number
  @ApiProperty({
    nullable: true,
    example: '2...Cf6',
    description: "The opponent move that opens the lesson's branch of the trail; null when the lessons form a single branch.",
  })
  branch: string | null
}

const LESSON_STATES: LessonState[] = ['DONE', 'OPEN', 'LOCKED']

export class TrackLessonDto extends LessonSummaryDto {
  @ApiProperty({
    enum: LESSON_STATES,
    description: 'DONE: completed · OPEN: first of its branch, or the lesson before it in the branch is done · LOCKED: otherwise.',
  })
  state: LessonState
}

export class TrackBranchDto {
  @ApiProperty({ nullable: true, example: '2...Cf6', description: 'Null for the single branch of an opening without branches.' })
  branch: string | null

  @ApiProperty({ type: [TrackLessonDto], description: 'The lessons of the branch, in order.' }) lessons: TrackLessonDto[]
}

export class LessonTrackDto {
  @ApiProperty({ type: [TrackBranchDto], description: 'Branches in the order of their first lesson.' }) branches: TrackBranchDto[]

  @ApiProperty({ nullable: true, description: 'The lesson to suggest: the first one not done, walking the branches in order.' })
  nextLessonId: string | null
}

export class OpeningPathDto {
  @ApiProperty() id: string
  @ApiProperty({ example: 'Abertura do Bispo — Tático' }) name: string
  @ApiProperty({ example: 'abertura-do-bispo-tatico' }) slug: string
  @ApiProperty({ enum: OPENING_STYLES }) style: OpeningStyle
  @ApiProperty({ type: [LessonSummaryDto] }) lessons: LessonSummaryDto[]

  @ApiProperty({ type: [OpeningPathDto], description: 'The family paths, calmest first; empty for an opening without paths.' })
  paths: OpeningPathDto[]

  @ApiProperty({ nullable: true, enum: OPENING_STYLES, description: 'The path the logged-in student chose; null without a choice or a token.' })
  chosenStyle: OpeningStyle | null
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

  @ApiProperty({ type: [OpeningPathDto], description: 'The family paths, calmest first; empty for an opening without paths.' })
  paths: OpeningPathDto[]

  @ApiProperty({ nullable: true, enum: OPENING_STYLES, description: 'The path the logged-in student chose; null without a choice or a token.' })
  chosenStyle: OpeningStyle | null
}

export class OpeningDetailDto extends OpeningResponseDto {
  @ApiProperty({ type: LessonTrackDto, description: "The trail of the opening (a family's active path), with the logged-in student's progress." })
  track: LessonTrackDto
}
