import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

export type BadgeTone = 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'slate'

const tones: Record<BadgeTone, string> = {
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'slate', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border', tones[tone], className)}
      {...props}
    />
  )
}
