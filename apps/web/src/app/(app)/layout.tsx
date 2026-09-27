import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import AppShell from '@/components/layout/AppShell'

// Every page here is per user, so none can be prerendered at build time. Declaring it keeps
// `next build` from trying (and calling the API, whose address only exists at runtime).
export const dynamic = 'force-dynamic'

// Every route in this group requires a session, so the check lives here once instead of
// being repeated (or forgotten) in each page.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <AppShell user={{ name: session.name ?? null, email: session.email, isAdmin: session.role === 'ADMIN' }}>
      {children}
    </AppShell>
  )
}
