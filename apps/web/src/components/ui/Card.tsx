import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/20', className)}
      {...props}
    />
  )
}
