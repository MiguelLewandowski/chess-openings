export interface MoveSummary {
  id: string
  san: string
  fen: string
  parentId: string | null
  isOpponentResponse: boolean
  coachInsights?: { comment?: string; theme?: string } | null
  visualMarkers?: { arrows?: string[]; circles?: string[] } | null
}

export interface ExerciseSummary {
  id: string
  title: string
  type: 'THEORY' | 'PRACTICE'
  // Short drills attached to the lesson; null for its theory and main practice.
  cardKind: 'CRITICAL' | 'TRAP' | null
  // For a card, the question shown before the student moves.
  description: string | null
  initialFen: string | null
  moves: MoveSummary[]
}

export interface LessonDetail {
  id: string
  title: string
  order: number
  opening: {
    id: string
    name: string
    slug: string
    lessons: { id: string; title: string; order: number }[]
  }
  exercises: ExerciseSummary[]
}
