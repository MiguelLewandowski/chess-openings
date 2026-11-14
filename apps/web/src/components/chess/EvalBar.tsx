import { cn } from '@/lib/cn'
import { formatEvaluation, whiteShare, type Evaluation } from '@/lib/eval-bar'

interface EvalBarProps {
  // Null while the first result is being computed.
  evaluation: Evaluation | null
  // The board's orientation: that side's part of the bar grows from the bottom (or the left).
  orientation: 'white' | 'black'
  // Practice before the student's move: nothing is shown, not even a neutral bar.
  hidden?: boolean
  // The bar shows an earlier position than the board's.
  stale?: boolean
  className?: string
}

// The engine's evaluation as a white/black split: vertical beside the board on wider screens,
// a thin horizontal strip above it on phones.
export default function EvalBar({ evaluation, orientation, hidden = false, stale = false, className }: EvalBarProps) {
  const shown = !hidden && evaluation !== null
  const share = shown ? whiteShare(evaluation) : 50
  const label = hidden ? '?' : evaluation ? formatEvaluation(evaluation) : '…'
  const description = hidden
    ? 'Avaliação oculta até você jogar o seu lance'
    : evaluation
      ? `Avaliação do Stockfish: ${label}${stale ? ', depois do seu último lance' : ''}`
      : 'Calculando a avaliação'

  const whiteFromStart = orientation === 'white'
  const whiteAhead = share >= 50
  // The number sits on the edge of the side that is better, in that side's own color.
  const labelAtStart = whiteAhead === whiteFromStart

  return (
    <div role="img" aria-label={description} title={description} className={cn('flex w-full sm:w-7 shrink-0', className)}>
      <div className="flex sm:hidden items-center gap-2 w-full">
        <div
          className={cn(
            'relative h-2 flex-1 rounded-full overflow-hidden ring-1 ring-border-default',
            hidden ? 'bg-surface-sunken' : 'bg-piece-black',
          )}
        >
          {!hidden && (
            <div
              className={cn(
                'absolute inset-y-0 bg-piece-white motion-safe:transition-[width] duration-700 ease-out',
                whiteFromStart ? 'left-0' : 'right-0',
                stale && 'opacity-70',
              )}
              style={{ width: `${share}%` }}
            />
          )}
        </div>
        <span
          className={cn(
            'w-10 text-right font-mono text-[12px] font-semibold tabular-nums',
            shown && !stale ? 'text-ink-700' : 'text-ink-400',
          )}
        >
          {label}
        </span>
      </div>

      <div
        className={cn(
          'hidden sm:block relative w-full rounded-[8px] overflow-hidden ring-1 ring-border-default',
          hidden ? 'bg-surface-sunken' : 'bg-piece-black',
          stale && 'opacity-60',
        )}
      >
        {!hidden && (
          <div
            className={cn(
              'absolute inset-x-0 bg-piece-white motion-safe:transition-[height] duration-700 ease-out',
              whiteFromStart ? 'bottom-0' : 'top-0',
            )}
            style={{ height: `${share}%` }}
          />
        )}
        <span
          className={cn(
            'absolute inset-x-0 text-center font-mono text-[10px] font-bold tabular-nums leading-none',
            !shown ? 'top-1/2 -translate-y-1/2 text-ink-400' : labelAtStart ? 'bottom-1.5' : 'top-1.5',
            shown && (whiteAhead ? 'text-piece-black' : 'text-piece-white'),
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
