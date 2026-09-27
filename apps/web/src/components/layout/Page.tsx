import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Horizontal padding shared by the header and the body, so their content lines up at every
// breakpoint. Pages use the full width of the shell; each one limits the width of what reads
// better narrow (a form, a lesson path) instead of capping the whole page.
const GUTTER = 'px-4 sm:px-6 lg:px-8 2xl:px-10'

// Sticky bar at the top of a page. Below `lg` the shell shows its own 56px menu bar, so the
// header sticks right under it.
export function PageHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header className="sticky top-14 lg:top-0 z-20 border-b border-border-subtle bg-surface-card/90 backdrop-blur-md">
      <div className={cn(GUTTER, 'min-h-16 py-2.5 flex items-center justify-between gap-3 sm:gap-4', className)}>
        {children}
      </div>
    </header>
  )
}

// Page content. It is a size container, so layouts respond to the space the page actually has
// (the sidebar and side columns take part of the viewport) via @-variants. `className` goes
// on an inner element: a container query never matches the container itself, so @-variants
// placed on <main> would silently never apply.
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn(GUTTER, '@container py-6 sm:py-8')}>
      <div className={className}>{children}</div>
    </main>
  )
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="min-w-0">
      <h1 className="font-display font-extrabold text-[17px] sm:text-[19px] tracking-tight text-ink-900 truncate">
        {children}
      </h1>
      {subtitle && <p className="text-[12px] text-ink-400 font-medium truncate">{subtitle}</p>}
    </div>
  )
}
