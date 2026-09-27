// Read models (query side / CQRS-lite): shapes returned by read endpoints.
// Reads query the database directly; only commands go through use cases + repositories.

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
  lessons: LessonSummary[]
}
