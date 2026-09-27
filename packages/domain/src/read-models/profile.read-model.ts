// Read model for the profile screen: the gamification state the platform persists (XP,
// streak, study style) plus aggregates of the user's SM-2 progress. Dates are ISO strings
// because this shape crosses HTTP.

import type { LevelProgress } from '../entities/Level'

export interface OpeningProgress {
  id: string
  name: string
  slug: string
  styleTags: string[]
  // Opening moves of the first lesson's practice line, e.g. "1.c4 e5 2.Nc3". Empty when the
  // opening has no practice line.
  firstMoves: string
  completedLessons: number
  totalLessons: number
}

export interface ReviewStats {
  // Practice exercises whose next review date has already passed.
  due: number
  // Practice exercises attempted at least once, i.e. with an SM-2 review schedule.
  scheduled: number
  // Practice exercises whose review interval reached MATURE_INTERVAL_DAYS.
  mastered: number
  nextReview: string | null
}

// The lesson the user should open next: the first unfinished lesson of the opening they
// studied most recently, or the very first lesson of the catalog for a new user.
export interface ContinueLesson {
  lessonId: string
  lessonTitle: string
  openingName: string
  openingSlug: string
  // Position at the end of the lesson's practice line.
  fen: string
  // Whether the user already attempted any exercise of this lesson.
  hasProgress: boolean
  remainingLessons: number
}

export interface UserProfile {
  name: string | null
  email: string
  styleArchetype: string | null
  memberSince: string
  xp: number
  level: LevelProgress
  // Effective streak (see currentStreak): 0 once a day was missed.
  streak: number
  // Length of the last run of consecutive study days, ending on lastStudyDate. Unlike
  // `streak` it survives a missed day, which lets the UI redraw the days of that run.
  lastRunLength: number
  lastStudyDate: string | null
  lessonsCompleted: number
  totalLessons: number
  reviews: ReviewStats
  continueLesson: ContinueLesson | null
  openings: OpeningProgress[]
}
