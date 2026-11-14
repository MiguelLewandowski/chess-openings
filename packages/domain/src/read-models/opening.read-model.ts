// Read models (query side / CQRS-lite): shapes returned by read endpoints.
// Reads query the database directly; only commands go through use cases + repositories.

import type { OpeningStyle } from '../entities/OpeningStyle'

export interface LessonSummary {
  id: string
  title: string
  order: number
  // The opponent move that opens the lesson's branch of the trail ("2...Cf6"); null when the
  // opening's lessons form a single branch (and in openings imported before branches).
  branch: string | null
}

// DONE: completed · OPEN: can be studied (first of its branch, or the lesson before it in the
// branch is done) · LOCKED: the lesson before it in the branch is not done yet.
export type LessonState = 'DONE' | 'OPEN' | 'LOCKED'

export interface TrackLesson extends LessonSummary {
  state: LessonState
}

export interface TrackBranch {
  // Same as the branch of its lessons; null for the single branch of an opening without them.
  branch: string | null
  lessons: TrackLesson[]
}

// The trail of an opening as a two-level tree: branches in the order of their first lesson,
// lessons of a branch in order. The student picks the branch; `nextLessonId` is the one the
// interface suggests (the first lesson not done, walking the branches in order).
export interface LessonTrack {
  branches: TrackBranch[]
  nextLessonId: string | null
}

export interface OpeningSummary {
  id: string
  name: string
  slug: string
  description: string | null
  styleTags: string[]
  // Shown in the catalog like an opening, but its lessons stay out of the reviews.
  isTutorial: boolean
  // Slug of the family this opening is a path of, and which path; both null for an opening
  // without paths.
  family: string | null
  style: OpeningStyle | null
  lessons: LessonSummary[]
  // The family's paths, from the calmest to the sharpest; empty for an opening without paths.
  paths: OpeningPathSummary[]
  // The path the logged-in student chose in the family; null without a choice or a student.
  chosenStyle: OpeningStyle | null
}

// The catalog and the family slug show a family as one entry: name and slug are the family's,
// and the rest (id, style, lessons...) describes its active path, which is the chosen one or,
// without a choice, the first of `paths`.
export interface OpeningPathSummary {
  id: string
  name: string
  slug: string
  style: OpeningStyle
  lessons: LessonSummary[]
}

// The opening page: the summary plus the trail of its (active) path, with the logged-in
// student's progress; without a student nothing is done.
export interface OpeningDetail extends OpeningSummary {
  track: LessonTrack
}

export interface OpeningChoice {
  family: string
  style: OpeningStyle
}
