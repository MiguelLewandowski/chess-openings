'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore, type ExerciseMove, type SessionMode } from '@/store/GameStore'
import { Card } from '@/components/ui'
import CoachConsole from './CoachConsole'
import ProgressTracker from './ProgressTracker'

export interface SessionExercise {
  id: string
  initialFen: string
  moves: ExerciseMove[]
  intro?: string | null
}

// One lesson run: the line is shown first (watch), then the student plays it from memory
// (practice). `watch` is absent for reviews and cards, which go straight to recall.
export default function LessonSession({
  watch,
  practice,
  nextUrl,
  nextLabel,
}: {
  watch: SessionExercise | null
  practice: SessionExercise
  nextUrl: string
  nextLabel: string
}) {
  const [mode, setMode] = useState<SessionMode>(watch ? 'watch' : 'practice')
  const setupExercise = useGameStore((s) => s.setupExercise)
  const initializedFor = useRef<string | null>(null)

  const exercise = mode === 'watch' && watch ? watch : practice

  useEffect(() => {
    // Only (re)initialize when the exercise or the stage changes. Recording a completion runs
    // a Server Action that refreshes the page and hands us new prop references; without this
    // guard they would reset the board right after the result screen appears.
    const key = `${mode}:${exercise.id}`
    if (initializedFor.current === key) return
    initializedFor.current = key
    setupExercise(exercise.initialFen, exercise.moves, { exerciseId: exercise.id, intro: exercise.intro, mode })
  }, [mode, exercise, setupExercise])

  // Until the effect above runs, the store still holds its defaults (or the previous
  // exercise), and rendering the console from it would flash the wrong stage.
  const ready = useGameStore((s) => s.exerciseId === exercise.id && s.mode === mode)
  if (!ready) {
    return <Card aria-busy className="h-72 animate-pulse bg-surface-sunken" />
  }

  return (
    <>
      <ProgressTracker />
      <CoachConsole
        nextLessonUrl={nextUrl}
        nextLabel={nextLabel}
        tracksProgress
        onStartPractice={watch ? () => setMode('practice') : undefined}
        onRewatch={watch ? () => setMode('watch') : undefined}
      />
    </>
  )
}
