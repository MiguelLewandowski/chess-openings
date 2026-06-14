import { CheckCircle2, XCircle } from 'lucide-react'
import type { GameStatus } from '@/store/GameStore'

const DOT_DELAYS = [0, 150, 300]

// Compact indicator of whose turn it is, derived from the session status.
export function StatusPill({ status }: { status: GameStatus }) {
  if (status === 'thinking') {
    return (
      <div className="flex items-center gap-2 w-fit text-sm font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
        <span className="flex gap-1">
          {DOT_DELAYS.map((d) => (
            <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </span>
        Adversário pensando...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 w-fit text-sm font-medium text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
        <XCircle className="w-4 h-4" /> Lance incorreto
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 w-fit text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
      <CheckCircle2 className="w-4 h-4" /> Sua vez
    </div>
  )
}
