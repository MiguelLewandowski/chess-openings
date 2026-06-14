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
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">{icon}</div>
      <h2 className="text-xl font-bold text-slate-200 mb-2">{title}</h2>
      {description && <div className="text-slate-400 max-w-md mb-6 leading-relaxed">{description}</div>}
      {action}
    </div>
  )
}
