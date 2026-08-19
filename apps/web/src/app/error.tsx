'use client'

// Route-level error boundary. Server Components call the API directly, so an API that is
// down or slow throws during render — without this the user gets Next's raw error screen
// with no way back.

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button, EmptyState, buttonClasses } from '@/components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro na rota:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center">
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="Algo deu errado"
        description="Não conseguimos carregar esta página. Pode ser uma instabilidade temporária na conexão com o servidor."
        action={
          <div className="flex items-center gap-3">
            <Button onClick={reset}>Tentar novamente</Button>
            <Link href="/openings" className={buttonClasses({ variant: 'secondary' })}>
              Voltar ao catálogo
            </Link>
          </div>
        }
      />
    </div>
  )
}
