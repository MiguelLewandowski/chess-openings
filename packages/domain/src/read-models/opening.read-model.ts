// Read models (query side / CQRS-lite): shapes returned by read endpoints.
// Reads query the database directly; only commands go through use cases + repositories.

import type { OpeningStyle } from '../entities/OpeningStyle'

export interface LessonSummary {
  id: string
  title: string
  order: number
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

export interface OpeningChoice {
  family: string
  style: OpeningStyle
}
