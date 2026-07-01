import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

export type BadgeTone = 'accent' | 'reward' | 'success' | 'danger' | 'warning' | 'neutral'

const tones: Record<BadgeTone, string> = {
  accent:  'bg-accent-soft text-accent border-accent/20',
  reward:  'bg-reward-soft text-reward-strong border-reward/20',
  success: 'bg-success-soft text-success border-[#2EA05D]/20',
  danger:  'bg-danger-soft text-danger border-[#E0483D]/20',
  warning: 'bg-warning-soft text-warning border-[#E8930F]/20',
  neutral: 'bg-surface-sunken text-ink-500 border-border-default',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
