import Link from 'next/link'
import { Crosshair, Swords, ChevronRight } from 'lucide-react'
import type { ExerciseSummary } from '@chess-openings/domain'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'

export const CARD_KIND_LABEL = {
  CRITICAL: 'Posição crítica',
  TRAP: 'Armadilha',
} as const

// The short drills attached to a lesson. Each one is its own spaced-repetition item, so
// it also shows up in the reviews on its own schedule.
export function LessonCards({ lessonId, cards, activeId }: { lessonId: string; cards: ExerciseSummary[]; activeId: string }) {
  if (cards.length === 0) return null

  return (
    <Card className="p-4 sm:p-5">
      <p className="font-display font-bold text-[15px] text-ink-900">Cartões de treino</p>
      <p className="text-[12px] text-ink-500 mb-3">Momentos-chave desta lição, revisados no tempo certo.</p>
      <ul className="flex flex-col gap-1.5">
        {cards.map((card) => {
          const Icon = card.cardKind === 'TRAP' ? Swords : Crosshair
          const active = card.id === activeId
          return (
            <li key={card.id}>
              <Link
                href={`/lessons/${lessonId}?exercise=${card.id}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors',
                  active ? 'bg-accent-soft' : 'hover:bg-surface-sunken',
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
                    card.cardKind === 'TRAP' ? 'bg-danger-soft text-danger' : 'bg-reward-soft text-reward-strong',
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-400">
                    {card.cardKind ? CARD_KIND_LABEL[card.cardKind] : ''}
                  </span>
                  <span className={cn('block text-[13px] font-semibold truncate', active ? 'text-accent' : 'text-ink-900')}>
                    {card.title.replace(/^(Crítica|Armadilha):\s*/i, '')}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-ink-300 shrink-0" />
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
