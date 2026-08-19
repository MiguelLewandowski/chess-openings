'use client'

// Last-resort boundary for errors thrown in the root layout itself, where `error.tsx`
// never renders. It replaces the whole document, so it must ship its own <html>/<body>
// and cannot rely on the app's styles being mounted.

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erro global:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#faf9f7', color: '#1a1a1a' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>A aplicação falhou ao carregar</h1>
          <p style={{ color: '#6b6b6b', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
            Recarregue a página. Se o erro continuar, tente novamente em alguns minutos.
          </p>
          <button
            onClick={reset}
            style={{
              height: '40px',
              padding: '0 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#1a1a1a',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
