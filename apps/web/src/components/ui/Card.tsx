import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

export type CardElevation = 'flat' | 'raised' | 'elevated'

const elevations: Record<CardElevation, string> = {
  flat:     'border border-border-subtle',
  raised:   'border border-border-subtle shadow-sm',
  elevated: 'border border-border-default shadow-md',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation
  accent?: boolean
}

export function Card({ elevation = 'raised', accent, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card rounded-[12px]',
        elevations[elevation],
        accent && 'border-t-2 border-t-accent',
        className,
      )}
      {...props}
    />
  )
}
