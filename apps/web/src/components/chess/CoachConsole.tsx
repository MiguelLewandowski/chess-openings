'use client'

import { useGameStore, type ExerciseMove, type GameStatus } from '@/store/GameStore'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  RefreshCcw,
  Star,
  Swords,
  Trophy,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import type { ExerciseCompletion } from '@chess-openings/domain'
import { Button, buttonClasses, Card, StatusPill } from '@/components/ui'
import { useOpponentReveal } from '@/hooks/useOpponentReveal'
import { cn } from '@/lib/cn'
import { gameCopy } from '@/lib/coach-message'
import { formatNextReview } from '@/lib/profile'

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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

interface CoachConsoleProps {
  nextLessonUrl?: string
  nextLabel?: string
  // Lesson flow: the demonstration hands over to practice, and a finished practice can go
  // back to the demonstration. Reviews and cards pass neither: showing the line would give
  // the recall away.
  onStartPractice?: () => void
  onRewatch?: () => void
  // Signed-in practice: the run is recorded and the result screen shows what it earned.
  tracksProgress?: boolean
}

export default function CoachConsole({
  nextLessonUrl = '/openings',
  nextLabel = 'Próxima lição',
  onStartPractice,
  onRewatch,
  tracksProgress = false,
}: CoachConsoleProps) {
  const { comment, status, mode, playNextMove, playPreviousMove, exerciseMoves, currentNodeId, restartExercise } =
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

  if (mode === 'practice' && status === 'completed') {
    return (
      <PracticeResult
        comment={comment}
        tracksProgress={tracksProgress}
        nextLessonUrl={nextLessonUrl}
        nextLabel={nextLabel}
        onRestart={restartExercise}
        onRewatch={onRewatch}
      />
    )
  }

  const progress = computeProgress(exerciseMoves, currentNodeId, status)
  const watching = mode === 'watch'

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border-subtle bg-surface-sunken">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-bold tracking-tight text-ink-900 flex items-center gap-2 text-[14px]">
            {watching ? <Eye className="w-5 h-5 text-accent" /> : <Swords className="w-5 h-5 text-accent" />}
            {watching ? 'Veja a linha' : 'Sua vez'}
          </h3>
          {onStartPractice || onRewatch ? (
            <span className="text-[12px] font-semibold text-ink-500">Passo {watching ? 1 : 2} de 2</span>
          ) : (
            <span className="text-[12px] font-semibold text-ink-500">{progress}%</span>
          )}
        </div>

        <div className="h-1.5 w-full bg-surface-app rounded-full overflow-hidden border border-border-subtle">
          <div className="h-full bg-accent rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col">
        {!watching && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <StatusPill status={status} />
            <RunCounters />
          </div>
        )}

        <div
          className={cn(
            'flex-1 rounded-[10px] p-5 transition-colors duration-300 border',
            status === 'error' ? 'bg-danger-soft border-[#E0483D]/20' : 'bg-surface-sunken border-border-subtle',
          )}
        >
          <p className={cn('text-[15px] leading-relaxed', status === 'error' ? 'text-danger' : 'text-ink-700')}>{comment}</p>
        </div>

        {watching ? (
          <WatchControls
            status={status}
            canGoBack={Boolean(currentNodeId)}
            onPrevious={playPreviousMove}
            onNext={playNextMove}
            onReplay={restartExercise}
            onStartPractice={onStartPractice}
          />
        ) : (
          <PracticeControls status={status} onContinue={playNextMove} />
        )}
      </div>
    </Card>
  )
}

