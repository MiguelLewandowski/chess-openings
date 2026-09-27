'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Download, LogOut, Menu, Radio, UserRound, X, type LucideIcon } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth.actions'
import { cn } from '@/lib/cn'

export interface ShellUser {
  name: string | null
  email: string
  isAdmin: boolean
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: '/profile', label: 'Perfil', icon: UserRound },
  { href: '/openings', label: 'Aberturas', icon: BookOpen },
  { href: '/live', label: 'Ao vivo', icon: Radio },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/import', label: 'Importar estudo', icon: Download },
]

// Lessons are reached from the openings catalog, so they keep "Aberturas" highlighted.
function isActive(pathname: string, href: string): boolean {
  if (href === '/openings') return pathname.startsWith('/openings') || pathname.startsWith('/lessons')
  return pathname.startsWith(href)
}

function Logo() {
  return (
    <Link href="/profile" className="flex items-center gap-2.5 no-underline">
      <div className="w-8 h-8 bg-ink-900 rounded-[9px] flex items-center justify-center text-[20px] text-surface-card">
        ♞
      </div>
      <span className="font-display font-extrabold text-[17px] tracking-tight text-ink-900 leading-none">
        Chess Openings
        <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-400 mt-1">
          Aprenda jogando
        </span>
      </span>
    </Link>
  )
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-2.5 py-2 rounded-[8px] text-[14px] transition-colors',
        active
          ? 'bg-accent-soft text-accent font-semibold'
          : 'text-ink-500 font-medium hover:bg-surface-sunken hover:text-ink-900',
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      {item.label}
    </Link>
  )
}

function SidebarContent({ user, pathname, onNavigate }: { user: ShellUser; pathname: string; onNavigate: () => void }) {
  const displayName = user.name || user.email

  return (
    <div className="flex flex-col h-full px-3.5 py-5">
      <div className="px-2 pb-5">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Navegação principal">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}

        {user.isAdmin && (
          <>
            <p className="px-2.5 pt-5 pb-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-ink-400">
              Administração
            </p>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-1 p-1.5 rounded-[8px] bg-surface-sunken">
        <Link
          href="/profile"
          onClick={onNavigate}
          title="Ver perfil"
          className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-[6px] hover:bg-surface-card transition-colors"
        >
          <div
            aria-hidden
            className="w-9 h-9 shrink-0 rounded-full bg-accent text-surface-card flex items-center justify-center font-display font-bold text-[15px]"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink-900 truncate">{displayName}</p>
            {user.name && <p className="text-[12px] text-ink-500 truncate">{user.email}</p>}
          </div>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="w-8 h-8 shrink-0 rounded-[6px] flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-surface-card transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  return (
    <div className="flex min-h-screen bg-surface-app text-ink-900 font-body">
      <aside className="hidden lg:block w-(--sidebar-width) shrink-0 sticky top-0 h-screen border-r border-border-subtle bg-surface-card">
        <SidebarContent user={user} pathname={pathname} onNavigate={closeDrawer} />
      </aside>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-900/40" onClick={closeDrawer} />
          <aside id="app-drawer" className="absolute inset-y-0 left-0 w-(--sidebar-width) max-w-[85vw] bg-surface-card shadow-xl">
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Fechar menu"
              className="absolute top-4 right-3 w-8 h-8 rounded-[6px] flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-surface-sunken"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent user={user} pathname={pathname} onNavigate={closeDrawer} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Below lg, PageHeader sticks at top-14 so it sits under this bar. */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-border-subtle bg-surface-card/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={drawerOpen}
            aria-controls="app-drawer"
            className="w-9 h-9 -ml-1.5 rounded-[8px] flex items-center justify-center text-ink-700 hover:bg-surface-sunken"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo />
        </header>

        {children}
      </div>
    </div>
  )
}
