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

export interface IngestExerciseData {
  title: string
  type: 'THEORY' | 'PRACTICE'
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
  lessons: IngestLessonData[]
}
