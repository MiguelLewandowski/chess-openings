import type { LessonSummary } from './opening.read-model'

export interface MoveSummary {
  id: string
  san: string
  fen: string
  parentId: string | null
  isOpponentResponse: boolean
  coachInsights?: { comment?: string; theme?: string } | null
  visualMarkers?: { arrows?: string[]; circles?: string[] } | null
  // Engine evaluation of the position after the move, in centipawns from White's point of
  // view. Null when the import had none (older openings, or a mate the cloud reported).
  absoluteCp?: number | null
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
    // A tutorial's lessons are never brought back for review.
    isTutorial: boolean
    // With their branches, so the next lesson can be the next one of the same branch.
    lessons: LessonSummary[]
  }
  exercises: ExerciseSummary[]
}

// Returned when a practice run is recorded, so the completion screen can show what it earned.
// `nextReview` is an ISO string because this shape crosses HTTP; it and `intervalDays` are null
// for a tutorial, which is never brought back for review.
export interface ExerciseCompletion {
  quality: number
  xpEarned: number
  intervalDays: number | null
  nextReview: string | null
}
