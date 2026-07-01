import { CheckCircle2, XCircle } from 'lucide-react'
import type { GameStatus } from '@/store/GameStore'

const DOT_DELAYS = [0, 150, 300]

export function StatusPill({ status }: { status: GameStatus }) {
  if (status === 'thinking') {
    return (
      <div className="flex items-center gap-2 w-fit text-[13px] font-medium text-ink-500 bg-surface-sunken px-3 py-1.5 rounded-full border border-border-subtle">
        <span className="flex gap-1">
          {DOT_DELAYS.map((d) => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
        Adversário pensando…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 w-fit text-[13px] font-medium text-danger bg-danger-soft px-3 py-1.5 rounded-full border border-[#E0483D]/20">
        <XCircle className="w-4 h-4" />
        Lance incorreto
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 w-fit text-[13px] font-medium text-success bg-success-soft px-3 py-1.5 rounded-full border border-[#2EA05D]/20">
      <CheckCircle2 className="w-4 h-4" />
      Sua vez
    </div>
  )
}