function WatchControls({
  status,
  canGoBack,
  onPrevious,
  onNext,
  onReplay,
  onStartPractice,
}: {
  status: GameStatus
  canGoBack: boolean
  onPrevious: () => void
  onNext: () => void
  onReplay: () => void
  onStartPractice?: () => void
}) {
  if (status === 'completed') {
    return (
      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <Button variant="secondary" onClick={onReplay}>
          <RefreshCcw className="w-4 h-4" />
          Ver de novo
        </Button>
        {onStartPractice && (
          <Button onClick={onStartPractice} className="flex-1">
            Agora é sua vez
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className="flex items-center justify-center p-3 bg-surface-sunken hover:bg-surface-app border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed text-ink-600 rounded-[8px] transition-all active:scale-95"
          title="Lance anterior (seta esquerda)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Button onClick={onNext} className="flex-1" title="Próximo lance (seta direita)">
          Próximo lance
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      {onStartPractice && (
        <button
          onClick={onStartPractice}
          className="text-[13px] font-semibold text-ink-500 hover:text-ink-900 transition-colors self-center"
        >
          Já conheço a linha — ir para a prática
        </button>
      )}
    </div>
  )
}

function PracticeControls({ status, onContinue }: { status: GameStatus; onContinue: () => void }) {
  const hintLevel = useGameStore((s) => s.hintLevel)
  const requestHint = useGameStore((s) => s.requestHint)

  // Only the landing's blunder demo pauses on the opponent's move; lessons reply on their own.
  if (status === 'waiting') {
    return (
      <Button onClick={onContinue} className="mt-5 w-full">
        Continuar
        <ArrowRight className="w-5 h-5" />
      </Button>
    )
  }

  const label = hintLevel === 0 ? 'Dica: qual peça?' : hintLevel === 1 ? 'Mostrar o lance' : 'Lance mostrado'

  return (
    <div className="mt-5 flex flex-col gap-2">
      <Button
        variant="secondary"
        onClick={requestHint}
        disabled={hintLevel === 2 || status === 'thinking'}
        className="w-full"
      >
        <Lightbulb className="w-4 h-4" />
        {label}
      </Button>
      <p className="text-[12px] text-ink-400 text-center leading-relaxed">
        Erros e dicas reduzem o XP e trazem a linha de volta mais cedo.
      </p>
    </div>
  )
}

function RunCounters() {
  const mistakes = useGameStore((s) => s.mistakes)
  const hints = useGameStore((s) => s.pieceHints + s.revealedMoves)
  if (mistakes === 0 && hints === 0) return null

  return (
    <div className="flex items-center gap-3 text-[12px] font-semibold text-ink-500">
      {mistakes > 0 && (
        <span className="inline-flex items-center gap-1" title="Erros">
          <XCircle className="w-3.5 h-3.5 text-danger" />
          {mistakes}
        </span>
      )}
      {hints > 0 && (
        <span className="inline-flex items-center gap-1" title="Dicas">
          <Lightbulb className="w-3.5 h-3.5 text-warning" />
          {hints}
        </span>
      )}
    </div>
  )
}

function resultTitle(completion: ExerciseCompletion | null): string {
  if (!completion) return 'Linha concluída'
  if (completion.quality === 5) return 'Perfeito!'
  if (completion.quality === 4) return 'Muito bem!'
  if (completion.quality === 3) return 'Linha concluída'
  return 'Vamos reforçar essa linha'
}

function PracticeResult({
  comment,
  tracksProgress,
  nextLessonUrl,
  nextLabel,
  onRestart,
  onRewatch,
}: {
  comment: string
  tracksProgress: boolean
  nextLessonUrl: string
  nextLabel: string
  onRestart: () => void
  onRewatch?: () => void
}) {
  const completion = useGameStore((s) => s.completion)
  const mistakes = useGameStore((s) => s.mistakes)
  const hints = useGameStore((s) => s.pieceHints + s.revealedMoves)
  const passed = !completion || completion.quality >= 3

  return (
    <Card
      className={cn(
        'flex flex-col h-full p-6 sm:p-8 animate-in fade-in zoom-in duration-500',
        passed ? 'border-[#2EA05D]/30' : 'border-[#E8930F]/30',
      )}
    >
      <div className="flex flex-col items-center text-center gap-5">
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', passed ? 'bg-success-soft' : 'bg-warning-soft')}>
          {passed ? <Trophy className="w-8 h-8 text-success" /> : <RefreshCcw className="w-7 h-7 text-warning" />}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-[22px] tracking-tight text-ink-900">{resultTitle(completion)}</h3>
          <p className="text-[13px] font-medium text-ink-500">
            {mistakes === 0 && hints === 0 ? 'Sem erros e sem dicas' : `${plural(mistakes, 'erro', 'erros')} · ${plural(hints, 'dica', 'dicas')}`}
          </p>
        </div>

        {tracksProgress && (
          completion ? (
            <div className="w-full grid grid-cols-2 gap-2">
              <div className="rounded-[10px] bg-reward-subtle border border-reward/20 px-3 py-3">
                <p className="flex items-center justify-center gap-1.5 font-display font-extrabold text-[20px] text-reward-strong">
                  <Star className="w-4 h-4 fill-reward-strong" />+{completion.xpEarned} XP
                </p>
              </div>
              <div className="rounded-[10px] bg-surface-sunken border border-border-subtle px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">Próxima revisão</p>
                <p className="font-semibold text-[14px] text-ink-900">{formatNextReview(completion.nextReview)}</p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-ink-400" aria-live="polite">Calculando seu XP…</p>
          )
        )}

        {/* The last move's explanation matters (on a card it is the answer); the generic line does not. */}
        {comment && comment !== gameCopy.lessonCompleted && <p className="text-ink-600 text-[15px] leading-relaxed max-w-md">{comment}</p>}

        <div className="pt-2 w-full flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
          <Button variant="secondary" onClick={onRestart}>
            <RefreshCcw className="w-4 h-4" />
            Refazer
          </Button>
          {onRewatch && (
            <Button variant="secondary" onClick={onRewatch}>
              <Eye className="w-4 h-4" />
              Rever a linha
            </Button>
          )}
          <Link href={nextLessonUrl} className={buttonClasses({ className: 'sm:flex-1' })}>
            {nextLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
