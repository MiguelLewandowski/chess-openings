import type { CoachInsight } from '../services/ICoachService'
import type { VisualMarkers } from '../services/IPgnParser'

export interface IngestMoveNode {
  san: string
  fen: string
  isOpponentResponse: boolean
  absoluteCp?: number | null
  complexity?: string | null
  coachInsights?: CoachInsight | null
  visualMarkers?: VisualMarkers | null
  children: IngestMoveNode[]
}

export type CardKind = 'CRITICAL' | 'TRAP'

export interface IngestExerciseData {
  title: string
  type: 'THEORY' | 'PRACTICE'
  // Set on the short drills attached to a lesson; null for its theory and main practice.
  cardKind: CardKind | null
  description: string | null
  initialFen: string
  moves: IngestMoveNode[]
}

export interface IngestLessonData {
  title: string
  order: number
  initialFen: string
  exercises: IngestExerciseData[]
}

export interface IngestStudyData {
  openingName: string
  openingSlug: string
  styleTags: string[]
  isTutorial: boolean
  lessons: IngestLessonData[]
}
