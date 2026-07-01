'use client'

import { useGameStore, type ExerciseMove, type GameStatus } from '@/store/GameStore'
import { BrainCircuit, Trophy, ArrowRight, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button, buttonClasses, Card, StatusPill } from '@/components/ui'
import { useOpponentReveal } from '@/hooks/useOpponentReveal'
import { cn } from '@/lib/cn'

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
      <Card className="flex flex-col h-full border-[#2EA05D]/30 p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-6">
          <div className="w-20 h-20 bg-success-soft rounded-full flex items-center justify-center mb-2">
            <Trophy className="w-10 h-10 text-success" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-[22px] tracking-tight text-ink-900">Lição concluída</h3>
            <p className="text-ink-600 text-[16px] leading-relaxed max-w-md">{comment}</p>
          </div>

          <div className="pt-8 w-full flex flex-col sm:flex-row gap-3 justify-center">
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
      <div className="p-5 border-b border-border-subtle bg-surface-sunken">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold tracking-tight text-ink-900 flex items-center gap-2 text-[14px]">
            <BrainCircuit className="w-5 h-5 text-accent" />
            Análise do Mestre
          </h3>
          <span className="text-[12px] font-semibold text-ink-500 bg-surface-app px-2.5 py-1 rounded-full border border-border-subtle">{progress}%</span>
        </div>

        <div className="h-1.5 w-full bg-surface-app rounded-full overflow-hidden border border-border-subtle">
          <div className="h-full bg-accent rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="mb-5 flex items-center gap-3">
          <StatusPill status={status} />
        </div>

        <div
          className={cn(
            'flex-1 rounded-[10px] p-5 transition-colors duration-300 border',
            isError
              ? 'bg-danger-soft border-[#E0483D]/20'
              : 'bg-surface-sunken border-border-subtle',
          )}
        >
          <p className={cn('text-[15px] leading-relaxed', isError ? 'text-danger' : 'text-ink-700')}>{comment}</p>
        </div>

        <div className="mt-5 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={playPreviousMove}
            disabled={!currentNodeId}
            className="flex items-center justify-center p-3 bg-surface-sunken hover:bg-surface-app border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed text-ink-600 rounded-[8px] transition-all active:scale-95"
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
