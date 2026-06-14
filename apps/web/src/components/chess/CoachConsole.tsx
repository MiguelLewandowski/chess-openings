'use client'

import { useGameStore, type ExerciseMove, type GameStatus } from '@/store/GameStore'
import { BrainCircuit, Trophy, ArrowRight, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button, buttonClasses, Card, StatusPill } from '@/components/ui'
import { useOpponentReveal } from '@/hooks/useOpponentReveal'
import { cn } from '@/lib/cn'

// How far the player has advanced through the deepest line, as a percentage.
function computeProgress(moves: ExerciseMove[], currentNodeId: string | null, status: GameStatus): number {
  if (status === 'completed') return 100
  if (moves.length === 0) return 0

  const depthFrom = (nodeId: string | null): number => {
    const children = moves.filter((m) => m.parentId === nodeId)
    return children.length === 0 ? 0 : 1 + Math.max(...children.map((c) => depthFrom(c.id)))
  }
  const totalDepth = depthFrom(null)

  let currentDepth = 0
  let current = moves.find((m) => m.id === currentNodeId)
  while (current) {
    currentDepth++
    current = moves.find((m) => m.id === current?.parentId)
  }

  return totalDepth > 0 ? Math.round((currentDepth / totalDepth) * 100) : 0
}

export default function CoachConsole({ nextLessonUrl = '/openings' }: { nextLessonUrl?: string }) {
  const { comment, status, playNextMove, playPreviousMove, exerciseMoves, currentNodeId, restartExercise } =
    useGameStore()

  useOpponentReveal()

  // Keyboard shortcuts: arrows step through the line.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') playNextMove()
      else if (e.key === 'ArrowLeft') playPreviousMove()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playNextMove, playPreviousMove])

  if (status === 'completed') {
    return (
      <Card className="flex flex-col h-full border-violet-500/50 shadow-violet-500/10 p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-6">
          <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-2 animate-pulse">
            <Trophy className="w-10 h-10 text-violet-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-50">Lição concluída</h3>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">{comment}</p>
          </div>

          <div className="pt-8 w-full flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" onClick={restartExercise}>
              <RefreshCcw className="w-4 h-4" />
              Refazer lição
            </Button>
            <Link href={nextLessonUrl} className={buttonClasses()}>
              Próxima lição
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  const progress = computeProgress(exerciseMoves, currentNodeId, status)
  const isError = status === 'error'
  const isWaiting = status === 'waiting'

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold tracking-tight text-slate-200 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            Análise do Mestre
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">{progress}%</span>
        </div>

        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-6 flex items-center gap-3">
          <StatusPill status={status} />
        </div>

        <div
          className={cn(
            'flex-1 rounded-xl p-6 transition-colors duration-300 border',
            isError ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-800/50 border-slate-700/50',
          )}
        >
          <p className={cn('text-lg leading-relaxed', isError ? 'text-rose-200' : 'text-slate-300')}>{comment}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={playPreviousMove}
            disabled={!currentNodeId}
            className="flex items-center justify-center p-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-xl transition-all active:scale-95"
            title="Lance anterior (seta esquerda)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <Button
            variant={isWaiting ? 'primary' : 'secondary'}
            onClick={playNextMove}
            disabled={status === 'thinking'}
            className="flex-1"
            title="Próximo lance (seta direita)"
          >
            {isWaiting ? 'Continuar' : 'Revelar lance'}
            {isWaiting ? <ArrowRight className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
