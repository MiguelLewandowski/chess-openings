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
  lessons: LessonSummary[]
}
