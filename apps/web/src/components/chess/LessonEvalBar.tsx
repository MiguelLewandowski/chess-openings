'use client'

import { useGameStore } from '@/store/GameStore'
import { useEngineEvaluation } from '@/hooks/useEngineEvaluation'
import { evalBarTarget, fromStoredCp } from '@/lib/eval-bar'
import EvalBar from './EvalBar'

// Low on purpose: the lesson only needs a rough number, and it runs on every move.
const LESSON_DEPTH = 12

// The lesson's evaluation bar. It uses the evaluation stored at import when the move has
// one and asks the in-browser Stockfish otherwise; in practice it never shows the position
// the student still has to answer.
export default function LessonEvalBar({ className }: { className?: string }) {
  const exerciseMoves = useGameStore((s) => s.exerciseMoves)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const mode = useGameStore((s) => s.mode)
  const status = useGameStore((s) => s.status)
  const initialFen = useGameStore((s) => s.initialFen)
  const playerColor = useGameStore((s) => s.playerColor)

  const target = evalBarTarget(exerciseMoves, currentNodeId, mode, status)
  const node = target?.nodeId ? exerciseMoves.find((m) => m.id === target.nodeId) : undefined
  const fen = node ? node.fen : initialFen
  const stored = node?.absoluteCp ?? null

  const computed = useEngineEvaluation(fen, { enabled: target !== null && stored === null && fen !== '', depth: LESSON_DEPTH })
  const evaluation = stored !== null ? fromStoredCp(stored) : computed

  return (
    <EvalBar
      evaluation={evaluation}
      orientation={playerColor}
      hidden={target === null}
      stale={target !== null && !target.current}
      className={className}
    />
  )
}
