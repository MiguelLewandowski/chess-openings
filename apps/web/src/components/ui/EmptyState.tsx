import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-24 px-4 text-center', className)}>
      <div className="w-20 h-20 bg-surface-sunken border border-border-default rounded-full flex items-center justify-center mb-6 text-ink-400">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-ink-900 mb-2">{title}</h2>
      {description && (
        <div className="text-ink-500 max-w-md mb-6 leading-relaxed text-[15px]">{description}</div>
      )}
      {action}
    </div>
  )
}
