import { cn } from '@/lib/cn'

// The logo: a 2×2 corner of a chessboard. Drawn in SVG instead of the "♞" character, which
// some systems render as a colour emoji.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('w-8 h-8 shrink-0', className)}>
      <rect width="32" height="32" rx="9" className="fill-ink-900" />
      <rect x="8" y="8" width="8" height="8" rx="1.5" className="fill-surface-card" />
      <rect x="16" y="16" width="8" height="8" rx="1.5" className="fill-surface-card" />
      <rect x="16" y="8" width="8" height="8" rx="1.5" className="fill-ink-600" />
      <rect x="8" y="16" width="8" height="8" rx="1.5" className="fill-ink-600" />
    </svg>
  )
}
