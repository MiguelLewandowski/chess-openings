import { ApiProperty } from '@nestjs/swagger'
import type { ContinueLesson, LevelProgress, OpeningProgress, ReviewStats, UserProfile } from '@chess-openings/domain'

class OpeningProgressDto implements OpeningProgress {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() slug: string
  @ApiProperty({ type: [String] }) styleTags: string[]
  @ApiProperty({ example: '1.c4 e5 2.Nc3 Nf6', description: 'Opening moves of the first lesson.' }) firstMoves: string
  @ApiProperty() completedLessons: number
  @ApiProperty() totalLessons: number
}

class ReviewStatsDto implements ReviewStats {
  @ApiProperty({ description: 'Practice exercises due for review now.' }) due: number
  @ApiProperty({ description: 'Practice exercises with an SM-2 review schedule (attempted at least once).' }) scheduled: number
  @ApiProperty({ description: 'Practice exercises whose review interval reached 21 days.' }) mastered: number
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) nextReview: string | null
}

class LevelProgressDto implements LevelProgress {
  @ApiProperty({ description: 'Derived from XP; each level costs 100 XP more than the previous.' }) level: number
  @ApiProperty() xpIntoLevel: number
  @ApiProperty() xpForNextLevel: number
}

class ContinueLessonDto implements ContinueLesson {
  @ApiProperty() lessonId: string
  @ApiProperty() lessonTitle: string
  @ApiProperty() openingName: string
  @ApiProperty() openingSlug: string
  @ApiProperty({ description: 'Position at the end of the lesson practice line.' }) fen: string
  @ApiProperty() hasProgress: boolean
  @ApiProperty() remainingLessons: number
}

export class UserProfileDto implements UserProfile {
  @ApiProperty({ nullable: true }) name: string | null
  @ApiProperty() email: string
  @ApiProperty({ nullable: true }) styleArchetype: string | null
  @ApiProperty({ type: String, format: 'date-time' }) memberSince: string
  @ApiProperty() xp: number
  @ApiProperty({ type: LevelProgressDto }) level: LevelProgressDto
  @ApiProperty({ description: 'Consecutive study days; 0 once a day was missed.' }) streak: number
  @ApiProperty({ description: 'Length of the last run of study days, ending on lastStudyDate.' }) lastRunLength: number
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) lastStudyDate: string | null
  @ApiProperty() lessonsCompleted: number
  @ApiProperty() totalLessons: number
  @ApiProperty({ type: ReviewStatsDto }) reviews: ReviewStatsDto
  @ApiProperty({ type: ContinueLessonDto, nullable: true }) continueLesson: ContinueLessonDto | null
  @ApiProperty({ type: [OpeningProgressDto] }) openings: OpeningProgressDto[]
}
